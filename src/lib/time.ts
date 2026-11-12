// All customer-facing dates and times are Indian Standard Time (UTC+05:30, no DST).

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/**
 * Current time for dynamic server components. They render once per request, so reading
 * the clock here is safe (the React purity lint rule targets re-rendering client code).
 */
export function requestTime(): number {
  return Date.now();
}

/** "2026-11-14" + "10:00" (IST) -> epoch ms. Returns NaN for malformed input. */
export function istToMs(date: string, time: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return NaN;
  return Date.parse(`${date}T${time}:00+05:30`);
}

/** Epoch ms -> { date: "YYYY-MM-DD", time: "HH:mm" } in IST. */
export function msToIst(ms: number): { date: string; time: string } {
  const iso = new Date(ms + IST_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Today's date in IST as YYYY-MM-DD. */
export function todayIst(now = Date.now()): string {
  return msToIst(now).date;
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) + days * DAY_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Start and end (exclusive) of an IST calendar day, as epoch ms. */
export function istDayRange(date: string): { start: number; end: number } {
  const start = istToMs(date, "00:00");
  return { start, end: start + DAY_MS };
}

/** Number of rental days: every started 24 hours counts as a day, minimum 1. */
export function rentalDays(startMs: number, endMs: number): number {
  const hours = (endMs - startMs) / HOUR_MS;
  return Math.max(1, Math.ceil(hours / 24 - 1e-9));
}
