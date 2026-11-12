// Pure availability rules, shared by the booking engine, admin calendar and chatbot.
import type { BookingStatus } from "./types.ts";
import { HOUR_MS } from "./time.ts";

export interface BusyInterval {
  carId: string;
  startAt: number;
  endAt: number;
}

export interface BookingLike extends BusyInterval {
  status: BookingStatus;
  holdExpiresAt: number;
}

/** Statuses that keep a car busy. A "new" booking only holds the car until its hold expires. */
export function blocksCar(b: Pick<BookingLike, "status" | "holdExpiresAt">, now: number): boolean {
  if (b.status === "confirmed" || b.status === "delivered") return true;
  if (b.status === "new") return b.holdExpiresAt > now;
  return false;
}

/** True when [aStart, aEnd) and [bStart, bEnd) overlap once both are padded by the turnaround gap. */
export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  turnaroundHours = 0,
): boolean {
  const gap = turnaroundHours * HOUR_MS;
  return aStart < bEnd + gap && bStart < aEnd + gap;
}

/**
 * Highest number of the given intervals in use at the same moment inside [startAt, endAt).
 * Each interval is padded by the turnaround gap on both sides (the car is being cleaned).
 *
 * Cars of one model are interchangeable until delivery, so a model with N cars can take a new
 * booking exactly when this peak is below N (interval scheduling: N cars suffice for a set of
 * trips if and only if no moment has more than N trips running at once).
 */
export function peakUsage(
  startAt: number,
  endAt: number,
  intervals: { startAt: number; endAt: number }[],
  turnaroundHours = 0,
): number {
  const gap = turnaroundHours * HOUR_MS;
  const events: [number, number][] = [];
  for (const iv of intervals) {
    const s = Math.max(startAt, iv.startAt - gap);
    const e = Math.min(endAt, iv.endAt + gap);
    if (s < e) events.push([s, 1], [e, -1]);
  }
  // Ends sort before starts at the same instant: back-to-back trips don't overlap.
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0;
  let peak = 0;
  for (const [, d] of events) {
    cur += d;
    if (cur > peak) peak = cur;
  }
  return peak;
}

/**
 * Car model ids that have no free car for the whole requested window.
 * `unitsById` is how many physical cars each model has (missing = 1).
 */
export function busyCarIds(
  startAt: number,
  endAt: number,
  bookings: BookingLike[],
  blocks: BusyInterval[],
  now: number,
  turnaroundHours = 0,
  unitsById: Record<string, number> = {},
): Set<string> {
  const byCar = new Map<string, { startAt: number; endAt: number }[]>();
  const add = (iv: BusyInterval) => {
    if (!overlaps(startAt, endAt, iv.startAt, iv.endAt, turnaroundHours)) return;
    const list = byCar.get(iv.carId) ?? [];
    list.push(iv);
    byCar.set(iv.carId, list);
  };
  for (const b of bookings) if (blocksCar(b, now)) add(b);
  for (const bl of blocks) add(bl);

  const busy = new Set<string>();
  for (const [carId, list] of byCar) {
    const units = Math.max(1, unitsById[carId] ?? 1);
    if (peakUsage(startAt, endAt, list, turnaroundHours) >= units) busy.add(carId);
  }
  return busy;
}

/** Allowed next statuses for each booking status. */
export const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled"],
  delivered: ["returned"],
  returned: ["closed"],
  closed: [],
  cancelled: [],
};
