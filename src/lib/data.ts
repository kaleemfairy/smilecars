import "server-only";
import { unstable_cache } from "next/cache";
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";
import type { Car, Discount, Hub, Settings } from "./types";

// Cache tags. Admin actions call revalidateTag(tag, { expire: 0 }) after edits.
export const TAGS = { cars: "cars", hubs: "hubs", settings: "settings" } as const;

export const DEFAULT_SETTINGS: Settings = {
  businessName: "Smile Cars®",
  address: "No.1076, 44th Street, TVS Colony, Anna Nagar West Extension, Chennai 600101",
  phones: ["+91 99620 97400", "+91 99620 56400", "+91 90925 55444", "+91 93314 29331"],
  emergencyPhone: "+91 44 4385 0256",
  whatsappNumber: "919962097400",
  email: "bookings@smilecars.net",
  staffAlertNumbers: [],
  // Same inboxes the old site's booking and contact forms emailed.
  notificationEmails: ["bookings@smilecars.net", "rentacarbooking@yahoo.com"],
  depositAmount: 0,
  fastagCharge: 0,
  holdHours: 2,
  includedKmPerDay: 300,
  turnaroundHours: 0,
  ticketPrefix: "SC",
};

const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function toCar(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Car {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    slug: str(d.slug, doc.id),
    name: str(d.name),
    bodyType: d.bodyType ?? "hatchback",
    transmission: d.transmission ?? "manual",
    fuel: d.fuel ?? "petrol",
    seats: num(d.seats, 5),
    dailyRate: num(d.dailyRate),
    weeklyRate: typeof d.weeklyRate === "number" && d.weeklyRate > 0 ? d.weeklyRate : null,
    monthlyRate: typeof d.monthlyRate === "number" && d.monthlyRate > 0 ? d.monthlyRate : null,
    includedKmPerDay:
      typeof d.includedKmPerDay === "number" && d.includedKmPerDay > 0 ? d.includedKmPerDay : null,
    extraKmRate: num(d.extraKmRate),
    photos: strArr(d.photos),
    description: str(d.description),
    features: strArr(d.features),
    active: d.active !== false,
    sortOrder: num(d.sortOrder),
    regNumber: str(d.regNumber),
  };
}

export function toHub(doc: QueryDocumentSnapshot<DocumentData>): Hub {
  const d = doc.data();
  return {
    id: doc.id,
    name: str(d.name),
    area: str(d.area),
    deliveryFee: num(d.deliveryFee),
    active: d.active !== false,
    sortOrder: num(d.sortOrder),
  };
}

export function toDiscount(doc: DocumentSnapshot<DocumentData>): Discount | null {
  if (!doc.exists) return null;
  const d = doc.data() ?? {};
  return {
    code: doc.id,
    type: d.type === "flat" ? "flat" : "percent",
    value: num(d.value),
    maxDiscount: num(d.maxDiscount),
    minDays: num(d.minDays, 1),
    validFrom: typeof d.validFrom === "string" && d.validFrom ? d.validFrom : null,
    validTo: typeof d.validTo === "string" && d.validTo ? d.validTo : null,
    active: d.active !== false,
    description: str(d.description),
  };
}

const byOrder = <T extends { sortOrder: number; name: string }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

/** Every car, including inactive ones (admin). */
export const getAllCars = unstable_cache(
  async (): Promise<Car[]> => {
    const snap = await adminDb().collection("cars").get();
    return snap.docs.map(toCar).sort(byOrder);
  },
  ["all-cars"],
  { tags: [TAGS.cars], revalidate: 3600 },
);

export async function getActiveCars(): Promise<Car[]> {
  return (await getAllCars()).filter((c) => c.active);
}

export async function getCarBySlug(slug: string): Promise<Car | null> {
  return (await getAllCars()).find((c) => c.slug === slug) ?? null;
}

export async function getCarById(id: string): Promise<Car | null> {
  return (await getAllCars()).find((c) => c.id === id) ?? null;
}

export const getAllHubs = unstable_cache(
  async (): Promise<Hub[]> => {
    const snap = await adminDb().collection("hubs").get();
    return snap.docs.map(toHub).sort(byOrder);
  },
  ["all-hubs"],
  { tags: [TAGS.hubs], revalidate: 3600 },
);

export async function getActiveHubs(): Promise<Hub[]> {
  return (await getAllHubs()).filter((h) => h.active);
}

export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    const doc = await adminDb().collection("settings").doc("general").get();
    const d = doc.data() ?? {};
    const s = DEFAULT_SETTINGS;
    return {
      businessName: str(d.businessName, s.businessName) || s.businessName,
      address: str(d.address, s.address) || s.address,
      phones: strArr(d.phones).length ? strArr(d.phones) : s.phones,
      emergencyPhone: typeof d.emergencyPhone === "string" ? d.emergencyPhone : s.emergencyPhone,
      whatsappNumber: str(d.whatsappNumber, s.whatsappNumber) || s.whatsappNumber,
      email: str(d.email, s.email) || s.email,
      staffAlertNumbers: strArr(d.staffAlertNumbers),
      notificationEmails: Array.isArray(d.notificationEmails) ? strArr(d.notificationEmails) : s.notificationEmails,
      depositAmount: num(d.depositAmount, s.depositAmount),
      fastagCharge: num(d.fastagCharge, s.fastagCharge),
      holdHours: num(d.holdHours, s.holdHours) || s.holdHours,
      includedKmPerDay: num(d.includedKmPerDay, s.includedKmPerDay) || s.includedKmPerDay,
      turnaroundHours: num(d.turnaroundHours, s.turnaroundHours),
      ticketPrefix: str(d.ticketPrefix, s.ticketPrefix) || s.ticketPrefix,
    };
  },
  ["settings"],
  { tags: [TAGS.settings], revalidate: 3600 },
);

/**
 * Settings for public pages. Falls back to defaults when Firebase is not configured,
 * so the site shell (header, footer, contact buttons) always renders.
 */
export async function getPublicSettings(): Promise<Settings> {
  try {
    return await getSettings();
  } catch (err) {
    console.error("getSettings failed, using defaults:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function getDiscount(code: string): Promise<Discount | null> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,30}$/.test(clean)) return null;
  const doc = await adminDb().collection("discounts").doc(clean).get();
  return toDiscount(doc);
}
