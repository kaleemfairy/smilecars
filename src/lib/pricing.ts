import type {
  Car,
  DeliveryMode,
  Discount,
  Hub,
  PriceBreakdown,
  RentalType,
  Settings,
} from "./types.ts";
import { rentalDays, todayIst } from "./time.ts";

/** Minimum days for each rental type. */
export const MIN_DAYS: Record<RentalType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * Rent for a number of days, GST included.
 * - daily: days x daily rate
 * - weekly: full weeks at the weekly rate, leftover days at the daily rate
 *   (never more than one extra week)
 * - monthly: full months at the monthly rate, leftover days priced as weekly/daily
 *   (never more than one extra month)
 * Missing weekly or monthly rates fall back to the next shorter rate.
 */
export function computeRent(
  car: Pick<Car, "dailyRate" | "weeklyRate" | "monthlyRate">,
  rentalType: RentalType,
  days: number,
): { rent: number; label: string } {
  const daily = car.dailyRate;
  const weekly = car.weeklyRate && car.weeklyRate > 0 ? car.weeklyRate : null;
  const monthly = car.monthlyRate && car.monthlyRate > 0 ? car.monthlyRate : null;

  const byDay = (d: number) => d * daily;
  const byWeek = (d: number) => {
    if (!weekly) return byDay(d);
    const weeks = Math.floor(d / 7);
    const rest = d % 7;
    return weeks * weekly + Math.min(byDay(rest), weekly);
  };

  if (rentalType === "monthly" && monthly) {
    const months = Math.floor(days / 30);
    const rest = days % 30;
    const rent = months * monthly + Math.min(byWeek(rest), monthly);
    const label =
      rest === 0
        ? `${months} month${months > 1 ? "s" : ""} × ₹${fmt(monthly)}`
        : `${months} month${months > 1 ? "s" : ""} + ${rest} day${rest > 1 ? "s" : ""}`;
    return { rent, label };
  }
  if ((rentalType === "weekly" || rentalType === "monthly") && weekly) {
    const weeks = Math.floor(days / 7);
    const rest = days % 7;
    const label =
      rest === 0
        ? `${weeks} week${weeks > 1 ? "s" : ""} × ₹${fmt(weekly)}`
        : `${weeks} week${weeks > 1 ? "s" : ""} + ${rest} day${rest > 1 ? "s" : ""}`;
    return { rent: byWeek(days), label };
  }
  return { rent: byDay(days), label: `${days} day${days > 1 ? "s" : ""} × ₹${fmt(daily)}` };
}

export type DiscountCheck =
  | { ok: true; amount: number }
  | { ok: false; reason: string };

export function applyDiscount(
  discount: Discount | null,
  rent: number,
  days: number,
  today = todayIst(),
): DiscountCheck {
  if (!discount || !discount.active) return { ok: false, reason: "This code is not valid." };
  if (discount.validFrom && today < discount.validFrom)
    return { ok: false, reason: "This code is not active yet." };
  if (discount.validTo && today > discount.validTo)
    return { ok: false, reason: "This code has expired." };
  if (days < discount.minDays)
    return { ok: false, reason: `This code needs a booking of at least ${discount.minDays} days.` };
  let amount =
    discount.type === "percent" ? Math.round((rent * discount.value) / 100) : discount.value;
  if (discount.type === "percent" && discount.maxDiscount > 0)
    amount = Math.min(amount, discount.maxDiscount);
  amount = Math.max(0, Math.min(amount, rent));
  return { ok: true, amount };
}

export interface QuoteInput {
  car: Car;
  hub: Hub;
  settings: Settings;
  rentalType: RentalType;
  deliveryMode: DeliveryMode;
  startAt: number;
  endAt: number;
  discount?: Discount | null;
  discountCode?: string | null;
}

export interface Quote {
  price: PriceBreakdown;
  discountError: string | null;
}

export function quote(input: QuoteInput): Quote {
  const { car, hub, settings } = input;
  const days = rentalDays(input.startAt, input.endAt);
  const { rent, label } = computeRent(car, input.rentalType, days);

  let discount = 0;
  let discountCode: string | null = null;
  let discountError: string | null = null;
  if (input.discountCode) {
    const check = applyDiscount(input.discount ?? null, rent, days);
    if (check.ok) {
      discount = check.amount;
      discountCode = input.discountCode.toUpperCase();
    } else {
      discountError = check.reason;
    }
  }

  const deliveryFee = hub.deliveryFee * (input.deliveryMode === "two-way" ? 2 : 1);
  const total = rent - discount + deliveryFee + settings.fastagCharge;
  // Advance to confirm: N days of the car's daily rent (N = settings.advanceDays), never more than the total.
  const advance = Math.max(0, Math.min(total, Math.round(car.dailyRate * Math.max(0, settings.advanceDays))));
  const fastagCharge = settings.fastagCharge;
  const kmPerDay = car.includedKmPerDay ?? settings.includedKmPerDay;

  return {
    discountError,
    price: {
      days,
      rent,
      rentLabel: label,
      discount,
      discountCode,
      deliveryFee,
      fastagCharge,
      total,
      deposit: settings.depositAmount,
      advance,
      balance: total - advance,
      includedKm: kmPerDay * days,
      extraKmRate: car.extraKmRate,
    },
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}
