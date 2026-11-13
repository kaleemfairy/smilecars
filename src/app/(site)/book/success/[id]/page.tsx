import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, PhoneCall, Truck, Wallet } from "lucide-react";
import { getBooking } from "@/lib/bookings";
import { getPublicSettings } from "@/lib/data";
import { fmtDateTime, inr, LABELS, maskPhone, phoneDigits } from "@/lib/format";
import { PriceTable } from "@/components/booking/PriceTable";
import { CopyButton } from "@/components/booking/CopyButton";
import { TrackBooking } from "@/components/booking/TrackBooking";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking received", robots: { index: false } };

export default async function SuccessPage(props: PageProps<"/book/success/[id]">) {
  const { id } = await props.params;
  const [booking, settings] = await Promise.all([getBooking(id), getPublicSettings()]);
  if (!booking) notFound();

  const wa = phoneDigits(settings.whatsappNumber);
  const waText = encodeURIComponent(`Hi Smile Cars, about my booking ${booking.ticket}`);

  return (
    <div className="container-page max-w-2xl py-8">
      <TrackBooking ticket={booking.ticket} total={booking.price.total} carName={booking.carName} />
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto size-14 text-brand-700" aria-hidden />
        <h1 className="mt-3 text-[28px] font-extrabold sm:text-[34px]">Booking received!</h1>
        <p className="mt-2 text-muted">Save your ticket number to track this booking.</p>
        <div className="mx-auto mt-5 flex max-w-xs items-center justify-between gap-3 rounded-xl border-2 border-brand-500 bg-tint px-4 py-3">
          <div className="text-left">
            <p className="text-xs font-bold uppercase text-muted">Ticket number</p>
            <p className="font-display text-[26px] font-extrabold tracking-wide text-brand-700">{booking.ticket}</p>
          </div>
          <CopyButton text={booking.ticket} />
        </div>
      </div>

      {booking.status === "new" && (
        <p className="mt-4 flex gap-3 rounded-xl border border-brand-100 bg-tint p-4 text-sm">
          <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            We are holding <strong>{booking.carName}</strong> for you until{" "}
            <strong>{fmtDateTime(booking.holdExpiresAt)}</strong>. Our team will call you on{" "}
            <strong>{maskPhone(booking.phone)}</strong> to confirm.
          </span>
        </p>
      )}

      <section className="card mt-4 p-5">
        <h2 className="font-bold">What happens next</h2>
        <ol className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3"><PhoneCall className="size-5 shrink-0 text-brand-700" aria-hidden />We call you to verify your details.</li>
          {!!booking.price.advance && (
            <li className="flex gap-3"><Wallet className="size-5 shrink-0 text-brand-700" aria-hidden /><span>Pay the advance of <strong>{inr(booking.price.advance)}</strong> by GPay, PhonePe or bank transfer to confirm. The balance of {inr(booking.price.balance ?? booking.price.total - booking.price.advance)} is paid at delivery.</span></li>
          )}
          <li className="flex gap-3"><FileText className="size-5 shrink-0 text-brand-700" aria-hidden />Keep your driving licence, Aadhaar and employee ID or business proof ready.</li>
          <li className="flex gap-3"><Truck className="size-5 shrink-0 text-brand-700" aria-hidden />We deliver the car to your address at the pickup time.</li>
        </ol>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="font-bold">Trip summary</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Car</dt><dd className="font-semibold">{booking.carName}</dd>
          <dt className="text-muted">Pickup</dt><dd>{fmtDateTime(booking.startAt)}</dd>
          <dt className="text-muted">Return</dt><dd>{fmtDateTime(booking.endAt)}</dd>
          <dt className="text-muted">Hub</dt><dd>{booking.hubName} · {LABELS.deliveryMode[booking.deliveryMode]}</dd>
        </dl>
        <div className="mt-4 border-t border-line pt-2">
          <PriceTable price={booking.price} />
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {wa && (
          <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <WhatsAppIcon className="size-5" />
            Chat on WhatsApp
          </a>
        )}
        <Link href={`/my-orders?q=${encodeURIComponent(booking.ticket)}`} className="btn btn-secondary">Track in My Orders</Link>
      </div>
      <p className="mt-4 text-center"><Link href="/" className="text-sm font-semibold text-brand-700 underline">Back to home</Link></p>
    </div>
  );
}
