import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getActiveCars, getActiveHubs, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { inr } from "@/lib/format";
import { searchDefaults } from "@/lib/search-defaults";
import { getLocation, LOCATIONS } from "@/content/locations";
import { AREA_CONTENT } from "@/content/legacy";
import { Prose } from "@/components/content/Prose";
import { SearchForm } from "@/components/booking/SearchForm";
import { FleetCard } from "@/components/cars/FleetCard";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/locations/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const loc = getLocation(slug);
  if (!loc) return {};
  return {
    title: `Self drive cars in ${loc.name}, Chennai`,
    description: `Rent a self drive car in ${loc.name}, Chennai with doorstep delivery. Hatchbacks, sedans and SUVs by the day, week or month. GST included.`,
    alternates: { canonical: `/locations/${loc.slug}` },
  };
}

export default async function LocationPage(props: PageProps<"/locations/[slug]">) {
  const { slug } = await props.params;
  const loc = getLocation(slug);
  if (!loc) notFound();
  const [hubs, cars, settings] = await Promise.all([
    safe(getActiveHubs, [], "hubs"),
    safe(getActiveCars, [], "cars"),
    getPublicSettings(),
  ]);
  const { defaults, minDate } = searchDefaults(hubs, { hub: loc.hubId });
  const legacy = AREA_CONTENT[loc.slug];
  const hub = hubs.find((h) => h.id === defaults.hub);

  const faq = [
    {
      q: `Do you deliver self drive cars in ${loc.name}?`,
      a: `Yes. Choose ${hub?.name ?? "your nearest hub"} when you book and we deliver the car to your address in ${loc.name}.`,
    },
    {
      q: "What does delivery cost?",
      a: hub
        ? hub.deliveryFee > 0
          ? `Delivery from ${hub.name} is ${inr(hub.deliveryFee)} each way. The fee is shown in your price before you book.`
          : `Delivery from ${hub.name} is free.`
        : "The delivery fee for your hub is shown in your price before you book.",
    },
    {
      q: "What documents do I need?",
      a: "A valid driving licence, Aadhaar card, and employee ID or business proof.",
    },
    {
      q: "How many km are included?",
      a: `Usually ${settings.includedKmPerDay} km per day. Each car shows its allowance and extra-km rate.`,
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <p className="chip text-brand-700"><MapPin className="size-3.5" aria-hidden />Chennai</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Self drive cars in {loc.name}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">{loc.intro}</p>
          <h2 className="mt-6 font-bold">We deliver around</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {loc.nearby.map((n) => <li key={n} className="chip text-ink">{n}</li>)}
          </ul>
        </div>
        <div className="card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Book a car in {loc.name}</h2>
          <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} />
        </div>
      </div>

      {legacy && legacy.sections.length > 0 && (
        <section className="mt-10 max-w-3xl" aria-label={`About self drive cars in ${loc.name}`}>
          <Prose sections={legacy.sections} />
        </section>
      )}

      {cars.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold">Popular cars in {loc.name}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cars.slice(0, 3).map((c) => <FleetCard key={c.id} car={c} kmPerDay={settings.includedKmPerDay} waNumber={settings.whatsappNumber} />)}
          </div>
        </section>
      )}

      <section className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-extrabold">{loc.name} FAQ</h2>
        <div className="mt-4 space-y-2">
          {faq.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Other areas we serve</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {LOCATIONS.filter((l) => l.slug !== loc.slug).map((l) => (
            <li key={l.slug}><Link href={`/locations/${l.slug}`} className="chip px-3 py-1.5 text-sm text-ink hover:text-brand-700">{l.name}</Link></li>
          ))}
        </ul>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
