import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { listRecentBookings } from "@/lib/bookings";
import { fmtDateTime, inr, LABELS } from "@/lib/format";
import { istDayRange, requestTime, todayIst } from "@/lib/time";
import { StatusChip } from "@/components/booking/StatusChip";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "@/lib/types";
import { PageTitle } from "./ui";

export const metadata = { title: "Bookings" };

const needsAdvance = (b: Booking) => !!b.price.advance && !b.advanceReceivedAt && (b.status === "new" || b.status === "confirmed");

function holdLabel(expiresAt: number, now: number) {
  const mins = Math.round((expiresAt - now) / 60000);
  if (mins <= 0) return { text: "Hold expired", urgent: true };
  const h = Math.floor(mins / 60);
  return { text: `Hold: ${h ? `${h}h ` : ""}${mins % 60}m left`, urgent: mins <= 30 };
}

export default async function BookingsPage(props: PageProps<"/admin">) {
  await requireStaff();
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" && (BOOKING_STATUSES as readonly string[]).includes(sp.status) ? (sp.status as BookingStatus) : null;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const all = await listRecentBookings(300);
  const now = requestTime();
  const today = istDayRange(todayIst(now));

  const counts = {
    newCount: all.filter((b) => b.status === "new").length,
    expiring: all.filter((b) => b.status === "new" && b.holdExpiresAt > now && b.holdExpiresAt - now < 30 * 60000).length,
    deliveries: all.filter((b) => b.status === "confirmed" && b.startAt >= today.start && b.startAt < today.end).length,
    returns: all.filter((b) => b.status === "delivered" && b.endAt >= today.start && b.endAt < today.end).length,
  };

  const digits = q.replace(/\D/g, "");
  const shown = all
    .filter((b) => !status || b.status === status)
    .filter(
      (b) =>
        !q ||
        b.ticket.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.carName.toLowerCase().includes(q) ||
        (digits.length >= 4 && b.phone.includes(digits)),
    );

  return (
    <>
      <PageTitle title="Bookings" />
      <ul className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["New, waiting for a call", counts.newCount, "/admin?status=new"],
          ["Holds ending in 30 min", counts.expiring, "/admin?status=new"],
          ["Deliveries today", counts.deliveries, "/admin?status=confirmed"],
          ["Returns due today", counts.returns, "/admin?status=delivered"],
        ].map(([label, n, href]) => (
          <li key={label as string}>
            <Link href={href as string} className="card block p-4 hover:shadow-raised">
              <p className="text-3xl font-extrabold">{n as number}</p>
              <p className="text-sm text-muted">{label as string}</p>
            </Link>
          </li>
        ))}
      </ul>

      <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search ticket, name, phone or car" className="field sm:max-w-sm" />
        <select name="status" defaultValue={status ?? ""} className="field sm:w-48">
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{LABELS.status[s]}</option>)}
        </select>
        <button className="btn btn-teal" type="submit">Filter</button>
      </form>

      {shown.length === 0 ? (
        <p className="card p-6 text-center text-muted">No bookings found.</p>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {shown.map((b) => {
              const hold = b.status === "new" ? holdLabel(b.holdExpiresAt, now) : null;
              return (
                <li key={b.id}>
                  <Link href={`/admin/bookings/${b.id}`} className="card block p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold">{b.ticket}</span>
                      <StatusChip status={b.status} />
                    </div>
                    <p className="mt-1 font-semibold">{b.customerName} · {b.carName}</p>
                    <p className="text-sm text-muted">{fmtDateTime(b.startAt)} → {fmtDateTime(b.endAt)}</p>
                    {hold && <p className={`mt-1 text-sm font-semibold ${hold.urgent ? "text-red-700" : "text-brand-700"}`}>{hold.text}</p>}
                    {needsAdvance(b) && <p className="text-sm font-semibold text-amber-700">Advance {inr(b.price.advance ?? 0)} pending</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* Desktop: table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-brand-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3">Trip</th><th className="px-4 py-3">Hub</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((b) => {
                  const hold = b.status === "new" ? holdLabel(b.holdExpiresAt, now) : null;
                  return (
                    <tr key={b.id} className="hover:bg-brand-50/50">
                      <td className="px-4 py-3 font-bold"><Link href={`/admin/bookings/${b.id}`} className="text-brand-700 hover:underline">{b.ticket}</Link></td>
                      <td className="px-4 py-3">{b.customerName}<span className="block text-xs text-muted">{b.phone}</span></td>
                      <td className="px-4 py-3">{b.carName}</td>
                      <td className="px-4 py-3">{fmtDateTime(b.startAt)}<span className="block text-xs text-muted">to {fmtDateTime(b.endAt)}</span></td>
                      <td className="px-4 py-3">{b.hubName}<span className="block text-xs text-muted">{LABELS.deliveryMode[b.deliveryMode]}</span></td>
                      <td className="px-4 py-3 font-semibold">{inr(b.price.total)}</td>
                      <td className="px-4 py-3">
                        <StatusChip status={b.status} />
                        {hold && <span className={`mt-1 block text-xs font-semibold ${hold.urgent ? "text-red-700" : "text-brand-700"}`}>{hold.text}</span>}
                        {needsAdvance(b) && <span className="block text-xs font-semibold text-amber-700">Advance pending</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Showing the latest {all.length} bookings.</p>
        </>
      )}
    </>
  );
}
