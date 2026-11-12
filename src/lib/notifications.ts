import "server-only";
import { sendWhatsApp } from "./whatsapp";
import { emailLayout, sendEmail } from "./email";
import { sendZohoLead } from "./zoho";
import { fmtDateTime, inr, LABELS } from "./format";
import type { Booking, Enquiry, Settings } from "./types";

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

function bookingEmail(b: Booking, adminLink: string) {
  const p = b.price;
  return emailLayout({
    heading: `New booking ${b.ticket}: ${b.carName}`,
    intro: `Please call the customer to confirm. The car is held until ${fmtDateTime(b.holdExpiresAt)}.`,
    rows: [
      ["Customer", b.customerName],
      ["Phone / WhatsApp", b.phone],
      ["Email", b.email],
      ["Car", b.carName],
      ["Pickup", fmtDateTime(b.startAt)],
      ["Return", fmtDateTime(b.endAt)],
      ["Type", `${LABELS.rentalType[b.rentalType]} · ${p.days} day${p.days > 1 ? "s" : ""}`],
      ["Hub", `${b.hubName} · ${LABELS.deliveryMode[b.deliveryMode]}`],
      ["Delivery address", b.address],
      ["Notes", b.notes],
      ["Rent", `${inr(p.rent)} (${p.rentLabel})`],
      ["Discount", p.discount ? `${inr(p.discount)}${p.discountCode ? ` (${p.discountCode})` : ""}` : ""],
      ["Total", inr(p.total)],
      ["Refundable deposit", p.deposit ? inr(p.deposit) : ""],
    ],
    button: { label: "Open in admin", url: adminLink },
  });
}

/**
 * New booking: email and WhatsApp the staff, send the customer their ticket number,
 * and add the customer to Zoho CRM as a lead. Never throws.
 */
export async function notifyNewBooking(b: Booking, settings: Settings): Promise<void> {
  const adminLink = `${siteUrl()}/admin/bookings/${b.id}`;
  const mail = bookingEmail(b, adminLink);
  const jobs = [
    sendEmail({
      to: settings.notificationEmails,
      subject: `New booking ${b.ticket} · ${b.carName} · ${fmtDateTime(b.startAt)}`,
      ...mail,
      replyTo: b.email || undefined,
      idempotencyKey: `booking-${b.id}`,
    }),
    sendZohoLead({ name: b.customerName, phone: b.phone, email: b.email || undefined }),
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

/** Vehicle-owner enquiry from /attach-your-vehicle: email the staff. Never throws. */
export async function notifyEnquiry(e: Omit<Enquiry, "id" | "status">, settings: Settings): Promise<void> {
  const mail = emailLayout({
    heading: `New vehicle enquiry: ${e.carModel}`,
    intro: "A car owner wants to attach their vehicle with Smile Cars.",
    rows: [
      ["Owner", e.ownerName],
      ["Phone", e.phone],
      ["Car", [e.carModel, e.year].filter(Boolean).join(" ")],
      ["Fuel / gearbox", [e.fuel, e.transmission].filter(Boolean).join(" · ")],
      ["Km driven", e.kmDriven],
      ["Area", e.area],
      ["Notes", e.notes],
    ],
    button: { label: "Open enquiries", url: `${siteUrl()}/admin/enquiries` },
  });
  await sendEmail({ to: settings.notificationEmails, subject: `Vehicle enquiry: ${e.carModel} · ${e.ownerName}`, ...mail }).catch(
    () => undefined,
  );
}

export async function notifyDeliveryDay(b: Booking, settings: Settings) {
  return sendWhatsApp({
    to: b.phone,
    template: T.deliveryDay,
    // {{1}} name, {{2}} ticket, {{3}} car, {{4}} delivery time, {{5}} support phone
    params: [b.customerName, b.ticket, b.carName, fmtDateTime(b.startAt), settings.phones[0] ?? ""],
  });
}
