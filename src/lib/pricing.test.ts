import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount, computeRent, quote } from "./pricing.ts";
import { busyCarIds, overlaps } from "./availability-core.ts";
import { istToMs, rentalDays, HOUR_MS } from "./time.ts";
import type { Car, Discount, Hub, Settings } from "./types.ts";

const car: Car = {
  id: "c1",
  slug: "kwid",
  name: "Renault Kwid",
  bodyType: "hatchback",
  transmission: "manual",
  fuel: "petrol",
  seats: 5,
  dailyRate: 1800,
  weeklyRate: 11000,
  monthlyRate: 36000,
  includedKmPerDay: null,
  extraKmRate: 9,
  photos: [],
  description: "",
  features: [],
  active: true,
  sortOrder: 0,
  regNumber: "",
};
const hub: Hub = { id: "h1", name: "Anna Nagar West", area: "", deliveryFee: 300, active: true, sortOrder: 0 };
const settings: Settings = {
  businessName: "Smile Cars",
  address: "",
  phones: [],
  emergencyPhone: "",
  whatsappNumber: "",
  email: "",
  staffAlertNumbers: [],
  notificationEmails: [],
  depositAmount: 3000,
  fastagCharge: 200,
  holdHours: 2,
  includedKmPerDay: 300,
  turnaroundHours: 0,
  ticketPrefix: "SC",
};

test("rental days: every started 24 hours is a day", () => {
  const s = istToMs("2026-11-14", "10:00");
  assert.equal(rentalDays(s, s + 24 * HOUR_MS), 1);
  assert.equal(rentalDays(s, s + 25 * HOUR_MS), 2);
  assert.equal(rentalDays(s, s + 2 * HOUR_MS), 1);
  assert.equal(rentalDays(s, s + 72 * HOUR_MS), 3);
});

test("IST conversion", () => {
  assert.equal(new Date(istToMs("2026-11-14", "05:30")).toISOString(), "2026-11-14T00:00:00.000Z");
  assert.ok(Number.isNaN(istToMs("14-11-2026", "10:00")));
});

test("daily, weekly and monthly rent", () => {
  assert.equal(computeRent(car, "daily", 3).rent, 5400);
  assert.equal(computeRent(car, "weekly", 7).rent, 11000);
  // 9 days weekly = 1 week + 2 days
  assert.equal(computeRent(car, "weekly", 9).rent, 11000 + 3600);
  // leftover days never cost more than another week
  assert.equal(computeRent(car, "weekly", 13).rent, 11000 + 6 * 1800);
  assert.equal(computeRent({ ...car, dailyRate: 2000 }, "weekly", 13).rent, 22000);
  assert.equal(computeRent(car, "monthly", 30).rent, 36000);
  assert.equal(computeRent(car, "monthly", 37).rent, 36000 + 11000);
  // missing weekly rate falls back to daily
  assert.equal(computeRent({ ...car, weeklyRate: null }, "weekly", 7).rent, 12600);
});

test("discounts", () => {
  const d: Discount = {
    code: "SMILE10",
    type: "percent",
    value: 10,
    maxDiscount: 500,
    minDays: 2,
    validFrom: "2026-11-01",
    validTo: "2026-11-30",
    active: true,
    description: "",
  };
  assert.deepEqual(applyDiscount(d, 3600, 2, "2026-11-12"), { ok: true, amount: 360 });
  assert.deepEqual(applyDiscount(d, 9000, 5, "2026-11-12"), { ok: true, amount: 500 });
  assert.equal(applyDiscount(d, 1800, 1, "2026-11-12").ok, false);
  assert.equal(applyDiscount(d, 3600, 2, "2026-12-01").ok, false);
  assert.equal(applyDiscount({ ...d, active: false }, 3600, 2, "2026-11-12").ok, false);
  assert.deepEqual(applyDiscount({ ...d, type: "flat", value: 99999 }, 3600, 2, "2026-11-12"), {
    ok: true,
    amount: 3600,
  });
});

test("quote totals keep the deposit separate", () => {
  const s = istToMs("2026-11-14", "10:00");
  const { price } = quote({
    car,
    hub,
    settings,
    rentalType: "daily",
    deliveryMode: "two-way",
    startAt: s,
    endAt: s + 48 * HOUR_MS,
  });
  assert.equal(price.days, 2);
  assert.equal(price.rent, 3600);
  assert.equal(price.deliveryFee, 600);
  assert.equal(price.total, 3600 + 600 + 200);
  assert.equal(price.deposit, 3000);
  assert.equal(price.includedKm, 600);
});

test("availability: holds expire, cancelled bookings free the car", () => {
  const now = istToMs("2026-11-12", "12:00");
  const s = istToMs("2026-11-14", "10:00");
  const e = s + 48 * HOUR_MS;
  const bookings = [
    { carId: "a", startAt: s, endAt: e, status: "new" as const, holdExpiresAt: now + HOUR_MS },
    { carId: "b", startAt: s, endAt: e, status: "new" as const, holdExpiresAt: now - 1 },
    { carId: "c", startAt: s, endAt: e, status: "cancelled" as const, holdExpiresAt: 0 },
    { carId: "d", startAt: e, endAt: e + HOUR_MS, status: "confirmed" as const, holdExpiresAt: 0 },
  ];
  const busy = busyCarIds(s, e, bookings, [{ carId: "e", startAt: s - HOUR_MS, endAt: s + HOUR_MS }], now);
  assert.deepEqual([...busy].sort(), ["a", "e"]);
  // back-to-back is fine without a turnaround gap, blocked with one
  assert.equal(overlaps(s, e, e, e + HOUR_MS, 0), false);
  assert.equal(overlaps(s, e, e, e + HOUR_MS, 2), true);
});
