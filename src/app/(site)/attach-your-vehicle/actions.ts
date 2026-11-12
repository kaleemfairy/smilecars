"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getSettings } from "@/lib/data";
import { notifyEnquiry } from "@/lib/notifications";
import { normalizeIndianMobile } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";

export interface EnquiryState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const schema = z.object({
  ownerName: z.string().trim().min(2, "Please enter your name.").max(80),
  phone: z.string().trim(),
  carModel: z.string().trim().min(2, "Please enter the car make and model.").max(80),
  year: z.string().trim().max(4).regex(/^(\d{4})?$/, "Enter a 4-digit year."),
  fuel: z.string().trim().max(20),
  transmission: z.string().trim().max(20),
  kmDriven: z.string().trim().max(20),
  area: z.string().trim().max(80),
  notes: z.string().trim().max(500),
});

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  if (String(form.get("website") ?? "") !== "") return { ok: false, message: "Invalid request." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`enquiry:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many enquiries from this connection. Please call us instead." };
  }

  const raw = Object.fromEntries(
    ["ownerName", "phone", "carModel", "year", "fuel", "transmission", "kmDriven", "area", "notes"].map((k) => [
      k,
      String(form.get(k) ?? ""),
    ]),
  );
  const parsed = schema.safeParse(raw);
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  const phone = normalizeIndianMobile(raw.phone);
  if (!phone) fieldErrors.phone = "Please enter a valid 10-digit mobile number.";
  if (!parsed.success || !phone) return { ok: false, message: "Please check the highlighted fields.", fieldErrors };

  try {
    const enquiry = { ...parsed.data, phone, createdAt: Date.now() };
    await adminDb().collection("enquiries").add({ ...enquiry, status: "new" });
    after(async () => notifyEnquiry(enquiry, await getSettings()).catch((e) => console.error("notifyEnquiry failed", e)));
  } catch (err) {
    console.error("enquiry save failed", err);
    return { ok: false, message: "Sorry, we couldn't save your enquiry. Please call or WhatsApp us." };
  }
  return { ok: true, message: "Thank you! We have your details and will call you soon." };
}
