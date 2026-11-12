// Shared domain types. Firestore timestamps are converted to ISO strings or
// millisecond numbers at the data-layer boundary so components get plain objects.

export const BODY_TYPES = ["hatchback", "sedan", "suv", "muv", "luxury"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const TRANSMISSIONS = ["manual", "automatic"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const FUELS = ["petrol", "diesel", "cng", "electric"] as const;
export type Fuel = (typeof FUELS)[number];

export const RENTAL_TYPES = ["daily", "weekly", "monthly"] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];

export const DELIVERY_MODES = ["one-way", "two-way"] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export const BOOKING_STATUSES = [
  "new",
  "confirmed",
  "delivered",
  "returned",
  "closed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Role = "owner" | "staff";

export interface Car {
  id: string;
  slug: string;
  name: string;
  bodyType: BodyType;
  transmission: Transmission;
  fuel: Fuel;
  seats: number;
  /** Rent per day, GST included. */
  dailyRate: number;
  /** Rent for a full 7-day week, GST included. Optional. */
  weeklyRate: number | null;
  /** Rent for a full 30-day month, GST included. Optional. */
  monthlyRate: number | null;
  /** Overrides the default included km per day from settings. */
  includedKmPerDay: number | null;
  extraKmRate: number;
  photos: string[];
  description: string;
  features: string[];
  active: boolean;
  sortOrder: number;
  /** Registration number. Shown in admin only. */
  regNumber: string;
}

export interface Hub {
  id: string;
  name: string;
  area: string;
  /** Fee for one delivery or one pickup trip. Two-way doubles it. */
  deliveryFee: number;
  active: boolean;
  sortOrder: number;
}

export interface Settings {
  businessName: string;
  address: string;
  phones: string[];
  /** Number used for click-to-chat, digits with country code, e.g. 919962097400. */
  whatsappNumber: string;
  email: string;
  /** Numbers (with country code) that receive new-booking alerts. */
  staffAlertNumbers: string[];
  depositAmount: number;
  fastagCharge: number;
  holdHours: number;
  includedKmPerDay: number;
  /** Gap kept free between two bookings of the same car, for cleaning. */
  turnaroundHours: number;
  ticketPrefix: string;
}

export interface Discount {
  code: string;
  type: "percent" | "flat";
  value: number;
  /** Cap for percent discounts, 0 = no cap. */
  maxDiscount: number;
  minDays: number;
  validFrom: string | null; // YYYY-MM-DD, IST
  validTo: string | null; // YYYY-MM-DD, IST
  active: boolean;
  description: string;
}

export interface PriceLine {
  label: string;
  amount: number;
  note?: string;
}

export interface PriceBreakdown {
  days: number;
  rent: number;
  rentLabel: string;
  discount: number;
  discountCode: string | null;
  deliveryFee: number;
  fastagCharge: number;
  /** Payable for the rental: rent - discount + delivery + FASTag. */
  total: number;
  /** Refundable, shown separately and not part of total. */
  deposit: number;
  includedKm: number;
  extraKmRate: number;
}

export interface StatusEvent {
  status: BookingStatus;
  at: number;
  by: string;
}

export interface Booking {
  id: string;
  ticket: string;
  status: BookingStatus;
  carId: string;
  carName: string;
  hubId: string;
  hubName: string;
  rentalType: RentalType;
  deliveryMode: DeliveryMode;
  startAt: number;
  endAt: number;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  staffNotes: string;
  price: PriceBreakdown;
  holdExpiresAt: number;
  createdAt: number;
  updatedAt: number;
  history: StatusEvent[];
  deliveryReminderSent: boolean;
}

export interface Block {
  id: string;
  carId: string;
  startAt: number;
  endAt: number;
  reason: "servicing" | "walk-in" | "other";
  note: string;
  createdBy: string;
  createdAt: number;
}

export interface Enquiry {
  id: string;
  ownerName: string;
  phone: string;
  carModel: string;
  year: string;
  fuel: string;
  transmission: string;
  kmDriven: string;
  area: string;
  notes: string;
  status: "new" | "contacted" | "closed";
  createdAt: number;
}

export interface StaffMember {
  uid: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}
