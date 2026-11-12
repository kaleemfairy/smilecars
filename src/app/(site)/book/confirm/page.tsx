import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { findAvailableCars } from "@/lib/bookings";
import { pickParams, SEARCH_KEYS, searchToQuery, validateSearch } from "@/lib/search";
import { fmtIsoDay, fmtTime12, LABELS } from "@/lib/format";
import { Stepper } from "@/components/booking/Stepper";
import { ConfirmForm } from "@/components/booking/ConfirmForm";
import { CarImage } from "@/components/cars/CarImage";
import { SpecChips } from "@/components/cars/SpecChips";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirm your booking", robots: { index: false } };

export default async function ConfirmPage(props: PageProps<"/book/confirm">) {
  const sp = await props.searchParams;
  const raw = pickParams(sp, [...SEARCH_KEYS, "car"]);
  const result = validateSearch(raw);
  if (!result.ok || !raw.car) redirect(`/book?${new URLSearchParams(raw).toString()}`);

  const search = result.search;
  const query = searchToQuery(search);
  const { hub, results, settings } = await findAvailableCars(search);
  const match = results.find((r) => r.car.id === raw.car);

  if (!hub || !match) {
    return (
      <div className="container-page max-w-xl py-10">
        <Stepper current={2} />
        <div className="card mt-6 p-6 text-center">
          <p className="font-bold">This car is no longer free for your dates.</p>
          <p className="mt-2 text-muted">Someone may have just booked it. Please choose another car.</p>
          <Link href={`/book?${query}`} className="btn btn-primary mt-5">See available cars</Link>
        </div>
      </div>
    );
  }

  const { car, price } = match;
  return (
    <div className="container-page max-w-3xl py-6">
      <Stepper current={3} />
      <h1 className="mt-6 text-2xl font-extrabold">Confirm your booking</h1>

      <section className="card mt-5 flex gap-4 p-4" aria-label="Your car">
        <CarImage car={car} className="h-20 w-28 shrink-0 rounded-lg" />
        <div className="min-w-0 space-y-2 text-sm">
          <p className="text-base font-bold">{car.name}</p>
          <SpecChips car={car} withBody={false} />
          <p className="flex items-center gap-1.5 text-muted">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {fmtIsoDay(search.pd)}, {fmtTime12(search.pt)} → {fmtIsoDay(search.rd)}, {fmtTime12(search.rt)}
          </p>
          <p className="flex items-center gap-1.5 text-muted">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {hub.name} · {LABELS.deliveryMode[search.mode]}
          </p>
          <Link href={`/book?${query}`} className="inline-block font-semibold text-brand-700 underline">Change car</Link>
        </div>
      </section>

      <ConfirmForm
        search={{ type: search.type, hub: search.hub, mode: search.mode, pd: search.pd, pt: search.pt, rd: search.rd, rt: search.rt }}
        carId={car.id}
        initialPrice={price}
        holdHours={settings.holdHours}
      />
    </div>
  );
}
