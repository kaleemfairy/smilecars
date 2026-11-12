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

/** Car ids that are busy for the requested window. */
export function busyCarIds(
  startAt: number,
  endAt: number,
  bookings: BookingLike[],
  blocks: BusyInterval[],
  now: number,
  turnaroundHours = 0,
): Set<string> {
  const busy = new Set<string>();
  for (const b of bookings) {
    if (blocksCar(b, now) && overlaps(startAt, endAt, b.startAt, b.endAt, turnaroundHours)) {
      busy.add(b.carId);
    }
  }
  for (const bl of blocks) {
    if (overlaps(startAt, endAt, bl.startAt, bl.endAt, turnaroundHours)) busy.add(bl.carId);
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
