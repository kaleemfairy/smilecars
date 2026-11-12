import { z } from "zod";
import { DELIVERY_MODES, RENTAL_TYPES, type DeliveryMode, type RentalType } from "./types.ts";
import { DAY_MS, HOUR_MS, istToMs, rentalDays } from "./time.ts";
import { MIN_DAYS } from "./pricing.ts";

/** Earliest pickup: this many hours from now, so staff can call and prepare the car. */
export const MIN_LEAD_HOURS = 2;
/** Bookings can be made up to this many days ahead. */
export const MAX_ADVANCE_DAYS = 180;

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^\d{2}:\d{2}$/;

export const searchSchema = z.object({
  type: z.enum(RENTAL_TYPES).default("daily"),
  hub: z.string().min(1).max(60),
  mode: z.enum(DELIVERY_MODES).default("two-way"),
  pd: z.string().regex(dateRe),
  pt: z.string().regex(timeRe),
  rd: z.string().regex(dateRe),
  rt: z.string().regex(timeRe),
});

export type SearchInput = z.infer<typeof searchSchema>;

export interface ValidSearch extends SearchInput {
  type: RentalType;
  mode: DeliveryMode;
  startAt: number;
  endAt: number;
  days: number;
}

export type SearchResult = { ok: true; search: ValidSearch } | { ok: false; error: string };

/** Validates a booking search (from URL params, the API or the chatbot). */
export function validateSearch(raw: unknown, now = Date.now()): SearchResult {
  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please choose a hub and your pickup and return date and time." };
  const s = parsed.data;
  const startAt = istToMs(s.pd, s.pt);
  const endAt = istToMs(s.rd, s.rt);
  if (Number.isNaN(startAt) || Number.isNaN(endAt)) return { ok: false, error: "Those dates are not valid." };
  if (startAt < now + MIN_LEAD_HOURS * HOUR_MS - 5 * 60 * 1000)
    return { ok: false, error: `Pickup must be at least ${MIN_LEAD_HOURS} hours from now.` };
  if (startAt > now + MAX_ADVANCE_DAYS * DAY_MS)
    return { ok: false, error: `Bookings open up to ${MAX_ADVANCE_DAYS} days ahead.` };
  if (endAt <= startAt) return { ok: false, error: "Return must be after pickup." };
  const days = rentalDays(startAt, endAt);
  const min = MIN_DAYS[s.type];
  if (days < min)
    return {
      ok: false,
      error: `${s.type === "weekly" ? "Weekly" : "Monthly"} rentals need at least ${min} days. Choose a later return date or switch to daily.`,
    };
  return { ok: true, search: { ...s, startAt, endAt, days } };
}

/** Reads the first value of each search param from Next.js searchParams. */
export function pickParams(sp: Record<string, string | string[] | undefined>, keys: string[]) {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = sp[k];
    const first = Array.isArray(v) ? v[0] : v;
    if (typeof first === "string" && first !== "") out[k] = first;
  }
  return out;
}

export const SEARCH_KEYS = ["type", "hub", "mode", "pd", "pt", "rd", "rt"] as const;

export function searchToQuery(s: SearchInput, extra: Record<string, string> = {}): string {
  const p = new URLSearchParams({
    type: s.type,
    hub: s.hub,
    mode: s.mode,
    pd: s.pd,
    pt: s.pt,
    rd: s.rd,
    rt: s.rt,
    ...extra,
  });
  return p.toString();
}
