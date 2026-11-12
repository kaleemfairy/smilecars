import "server-only";
import { sendWhatsApp } from "./whatsapp";
import { fmtDateTime, inr } from "./format";
import type { Booking, Settings } from "./types";

// Template names can be changed with env vars to match what was approved in WhatsApp Manager.
// The expected template bodies are listed in README.md > WhatsApp templates.
const T = {
  staffNewBooking: process.env.WA_TEMPLATE_STAFF_NEW_BOOKING || "staff_new_booking",
  bookingReceived: process.env.WA_TEMPLATE_BOOKING_RECEIVED || "booking_received",
  bookingConfirmed: process.env.WA_TEMPLATE_BOOKING_CONFIRMED || "booking_confirmed",
  deliveryDay: process.env.WA_TEMPLATE_DELIVERY_DAY || "delivery_day",
};

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

const trip = (b: Booking) => `${fmtDateTime(b.startAt)} to ${fmtDateTime(b.endAt)}`;

/** New booking: alert staff and send the customer their ticket number. Never throws. */
export async function notifyNewBooking(b: Booking, settings: Settings): Promise<void> {
  const adminLink = `${siteUrl()}/admin/bookings/${b.id}`;
  const jobs = [
    ...settings.staffAlertNumbers.map((to) =>
      sendWhatsApp({
        to,
        template: T.staffNewBooking,
        // {{1}} ticket, {{2}} car, {{3}} trip, {{4}} customer + phone, {{5}} total, {{6}} admin link
        params: [b.ticket, b.carName, trip(b), `${b.customerName} ${b.phone}`, inr(b.price.total), adminLink],
      }),
    ),
    sendWhatsApp({
      to: b.phone,
      template: T.bookingReceived,
      // {{1}} name, {{2}} ticket, {{3}} car, {{4}} trip, {{5}} hold hours
      params: [b.customerName, b.ticket, b.carName, trip(b), String(settings.holdHours)],
    }),
  ];
  await Promise.allSettled(jobs);
}

export async function notifyConfirmed(b: Booking): Promise<void> {
  await sendWhatsApp({
    to: b.phone,
    template: T.bookingConfirmed,
    // {{1}} name, {{2}} ticket, {{3}} car, {{4}} trip, {{5}} total payable
    params: [b.customerName, b.ticket, b.carName, trip(b), inr(b.price.total)],
  }).catch(() => undefined);
}

export async function notifyDeliveryDay(b: Booking, settings: Settings) {
  return sendWhatsApp({
    to: b.phone,
    template: T.deliveryDay,
    // {{1}} name, {{2}} ticket, {{3}} car, {{4}} delivery time, {{5}} support phone
    params: [b.customerName, b.ticket, b.carName, fmtDateTime(b.startAt), settings.phones[0] ?? ""],
  });
}
