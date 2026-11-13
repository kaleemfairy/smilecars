import type { Metadata } from "next";
import Link from "next/link";
import { BadgeIndianRupee, CalendarRange, Truck } from "lucide-react";
import { getActiveCars, getActiveHubs, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { inr, phoneDigits } from "@/lib/format";
import { searchDefaults } from "@/lib/search-defaults";
import { CarImage } from "@/components/cars/CarImage";
import { SpecChips } from "@/components/cars/SpecChips";
import { SearchForm } from "@/components/booking/SearchForm";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { PageHeader } from "@/components/site/PageHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Monthly car rental in Chennai",
  description: "Rent a self drive car by the month in Chennai. Lower monthly rates, GST included, doorstep delivery.",
};

export default async function MonthlyPlansPage() {
  const [cars, hubs, settings] = await Promise.all([
    safe(getActiveCars, [], "cars"),
    safe(getActiveHubs, [], "hubs"),
    getPublicSettings(),
  ]);
  const monthly = cars.filter((c) => c.monthlyRate).sort((a, b) => (a.monthlyRate ?? 0) - (b.monthlyRate ?? 0));
  const { defaults, minDate } = searchDefaults(hubs, { type: "monthly" });
  const wa = phoneDigits(settings.whatsappNumber);

  return (
    <>
    <PageHeader
      eyebrow="A car for the long run"
      title={<>Monthly self drive <em className="not-italic text-brand-500">car rental</em></>}
      lead="Need a car for a month or longer? Monthly plans cost less per day than daily rentals, and we deliver the car to you."
    />
    <div className="container-page py-10">
      <ul className=" grid gap-3 sm:grid-cols-3">
        {[
          [BadgeIndianRupee, "Lower monthly rates", "GST included"],
          [CalendarRange, "30 days or more", "Extend whenever you need"],
          [Truck, "Doorstep delivery", "Home or office"],
        ].map(([Icon, t, s]) => {
          const I = Icon as typeof Truck;
          return (
            <li key={t as string} className="card flex items-center gap-3 p-4">
              <I className="size-7 text-brand-700" aria-hidden />
              <div><p className="font-bold">{t as string}</p><p className="text-sm text-muted">{s as string}</p></div>
            </li>
          );
        })}
      </ul>

      {monthly.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monthly.map((car) => (
            <article key={car.id} className="card flex flex-col overflow-hidden">
              <CarImage car={car} className="aspect-[16/10] w-full" />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h2 className="text-lg font-bold">{car.name}</h2>
                <SpecChips car={car} />
                <p className="mt-auto text-2xl font-extrabold">
                  {inr(car.monthlyRate ?? 0)}<span className="text-sm font-medium text-muted">/month</span>
                </p>
                <p className="text-xs text-muted">
                  GST included · {(car.includedKmPerDay ?? settings.includedKmPerDay) * 30} km included · extra {inr(car.extraKmRate)}/km
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="card mt-8 p-6 text-center text-muted">Monthly prices will appear here once they are set in admin. WhatsApp us for a quote.</p>
      )}

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Check monthly availability</h2>
          <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} />
        </div>
        <div className="rounded-[14px] bg-forest p-6 text-white sm:p-8">
          <h2 className="text-xl font-extrabold">Need a car for several months, or for your company?</h2>
          <p className="mt-2 text-white/80">Message us with how long you need it and we will send you a quote.</p>
          {wa && (
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi Smile Cars, I need a monthly rental quote.")}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-5">
              <WhatsAppIcon className="size-5" /> Get a quote on WhatsApp
            </a>
          )}
          <p className="mt-4 text-sm text-white/70">Or <Link href="/faq" className="underline">read our FAQ</Link>.</p>
        </div>
      </section>
    </div>
    </>
  );
}
