import { msToIst } from "./time.ts";

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function fmtDate(ms: number): string {
  return dateFmt.format(ms);
}

export function fmtDateTime(ms: number): string {
  return dateTimeFmt.format(ms);
}

/** "2026-11-14" -> "Sat, 14 Nov" */
export function fmtIsoDay(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(Date.parse(`${date}T12:00:00+05:30`));
}

export function fmtTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function istParts(ms: number) {
  return msToIst(ms);
}

/** Normalises an Indian mobile number to +91XXXXXXXXXX, or returns null. */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}

/** "+919876543210" -> "+91 98XXX XX210" */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return phone;
  return `+91 ${d.slice(0, 2)}XXX XX${d.slice(7)}`;
}

/** Digits only, for wa.me and tel: links. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const LABELS = {
  bodyType: { hatchback: "Hatchback", sedan: "Sedan", suv: "SUV", muv: "MUV / 7-seater", luxury: "Luxury" },
  transmission: { manual: "Manual", automatic: "Automatic" },
  fuel: { petrol: "Petrol", diesel: "Diesel", cng: "CNG", electric: "Electric" },
  rentalType: { daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
  deliveryMode: { "one-way": "Delivery only", "two-way": "Delivery & pickup" },
  status: {
    new: "New",
    confirmed: "Confirmed",
    delivered: "Delivered",
    returned: "Returned",
    closed: "Closed",
    cancelled: "Cancelled",
  },
} as const;
