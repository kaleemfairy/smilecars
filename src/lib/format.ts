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

/** Country codes offered in the booking form (NRI and foreign customers). */
export const COUNTRY_CODES = [
  ["91", "India"],
  ["971", "UAE"],
  ["966", "Saudi Arabia"],
  ["974", "Qatar"],
  ["965", "Kuwait"],
  ["968", "Oman"],
  ["973", "Bahrain"],
  ["65", "Singapore"],
  ["60", "Malaysia"],
  ["94", "Sri Lanka"],
  ["44", "UK"],
  ["1", "USA / Canada"],
  ["61", "Australia"],
  ["64", "New Zealand"],
  ["49", "Germany"],
  ["33", "France"],
] as const;

/**
 * Normalises a phone number entered with a country code to E.164 (+<code><number>), or null.
 * Indian numbers must be valid 10-digit mobiles; others are checked for a plausible length.
 */
export function normalizePhone(countryCode: string, number: string): string | null {
  const cc = countryCode.replace(/\D/g, "") || "91";
  if (cc === "91") return normalizeIndianMobile(number);
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith(cc) && digits.length > cc.length + 6) digits = digits.slice(cc.length);
  digits = digits.replace(/^0+/, "");
  if (digits.length < 6 || cc.length + digits.length > 15) return null;
  return `+${cc}${digits}`;
}

/** For lookups (My Orders, chat): accepts an Indian mobile in any format, or an international number with +. */
export function normalizeLookupPhone(input: string): string | null {
  const indian = normalizeIndianMobile(input);
  if (indian) return indian;
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if ((trimmed.startsWith("+") || trimmed.startsWith("00")) && digits.length >= 8 && digits.length <= 15) {
    return `+${digits.replace(/^00/, "")}`;
  }
  return null;
}

/** "+919876543210" -> "+91 98XXX XX210" */
export function maskPhone(phone: string): string {
  const all = phone.replace(/\D/g, "");
  if (all.length === 12 && all.startsWith("91")) {
    const d = all.slice(2);
    return `+91 ${d.slice(0, 2)}XXX XX${d.slice(7)}`;
  }
  if (all.length < 7) return phone;
  return `+${all.slice(0, all.length - 7)} XXXX ${all.slice(-3)}`;
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
  bodyType: { hatchback: "Hatchback", sedan: "Sedan", suv: "SUV", muv: "7–8 seater", luxury: "Premium SUV" },
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
