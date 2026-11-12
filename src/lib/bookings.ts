import "server-only";
import type { DocumentData, DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";
import { getActiveCars, getActiveHubs, getCarById, getDiscount, getSettings } from "./data";
import { busyCarIds, NEXT_STATUSES } from "./availability-core";
import { quote } from "./pricing";
import { HOUR_MS } from "./time";
import type { ValidSearch } from "./search";
import type { Block, Booking, BookingStatus, Car, Hub, PriceBreakdown, Settings } from "./types";

const BOOKINGS = "bookings";
const BLOCKS = "blocks";

export function toBooking(doc: DocumentSnapshot<DocumentData>): Booking {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    ticket: d.ticket ?? "",
    status: d.status ?? "new",
    carId: d.carId ?? "",
    carName: d.carName ?? "",
    hubId: d.hubId ?? "",
    hubName: d.hubName ?? "",
    rentalType: d.rentalType ?? "daily",
    deliveryMode: d.deliveryMode ?? "two-way",
    startAt: d.startAt ?? 0,
    endAt: d.endAt ?? 0,
    customerName: d.customerName ?? "",
    phone: d.phone ?? "",
    alternatePhone: d.alternatePhone ?? "",
    email: d.email ?? "",
    address: d.address ?? "",
    notes: d.notes ?? "",
    staffNotes: d.staffNotes ?? "",
    price: d.price as PriceBreakdown,
    holdExpiresAt: d.holdExpiresAt ?? 0,
    createdAt: d.createdAt ?? 0,
    updatedAt: d.updatedAt ?? 0,
    history: Array.isArray(d.history) ? d.history : [],
    deliveryReminderSent: d.deliveryReminderSent === true,
    advanceReceivedAt: typeof d.advanceReceivedAt === "number" ? d.advanceReceivedAt : 0,
  };
}

export function toBlock(doc: DocumentSnapshot<DocumentData>): Block {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    carId: d.carId ?? "",
    startAt: d.startAt ?? 0,
    endAt: d.endAt ?? 0,
    reason: d.reason ?? "other",
    note: d.note ?? "",
    createdBy: d.createdBy ?? "",
    createdAt: d.createdAt ?? 0,
  };
}

/** Bookings and blocks that end after `from` (the only ones that can overlap a later window). */
async function activeIntervals(from: number) {
  const db = adminDb();
  const [bSnap, blSnap] = await Promise.all([
    db.collection(BOOKINGS).where("endAt", ">", from).get(),
    db.collection(BLOCKS).where("endAt", ">", from).get(),
  ]);
  return { bookings: bSnap.docs.map(toBooking), blocks: blSnap.docs.map(toBlock) };
}

export interface AvailableCar {
  car: Car;
  price: PriceBreakdown;
}

/** Cars free for the search window, each with its price for that trip. Sorted by total price. */
export async function findAvailableCars(search: ValidSearch): Promise<{
  hub: Hub | null;
  settings: Settings;
  results: AvailableCar[];
}> {
  const [cars, hubs, settings] = await Promise.all([getActiveCars(), getActiveHubs(), getSettings()]);
  const hub = hubs.find((h) => h.id === search.hub) ?? null;
  if (!hub) return { hub: null, settings, results: [] };

  const gap = settings.turnaroundHours;
  const { bookings, blocks } = await activeIntervals(search.startAt - gap * HOUR_MS);
  const unitsById = Object.fromEntries(cars.map((c) => [c.id, c.units]));
  const busy = busyCarIds(search.startAt, search.endAt, bookings, blocks, Date.now(), gap, unitsById);

  const results = cars
    .filter((c) => !busy.has(c.id) && c.dailyRate > 0)
    .map((car) => ({
      car,
      price: quote({
        car,
        hub,
        settings,
        rentalType: search.type,
        deliveryMode: search.mode,
        startAt: search.startAt,
        endAt: search.endAt,
      }).price,
    }))
    .sort((a, b) => a.price.total - b.price.total);
  return { hub, settings, results };
}

/** Reads inside a transaction: is this car free for the window? */
async function carIsFree(
  tx: Transaction,
  carId: string,
  startAt: number,
  endAt: number,
  gapHours: number,
  units: number,
  ignoreBookingId?: string,
): Promise<boolean> {
  const db = adminDb();
  const from = startAt - gapHours * HOUR_MS;
  const [bSnap, blSnap] = await Promise.all([
    tx.get(db.collection(BOOKINGS).where("carId", "==", carId).where("endAt", ">", from)),
    tx.get(db.collection(BLOCKS).where("carId", "==", carId).where("endAt", ">", from)),
  ]);
  const now = Date.now();
  const bookings = bSnap.docs.filter((d) => d.id !== ignoreBookingId).map(toBooking);
  const blocks = blSnap.docs.map(toBlock);
  return !busyCarIds(startAt, endAt, bookings, blocks, now, gapHours, { [carId]: units }).has(carId);
}

export interface CreateBookingInput {
  search: ValidSearch;
  carId: string;
  customerName: string;
  phone: string; // already normalised to E.164, e.g. +919876543210
  alternatePhone: string;
  email: string;
  address: string;
  notes: string;
  discountCode: string;
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string; code: "unavailable" | "invalid" | "discount" };

export class BookingConflictError extends Error {}

