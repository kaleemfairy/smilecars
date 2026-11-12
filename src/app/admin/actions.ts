"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertStaff } from "@/lib/auth";
import { adminAuth, adminBucket, adminDb } from "@/lib/firebase/admin";
import { getDownloadURL } from "firebase-admin/storage";
import { changeBookingStatus, extendHold, updateStaffNotes } from "@/lib/bookings";
import { getAllCars, TAGS } from "@/lib/data";
import { notifyConfirmed } from "@/lib/notifications";
import { istToMs } from "@/lib/time";
import { slugify } from "@/lib/format";
import { BODY_TYPES, BOOKING_STATUSES, FUELS, TRANSMISSIONS } from "@/lib/types";

// Every action checks the caller's role on the server. Results are shown with ?ok= / ?error=.

const back = (path: string, kind: "ok" | "error", msg: string): never => {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`);
};
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const numOrNull = (f: FormData, k: string) => {
  const v = str(f, k);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const expireNow = { expire: 0 };

// ---------- Bookings (owner and staff) ----------

export async function setBookingStatus(form: FormData) {
  const staff = await assertStaff();
  const id = str(form, "id");
  const status = z.enum(BOOKING_STATUSES).parse(str(form, "status"));
  const res = await changeBookingStatus(id, status, staff.name || staff.email);
  const path = `/admin/bookings/${id}`;
  if (!res.ok) back(path, "error", res.error);
  if (res.ok && status === "confirmed") await notifyConfirmed(res.booking);
  revalidatePath("/admin");
  back(path, "ok", `Marked ${status}.`);
}

export async function extendBookingHold(form: FormData) {
  await assertStaff();
  const id = str(form, "id");
  const hours = Math.min(48, Math.max(1, Number(str(form, "hours")) || 2));
  try {
    await extendHold(id, hours);
  } catch (err) {
    back(`/admin/bookings/${id}`, "error", err instanceof Error ? err.message : "Could not extend.");
  }
  back(`/admin/bookings/${id}`, "ok", `Hold extended by ${hours} hours.`);
}

export async function saveStaffNotes(form: FormData) {
  await assertStaff();
  const id = str(form, "id");
  await updateStaffNotes(id, str(form, "staffNotes").slice(0, 2000));
  back(`/admin/bookings/${id}`, "ok", "Notes saved.");
}

// ---------- Calendar blocks (owner and staff) ----------

export async function addBlock(form: FormData) {
  const staff = await assertStaff();
  const carId = str(form, "carId");
  const startAt = istToMs(str(form, "startDate"), str(form, "startTime") || "00:00");
  const endAt = istToMs(str(form, "endDate"), str(form, "endTime") || "23:59");
  const reason = z.enum(["servicing", "walk-in", "other"]).catch("other").parse(str(form, "reason"));
  const from = str(form, "from");
  const path = `/admin/calendar${from ? `?from=${from}` : ""}`;
  if (!carId || Number.isNaN(startAt) || Number.isNaN(endAt) || endAt <= startAt) {
    back(path, "error", "Choose a car and a valid start and end.");
  }
  await adminDb().collection("blocks").add({
    carId,
    startAt,
    endAt,
    reason,
    note: str(form, "note").slice(0, 300),
    createdBy: staff.name || staff.email,
    createdAt: Date.now(),
  });
  back(path, "ok", "Block added. The car is now unavailable for those times.");
}

export async function deleteBlock(form: FormData) {
  await assertStaff();
  const id = str(form, "id");
  const from = str(form, "from");
  await adminDb().collection("blocks").doc(id).delete();
  back(`/admin/calendar${from ? `?from=${from}` : ""}`, "ok", "Block removed.");
}

// ---------- Cars (owner) ----------

const carSchema = z.object({
  name: z.string().min(2).max(80),
  bodyType: z.enum(BODY_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  fuel: z.enum(FUELS),
  seats: z.number().int().min(2).max(15),
  dailyRate: z.number().min(1),
});

export async function saveCar(form: FormData) {
  await assertStaff(["owner"]);
  const id = str(form, "id");
  const parsed = carSchema.safeParse({
    name: str(form, "name"),
    bodyType: str(form, "bodyType"),
    transmission: str(form, "transmission"),
    fuel: str(form, "fuel"),
    seats: Number(str(form, "seats")),
    dailyRate: Number(str(form, "dailyRate")),
  });
  const path = id ? `/admin/cars/${id}` : "/admin/cars/new";
  if (!parsed.success) back(path, "error", "Please fill in name, type, transmission, fuel, seats and daily rate.");
  const data = parsed.data!;

  const cars = await getAllCars();
  let slug = slugify(str(form, "slug") || data.name);
  if (!slug) slug = `car-${Date.now()}`;
  if (cars.some((c) => c.slug === slug && c.id !== id)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const doc = {
    ...data,
    slug,
    weeklyRate: numOrNull(form, "weeklyRate"),
    monthlyRate: numOrNull(form, "monthlyRate"),
    includedKmPerDay: numOrNull(form, "includedKmPerDay"),
    extraKmRate: numOrNull(form, "extraKmRate") ?? 0,
    description: str(form, "description").slice(0, 1000),
    features: str(form, "features").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    regNumber: str(form, "regNumber").toUpperCase().slice(0, 20),
    sortOrder: numOrNull(form, "sortOrder") ?? 0,
    active: form.get("active") === "on",
    updatedAt: Date.now(),
  };
  const col = adminDb().collection("cars");
  let carId = id;
  if (id) {
    await col.doc(id).set(doc, { merge: true });
  } else {
    const ref = await col.add({ ...doc, photos: [], createdAt: Date.now() });
    carId = ref.id;
  }
  revalidateTag(TAGS.cars, expireNow);
  back(`/admin/cars/${carId}`, "ok", "Car saved.");
}

export async function uploadCarPhoto(form: FormData) {
  await assertStaff(["owner"]);
  const id = str(form, "id");
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) back(`/admin/cars/${id}`, "error", "Choose a photo first.");
  const photo = file as File;
  if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > 3.5 * 1024 * 1024) {
    back(`/admin/cars/${id}`, "error", "Use a JPG, PNG or WebP photo under 3.5 MB.");
  }
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const object = adminBucket().file(`cars/${id}/${Date.now()}.${ext}`);
  await object.save(Buffer.from(await photo.arrayBuffer()), {
    contentType: photo.type,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });
  const url = await getDownloadURL(object);
  const ref = adminDb().collection("cars").doc(id);
  const snap = await ref.get();
  const photos: string[] = snap.data()?.photos ?? [];
  await ref.update({ photos: [...photos, url], updatedAt: Date.now() });
  revalidateTag(TAGS.cars, expireNow);
  back(`/admin/cars/${id}`, "ok", "Photo added.");
}

export async function changeCarPhoto(form: FormData) {
  await assertStaff(["owner"]);
  const id = str(form, "id");
  const index = Number(str(form, "index"));
  const op = str(form, "op");
  const ref = adminDb().collection("cars").doc(id);
  const photos: string[] = [...((await ref.get()).data()?.photos ?? [])];
  if (!Number.isInteger(index) || index < 0 || index >= photos.length) back(`/admin/cars/${id}`, "error", "Photo not found.");
  if (op === "remove") {
    const [removed] = photos.splice(index, 1);
    // Delete the file too if it lives in our bucket.
    const match = /\/o\/([^?]+)/.exec(removed);
    if (match) await adminBucket().file(decodeURIComponent(match[1])).delete().catch(() => undefined);
  } else if (op === "first") {
    const [moved] = photos.splice(index, 1);
    photos.unshift(moved);
  }
  await ref.update({ photos, updatedAt: Date.now() });
  revalidateTag(TAGS.cars, expireNow);
  back(`/admin/cars/${id}`, "ok", op === "remove" ? "Photo removed." : "Main photo updated.");
}

// ---------- Hubs (owner) ----------

export async function saveHub(form: FormData) {
  await assertStaff(["owner"]);
  const id = str(form, "id");
  const name = str(form, "name");
  if (name.length < 2) back("/admin/hubs", "error", "Hub name is required.");
  const doc = {
    name: name.slice(0, 60),
    area: str(form, "area").slice(0, 120),
    deliveryFee: numOrNull(form, "deliveryFee") ?? 0,
    sortOrder: numOrNull(form, "sortOrder") ?? 0,
    active: form.get("active") === "on",
    updatedAt: Date.now(),
  };
  const col = adminDb().collection("hubs");
  if (id) {
    await col.doc(id).set(doc, { merge: true });
  } else {
    // Readable ids (e.g. "anna-nagar-west") appear in booking links; fall back to a random id on clashes.
    const slug = slugify(name);
    const ref = slug && !(await col.doc(slug).get()).exists ? col.doc(slug) : col.doc();
    await ref.set({ ...doc, createdAt: Date.now() });
  }
  revalidateTag(TAGS.hubs, expireNow);
  back("/admin/hubs", "ok", "Hub saved.");
}

// ---------- Enquiries (owner) ----------

export async function setEnquiryStatus(form: FormData) {
  await assertStaff(["owner"]);
  const status = z.enum(["new", "contacted", "closed"]).parse(str(form, "status"));
  await adminDb().collection("enquiries").doc(str(form, "id")).update({ status });
  back("/admin/enquiries", "ok", "Enquiry updated.");
}

// ---------- Settings, discounts and staff (owner) ----------

const list = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

export async function saveSettings(form: FormData) {
  await assertStaff(["owner"]);
  const holdHours = numOrNull(form, "holdHours");
  if (!holdHours || holdHours < 0.5 || holdHours > 72) back("/admin/settings", "error", "Hold duration must be between 0.5 and 72 hours.");
  const prefix = str(form, "ticketPrefix").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "SC";
  await adminDb()
    .collection("settings")
    .doc("general")
    .set(
      {
        businessName: str(form, "businessName").slice(0, 80),
        address: str(form, "address").slice(0, 200),
        phones: list(str(form, "phones")).slice(0, 6),
        whatsappNumber: str(form, "whatsappNumber").replace(/\D/g, ""),
        email: str(form, "email").slice(0, 120),
        staffAlertNumbers: list(str(form, "staffAlertNumbers")).map((n) => n.replace(/\D/g, "")).filter((n) => n.length >= 10).slice(0, 10),
        depositAmount: numOrNull(form, "depositAmount") ?? 0,
        fastagCharge: numOrNull(form, "fastagCharge") ?? 0,
        holdHours,
        includedKmPerDay: numOrNull(form, "includedKmPerDay") ?? 300,
        turnaroundHours: numOrNull(form, "turnaroundHours") ?? 0,
        ticketPrefix: prefix,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  revalidateTag(TAGS.settings, expireNow);
  back("/admin/settings", "ok", "Settings saved.");
}

export async function saveDiscount(form: FormData) {
  await assertStaff(["owner"]);
  const code = str(form, "code").toUpperCase();
  if (!/^[A-Z0-9_-]{2,30}$/.test(code)) back("/admin/settings#discounts", "error", "Codes use 2–30 letters, numbers, - or _.");
  const value = numOrNull(form, "value");
  if (!value) back("/admin/settings#discounts", "error", "Enter a discount value.");
  const type = str(form, "type") === "flat" ? "flat" : "percent";
  if (type === "percent" && (value ?? 0) > 100) back("/admin/settings#discounts", "error", "Percent must be 100 or less.");
  await adminDb()
    .collection("discounts")
    .doc(code)
    .set({
      type,
      value,
      maxDiscount: numOrNull(form, "maxDiscount") ?? 0,
      minDays: numOrNull(form, "minDays") ?? 1,
      validFrom: str(form, "validFrom") || null,
      validTo: str(form, "validTo") || null,
      description: str(form, "description").slice(0, 120),
      active: form.get("active") === "on",
      updatedAt: Date.now(),
    });
  back("/admin/settings#discounts", "ok", `Code ${code} saved.`);
}

export async function deleteDiscount(form: FormData) {
  await assertStaff(["owner"]);
  await adminDb().collection("discounts").doc(str(form, "code")).delete();
  back("/admin/settings#discounts", "ok", "Code deleted.");
}

export async function addStaffMember(form: FormData) {
  await assertStaff(["owner"]);
  const email = str(form, "email").toLowerCase();
  const name = str(form, "name").slice(0, 60);
  const password = String(form.get("password") ?? "");
  const role = str(form, "role") === "owner" ? "owner" : "staff";
  if (!z.email().safeParse(email).success || password.length < 8) {
    back("/admin/settings#staff", "error", "Enter a valid email and a password of at least 8 characters.");
  }
  let uid: string;
  try {
    const existing = await adminAuth().getUserByEmail(email).catch(() => null);
    uid = existing ? existing.uid : (await adminAuth().createUser({ email, password, displayName: name })).uid;
    if (existing) await adminAuth().updateUser(uid, { password });
  } catch (err) {
    back("/admin/settings#staff", "error", err instanceof Error ? err.message : "Could not create the user.");
  }
  await adminDb().collection("staff").doc(uid!).set({ email, name, role, active: true, createdAt: Date.now() });
  back("/admin/settings#staff", "ok", `${email} can now sign in as ${role}.`);
}

export async function setStaffActive(form: FormData) {
  const me = await assertStaff(["owner"]);
  const uid = str(form, "uid");
  if (uid === me.uid) back("/admin/settings#staff", "error", "You can't deactivate your own account.");
  const active = str(form, "active") === "true";
  await adminDb().collection("staff").doc(uid).update({ active });
  if (!active) await adminAuth().revokeRefreshTokens(uid).catch(() => undefined);
  back("/admin/settings#staff", "ok", active ? "Account re-activated." : "Account deactivated.");
}
