import type { Metadata } from "next";
import { headers } from "next/headers";
import { Search } from "lucide-react";
import { findBookingsByPhone, findBookingsByTicket } from "@/lib/bookings";
import { fmtDateTime, inr, LABELS, maskPhone, normalizeIndianMobile } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { requestTime } from "@/lib/time";
import { StatusChip } from "@/components/booking/StatusChip";
import { BOOKING_STATUSES, type Booking } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My orders",
  description: "Check the status of your Smile Cars booking with your ticket number or phone number.",
  robots: { index: false },
};

const FLOW = BOOKING_STATUSES.filter((s) => s !== "cancelled");

function Timeline({ booking }: { booking: Booking }) {
  if (booking.status === "cancelled") return <p className="text-sm text-red-700">This booking was cancelled.</p>;
  const current = FLOW.indexOf(booking.status);
  return (
    <ol className="mt-3 flex items-center gap-1" aria-label="Booking progress">
      {FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={i === current ? "step" : undefined}>
          <span className={`h-1.5 w-full rounded-full ${i <= current ? "bg-brand-600" : "bg-line"}`} />
          <span className={`text-[11px] font-semibold ${i <= current ? "text-brand-700" : "text-muted"}`}>{LABELS.status[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function MyOrdersPage(props: PageProps<"/my-orders">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 40) : "";
  let bookings: Booking[] | null = null;
  let error: string | null = null;

  if (q) {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`orders:${ip}`, 20, 10 * 60 * 1000)) {
      error = "Too many searches. Please wait a few minutes and try again.";
    } else {
      try {
        const phone = normalizeIndianMobile(q);
        if (/^[A-Za-z]{1,5}-?\d{1,6}$/.test(q)) {
          const t = q.toUpperCase().replace(/^([A-Z]+)(\d)/, "$1-$2");
          bookings = await findBookingsByTicket(t);
        } else if (phone) {
          bookings = await findBookingsByPhone(phone);
        } else {
          error = "Enter a ticket number like SC-0042, or the 10-digit mobile number you booked with.";
        }
      } catch (err) {
        console.error("my-orders lookup failed", err);
        error = "We couldn't look that up right now. Please call or WhatsApp us.";
      }
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-3xl font-extrabold">My orders</h1>
      <p className="mt-2 text-muted">Enter your ticket number or the phone number you booked with.</p>
      <form method="get" className="card mt-5 flex flex-col gap-3 p-4 sm:flex-row">
        <label htmlFor="q" className="sr-only">Ticket or phone number</label>
        <input id="q" name="q" defaultValue={q} required placeholder="SC-0042 or 98400 12345" className="field flex-1" />
        <button type="submit" className="btn btn-primary"><Search className="size-5" aria-hidden />Find my booking</button>
      </form>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {bookings && bookings.length === 0 && (
        <p className="card mt-5 p-6 text-center text-muted">No bookings found. Check the number, or WhatsApp us and we will help.</p>
      )}

      {bookings && bookings.length > 0 && (
        <ul className="mt-5 space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted">Ticket</p>
                  <p className="text-xl font-extrabold">{b.ticket}</p>
                </div>
                <StatusChip status={b.status} />
              </div>
              <Timeline booking={b} />
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted">Car</dt><dd className="font-semibold">{b.carName}</dd>
                <dt className="text-muted">Pickup</dt><dd>{fmtDateTime(b.startAt)}</dd>
                <dt className="text-muted">Return</dt><dd>{fmtDateTime(b.endAt)}</dd>
                <dt className="text-muted">Hub</dt><dd>{b.hubName}</dd>
                <dt className="text-muted">Phone</dt><dd>{maskPhone(b.phone)}</dd>
                <dt className="text-muted">Total</dt><dd className="font-semibold">{inr(b.price.total)}</dd>
              </dl>
              {b.status === "new" && b.holdExpiresAt > requestTime() && (
                <p className="mt-3 rounded-lg bg-accent-300/30 px-3 py-2 text-sm">
                  Waiting for our call. Car held until {fmtDateTime(b.holdExpiresAt)}.
                </p>
              )}
              {b.status === "new" && b.holdExpiresAt <= requestTime() && (
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                  The hold has ended. Please call or WhatsApp us to check if the car is still free.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