/**
 * Creates a booking with status "new". Availability is re-checked inside a Firestore
 * transaction, so two people cannot book the same car for overlapping times.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { search } = input;
  const [car, hubs, settings] = await Promise.all([getCarById(input.carId), getActiveHubs(), getSettings()]);
  const hub = hubs.find((h) => h.id === search.hub);
  if (!car || !car.active) return { ok: false, code: "invalid", error: "This car is no longer available." };
  if (!hub) return { ok: false, code: "invalid", error: "Please choose a delivery hub." };

  const code = input.discountCode.trim().toUpperCase();
  const discount = code ? await getDiscount(code) : null;
  const q = quote({
    car,
    hub,
    settings,
    rentalType: search.type,
    deliveryMode: search.mode,
    startAt: search.startAt,
    endAt: search.endAt,
    discount,
    discountCode: code || null,
  });
  if (q.discountError) return { ok: false, code: "discount", error: q.discountError };

  const db = adminDb();
  const counterRef = db.collection("counters").doc("bookings");
  const bookingRef = db.collection(BOOKINGS).doc();
  const now = Date.now();

  try {
    const ticket = await db.runTransaction(async (tx) => {
      const free = await carIsFree(tx, car.id, search.startAt, search.endAt, settings.turnaroundHours, car.units);
      const counter = await tx.get(counterRef);
      if (!free) throw new BookingConflictError();
      const next = ((counter.data()?.next as number | undefined) ?? 1);
      const ticketNo = `${settings.ticketPrefix}-${String(next).padStart(4, "0")}`;
      tx.set(counterRef, { next: next + 1 }, { merge: true });
      tx.set(bookingRef, {
        ticket: ticketNo,
        status: "new",
        carId: car.id,
        carName: car.name,
        hubId: hub.id,
        hubName: hub.name,
        rentalType: search.type,
        deliveryMode: search.mode,
        startAt: search.startAt,
        endAt: search.endAt,
        customerName: input.customerName,
        phone: input.phone,
        alternatePhone: input.alternatePhone,
        email: input.email,
        address: input.address,
        notes: input.notes,
        staffNotes: "",
        price: q.price,
        holdExpiresAt: now + settings.holdHours * HOUR_MS,
        createdAt: now,
        updatedAt: now,
        history: [{ status: "new", at: now, by: "customer" }],
        deliveryReminderSent: false,
        advanceReceivedAt: 0,
      });
      return ticketNo;
    });
    const snap = await bookingRef.get();
    return { ok: true, booking: { ...toBooking(snap), ticket } };
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return {
        ok: false,
        code: "unavailable",
        error: "Sorry, this car was just booked by someone else for these dates. Please pick another car.",
      };
    }
    throw err;
  }
}

export async function getBooking(id: string): Promise<Booking | null> {
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
  const snap = await adminDb().collection(BOOKINGS).doc(id).get();
  return snap.exists ? toBooking(snap) : null;
}

export async function findBookingsByTicket(ticket: string): Promise<Booking[]> {
  const snap = await adminDb().collection(BOOKINGS).where("ticket", "==", ticket.trim().toUpperCase()).limit(5).get();
  return snap.docs.map(toBooking);
}

export async function findBookingsByPhone(phone: string): Promise<Booking[]> {
  const snap = await adminDb().collection(BOOKINGS).where("phone", "==", phone).limit(50).get();
  return snap.docs.map(toBooking).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
}

export async function listRecentBookings(limit = 300): Promise<Booking[]> {
  const snap = await adminDb().collection(BOOKINGS).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map(toBooking);
}

/** Bookings and blocks overlapping [from, to), for the admin calendar. */
export async function intervalsInRange(from: number, to: number) {
  const { bookings, blocks } = await activeIntervals(from);
  return {
    bookings: bookings.filter((b) => b.startAt < to && b.status !== "cancelled"),
    blocks: blocks.filter((b) => b.startAt < to),
  };
}

export type StatusChangeResult = { ok: true; booking: Booking } | { ok: false; error: string };

/** Moves a booking to its next status. Confirming a booking whose hold ran out re-checks the car. */
export async function changeBookingStatus(
  id: string,
  next: BookingStatus,
  by: string,
): Promise<StatusChangeResult> {
  const db = adminDb();
  const ref = db.collection(BOOKINGS).doc(id);
  const settings = await getSettings();
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Booking not found.");
      const b = toBooking(snap);
      if (!NEXT_STATUSES[b.status].includes(next)) {
        throw new Error(`A ${b.status} booking cannot be marked ${next}.`);
      }
      if (next === "confirmed" && b.holdExpiresAt <= Date.now()) {
        const units = (await getCarById(b.carId))?.units ?? 1;
        const free = await carIsFree(tx, b.carId, b.startAt, b.endAt, settings.turnaroundHours, units, b.id);
        if (!free) throw new Error("The hold expired and this car has since been booked or blocked for these dates.");
      }
      const now = Date.now();
      tx.update(ref, {
        status: next,
        updatedAt: now,
        history: [...b.history, { status: next, at: now, by }],
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the booking." };
  }
  const updated = await ref.get();
  return { ok: true, booking: toBooking(updated) };
}

export async function extendHold(id: string, hours: number): Promise<void> {
  const ref = adminDb().collection(BOOKINGS).doc(id);
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Booking not found.");
    const b = toBooking(snap);
    if (b.status !== "new") throw new Error("Only new bookings have a hold.");
    const settings = await getSettings();
    if (b.holdExpiresAt <= Date.now()) {
      const units = (await getCarById(b.carId))?.units ?? 1;
        const free = await carIsFree(tx, b.carId, b.startAt, b.endAt, settings.turnaroundHours, units, b.id);
      if (!free) throw new Error("The hold expired and this car has since been booked for these dates.");
    }
    const base = Math.max(Date.now(), b.holdExpiresAt);
    tx.update(ref, { holdExpiresAt: base + hours * HOUR_MS, updatedAt: Date.now() });
  });
}

export async function updateStaffNotes(id: string, staffNotes: string): Promise<void> {
  await adminDb().collection(BOOKINGS).doc(id).update({ staffNotes, updatedAt: Date.now() });
}
