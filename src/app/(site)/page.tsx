import Link from "next/link";
import { CalendarCheck, CarFront, Clock, Fuel, Gauge, Handshake, PhoneCall, ShieldCheck, Truck } from "lucide-react";
import { getActiveCars, getActiveHubs, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { inr, LABELS } from "@/lib/format";
import { searchDefaults } from "@/lib/search-defaults";
import { SearchForm } from "@/components/booking/SearchForm";
import { FleetCard } from "@/components/cars/FleetCard";
import { LOCATIONS } from "@/content/locations";
import { BODY_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [hubs, cars, settings] = await Promise.all([
    safe(getActiveHubs, [], "hubs"),
    safe(getActiveCars, [], "cars"),
    getPublicSettings(),
  ]);
  const { defaults, minDate } = searchDefaults(hubs);

  const categories = BODY_TYPES.map((type) => {
    const inType = cars.filter((c) => c.bodyType === type && c.dailyRate > 0);
    return { type, count: inType.length, from: inType.length ? Math.min(...inType.map((c) => c.dailyRate)) : 0 };
  }).filter((c) => c.count > 0);

  return (
    <>
      {/* Hero + booking search (step 1) */}
      <section className="bg-gradient-to-b from-brand-50 to-canvas">
        <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_440px] lg:items-center lg:py-16">
          <div>
            <p className="chip border-brand-100 bg-white text-brand-700">Serving Chennai for 29+ years</p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Self drive cars in Chennai, <span className="text-brand-600">delivered to your door</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Hatchbacks, sedans and SUVs by the day, week or month. See live availability and the full price
              before you book. GST included.
            </p>
            <ul className="mt-6 hidden gap-4 text-sm font-semibold sm:flex">
              <li className="flex items-center gap-2"><Truck className="size-5 text-brand-600" aria-hidden />Doorstep delivery</li>
              <li className="flex items-center gap-2"><Gauge className="size-5 text-brand-600" aria-hidden />{settings.includedKmPerDay} km/day included</li>
              <li className="flex items-center gap-2"><PhoneCall className="size-5 text-brand-600" aria-hidden />Real people confirm every booking</li>
            </ul>
          </div>
          <div className="card p-4 sm:p-6" id="book">
            <h2 className="mb-4 text-lg font-bold">Book your car</h2>
            <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-12">
        <h2 className="text-2xl font-extrabold">Book in 3 easy steps</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [CalendarCheck, "Search your dates", "Pick daily, weekly or monthly, your delivery hub and times."],
            [CarFront, "Choose a car", "Only cars free for your dates are shown, with the total price."],
            [PhoneCall, "We call to confirm", `We hold the car for ${settings.holdHours} hours and call you to confirm. No online payment.`],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof CalendarCheck;
            return (
              <li key={i} className="card flex gap-4 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <I className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{i + 1}. {title as string}</h3>
                  <p className="mt-1 text-sm text-muted">{text as string}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page py-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold">Explore our fleet</h2>
            <Link href="/cars" className="text-sm font-semibold text-brand-700 hover:underline">View all cars</Link>
          </div>
          <ul className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {categories.map((c) => (
              <li key={c.type} className="w-44 shrink-0 snap-start sm:w-auto">
                <Link href={`/cars?body=${c.type}`} className="card block p-4 hover:shadow-raised">
                  <CarFront className="size-7 text-brand-600" aria-hidden />
                  <p className="mt-3 font-bold">{LABELS.bodyType[c.type]}</p>
                  <p className="text-sm text-muted">from {inr(c.from)}/day</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cars.length > 0 && (
        <section className="container-page py-6">
          <h2 className="sr-only">Popular cars</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cars.slice(0, 6).map((car) => (
              <FleetCard key={car.id} car={car} kmPerDay={settings.includedKmPerDay} />
            ))}
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="container-page py-12">
        <h2 className="text-2xl font-extrabold">Why Chennai drives with Smile Cars</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Truck, "Doorstep delivery", "We bring the car to your home, office or station."],
            [ShieldCheck, "Clear pricing", "GST included. Delivery, FASTag and deposit shown as separate lines."],
            [Fuel, "Well-maintained cars", "Cleaned and checked before every trip."],
            [Clock, "29+ years in Chennai", "A local team you can call any time during your trip."],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Truck;
            return (
              <li key={title as string} className="card p-5">
                <I className="size-7 text-brand-600" aria-hidden />
                <h3 className="mt-3 font-bold">{title as string}</h3>
                <p className="mt-1 text-sm text-muted">{text as string}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Monthly + attach banners */}
      <section className="container-page grid gap-4 py-6 md:grid-cols-2">
        <div className="rounded-2xl bg-brand-700 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-400">Monthly plans</p>
          <h2 className="mt-2 text-2xl font-extrabold">Need a car for a month or more?</h2>
          <p className="mt-2 text-white/80">Lower monthly rates, delivered to your door. No loan, no maintenance worries.</p>
          <Link href="/monthly-plans" className="btn btn-primary mt-5">See monthly plans</Link>
        </div>
        <div className="card p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">For car owners</p>
          <h2 className="mt-2 text-2xl font-extrabold">Own a car? Attach it with us</h2>
          <p className="mt-2 text-muted">Earn from your car when you are not using it. Tell us about it and we will call you.</p>
          <Link href="/attach-your-vehicle" className="btn btn-secondary mt-5">
            <Handshake className="size-5" aria-hidden />
            Attach your vehicle
          </Link>
        </div>
      </section>

      {/* Areas */}
      <section className="container-page py-12">
        <h2 className="text-2xl font-extrabold">Areas we deliver to</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {LOCATIONS.map((l) => (
            <li key={l.slug}>
              <Link href={`/locations/${l.slug}`} className="chip px-4 py-2 text-sm text-ink hover:border-brand-600 hover:text-brand-700">
                Self drive cars in {l.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
