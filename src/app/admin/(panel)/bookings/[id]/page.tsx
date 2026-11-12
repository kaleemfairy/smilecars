import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getBooking } from "@/lib/bookings";
import { NEXT_STATUSES } from "@/lib/availability-core";
import { fmtDateTime, LABELS, phoneDigits } from "@/lib/format";
import { requestTime } from "@/lib/time";
import { StatusChip } from "@/components/booking/StatusChip";
import { PriceTable } from "@/components/booking/PriceTable";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { extendBookingHold, saveStaffNotes, setBookingStatus } from "../../../actions";
import { Flash } from "../../ui";

export const metadata = { title: "Booking" };

const ACTION_STYLE: Record<string, string> = {
  confirmed: "btn-primary",
  delivered: "btn-teal",
  returned: "btn-teal",
  closed: "btn-teal",
  cancelled: "border border-red-300 text-red-700 hover:bg-red-50",
};

export default async function BookingDetail(props: PageProps<"/admin/bookings/[id]">) {
  await requireStaff();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const b = await getBooking(id);
  if (!b) notFound();
  const now = requestTime();
  const next = NEXT_STATUSES[b.status];
  const phone = phoneDigits(b.phone);

  return (
    <div className="max-w-4xl">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><ArrowLeft className="size-4" aria-hidden />All bookings</Link>
      <Flash sp={sp} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{b.ticket}</h1>
        <StatusChip status={b.status} />
        {b.status === "new" && (
          <span className={`text-sm font-semibold ${b.holdExpiresAt > now ? "text-brand-700" : "text-red-700"}`}>
            {b.holdExpiresAt > now ? `Car held until ${fmtDateTime(b.holdExpiresAt)}` : "Hold expired: the car is free for others"}
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-bold">Customer</h2>
            <p className="mt-2 text-lg font-semibold">{b.customerName}</p>
            <p className="text-muted">{b.phone}{b.email ? ` · ${b.email}` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:+${phone}`} className="btn btn-sm btn-teal"><Phone className="size-4" aria-hidden />Call</a>
              <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${b.customerName}, this is Smile Cars about your booking ${b.ticket}.`)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-whatsapp"><WhatsAppIcon className="size-4" />WhatsApp</a>
            </div>
            <h3 className="mt-4 text-sm font-bold">Delivery address</h3>
            <p className="whitespace-pre-wrap text-sm">{b.address}</p>
            {b.notes && (<><h3 className="mt-3 text-sm font-bold">Customer notes</h3><p className="whitespace-pre-wrap text-sm">{b.notes}</p></>)}
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Trip</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">Car</dt><dd className="font-semibold">{b.carName}</dd>
              <dt className="text-muted">Pickup</dt><dd>{fmtDateTime(b.startAt)}</dd>
              <dt className="text-muted">Return</dt><dd>{fmtDateTime(b.endAt)}</dd>
              <dt className="text-muted">Type</dt><dd>{LABELS.rentalType[b.rentalType]}</dd>
              <dt className="text-muted">Hub</dt><dd>{b.hubName} · {LABELS.deliveryMode[b.deliveryMode]}</dd>
              <dt className="text-muted">Booked</dt><dd>{fmtDateTime(b.createdAt)}</dd>
            </dl>
            <div className="mt-3 border-t border-line pt-2"><PriceTable price={b.price} /></div>
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Staff notes</h2>
            <form action={saveStaffNotes} className="mt-2 space-y-2">
              <input type="hidden" name="id" value={b.id} />
              <textarea name="staffNotes" defaultValue={b.staffNotes} className="field" placeholder="Call outcome, documents checked, delivery person, odometer…" />
              <button className="btn btn-sm btn-secondary" type="submit">Save notes</button>
            </form>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="font-bold">Update status</h2>
            {next.length === 0 ? (
              <p className="mt-2 text-sm text-muted">This booking is {LABELS.status[b.status].toLowerCase()}. No further steps.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {next.map((s) => (
                  <form key={s} action={setBookingStatus}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" className={`btn w-full ${ACTION_STYLE[s] ?? "btn-secondary"}`}>
                      {s === "confirmed" ? "Confirm booking (after call)" : s === "cancelled" ? "Cancel booking" : `Mark ${LABELS.status[s].toLowerCase()}`}
                    </button>
                  </form>
                ))}
              </div>
            )}
            {b.status === "new" && (
              <form action={extendBookingHold} className="mt-4 flex gap-2 border-t border-line pt-4">
                <input type="hidden" name="id" value={b.id} />
                <select name="hours" className="field" defaultValue="2" aria-label="Extend hold by">
                  {[1, 2, 4, 12, 24].map((h) => <option key={h} value={h}>+{h} h</option>)}
                </select>
                <button className="btn btn-secondary shrink-0" type="submit">Extend hold</button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-bold">History</h2>
            <ol className="mt-2 space-y-2 text-sm">
              {b.history.map((h, i) => (
                <li key={i}>
                  <StatusChip status={h.status} /> <span className="text-muted">{fmtDateTime(h.at)} · {h.by}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
