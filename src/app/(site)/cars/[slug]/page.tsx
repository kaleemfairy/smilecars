import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, FileText } from "lucide-react";
import { getActiveHubs, getCarBySlug, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { inr, LABELS } from "@/lib/format";
import { searchDefaults } from "@/lib/search-defaults";
import { CarImage } from "@/components/cars/CarImage";
import { SpecChips } from "@/components/cars/SpecChips";
import { SearchForm } from "@/components/booking/SearchForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const car = await safe(() => getCarBySlug(slug), null, "car");
  if (!car) return { title: "Car not found" };
  return {
    title: `${car.name} self drive rental in Chennai`,
    description: `Rent a ${car.name} (${LABELS.transmission[car.transmission]}, ${LABELS.fuel[car.fuel]}, ${car.seats} seats) in Chennai from ${inr(car.dailyRate)}/day, GST included, with doorstep delivery.`,
    openGraph: car.photos[0] ? { images: [car.photos[0]] } : undefined,
  };
}

export default async function CarPage(props: PageProps<"/cars/[slug]">) {
  const { slug } = await props.params;
  const [car, hubs, settings] = await Promise.all([
    safe(() => getCarBySlug(slug), null, "car"),
    safe(getActiveHubs, [], "hubs"),
    getPublicSettings(),
  ]);
  if (!car || !car.active) notFound();
  const { defaults, minDate } = searchDefaults(hubs);
  const kmPerDay = car.includedKmPerDay ?? settings.includedKmPerDay;

  return (
    <div className="container-page py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        <div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {(car.photos.length ? car.photos : [""]).map((_, i) => (
              <CarImage key={i} car={car} index={i} eager={i === 0} className="aspect-[16/10] w-[88%] shrink-0 snap-center rounded-2xl sm:w-full" />
            ))}
          </div>
          <h1 className="mt-5 text-3xl font-extrabold">{car.name}</h1>
          <div className="mt-3"><SpecChips car={car} /></div>
          {car.description && <p className="mt-4 leading-7 text-slate-700">{car.description}</p>}

          <section className="card mt-6 p-5">
            <h2 className="text-lg font-bold">Prices (GST included)</h2>
            <dl className="mt-3 divide-y divide-line">
              <div className="flex justify-between py-2.5"><dt>Daily</dt><dd className="font-bold">{inr(car.dailyRate)} / day</dd></div>
              {car.weeklyRate && <div className="flex justify-between py-2.5"><dt>Weekly (7 days)</dt><dd className="font-bold">{inr(car.weeklyRate)} / week</dd></div>}
              {car.monthlyRate && <div className="flex justify-between py-2.5"><dt>Monthly (30 days)</dt><dd className="font-bold">{inr(car.monthlyRate)} / month</dd></div>}
              <div className="flex justify-between py-2.5"><dt>Included km</dt><dd>{kmPerDay} km / day</dd></div>
              <div className="flex justify-between py-2.5"><dt>Extra km</dt><dd>{inr(car.extraKmRate)} / km</dd></div>
              {settings.depositAmount > 0 && <div className="flex justify-between py-2.5"><dt>Refundable deposit</dt><dd>{inr(settings.depositAmount)}</dd></div>}
              {settings.fastagCharge > 0 && <div className="flex justify-between py-2.5"><dt>FASTag charge</dt><dd>{inr(settings.fastagCharge)}</dd></div>}
            </dl>
          </section>

          {car.features.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">Features</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {car.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm"><Check className="size-5 text-brand-600" aria-hidden />{f}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6">
            <h2 className="text-lg font-bold">Documents needed</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {["Valid driving licence", "Aadhaar card", "Employee ID or business proof"].map((d) => (
                <li key={d} className="flex gap-2"><FileText className="size-5 text-brand-600" aria-hidden />{d}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="card p-4 sm:p-6 lg:sticky lg:top-20">
          <h2 className="mb-1 text-lg font-bold">Check availability</h2>
          <p className="mb-4 text-sm text-muted">See if the {car.name} is free for your dates.</p>
          <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} submitLabel="See available cars" />
        </aside>
      </div>
    </div>
  );
}
