import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCars, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { LABELS } from "@/lib/format";
import { BODY_TYPES, type BodyType } from "@/lib/types";
import { FleetCard } from "@/components/cars/FleetCard";
import { PageHeader } from "@/components/site/PageHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our fleet of self drive cars",
  description: "Hatchbacks, sedans, SUVs and 7-seaters for self drive rental in Chennai. Daily prices include GST.",
};

export default async function FleetPage(props: PageProps<"/cars">) {
  const sp = await props.searchParams;
  const body = typeof sp.body === "string" && (BODY_TYPES as readonly string[]).includes(sp.body) ? (sp.body as BodyType) : null;
  const [cars, settings] = await Promise.all([safe(getActiveCars, [], "cars"), getPublicSettings()]);
  const types = BODY_TYPES.filter((t) => cars.some((c) => c.bodyType === t));
  const shown = body ? cars.filter((c) => c.bodyType === body) : cars;

  return (
    <>
    <PageHeader
      eyebrow="Find your kind of drive"
      title={<>Room for every <em className="not-italic text-brand-500">plan.</em></>}
      lead="Our fleet of self drive cars in Chennai. Daily prices include GST. Pick your dates to see which cars are free and the total price."
    />
    <div className="container-page py-8">
      <nav aria-label="Car types" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/cars" aria-current={!body ? "page" : undefined} className={`chip min-h-11 shrink-0 px-4 text-sm ${!body ? "border-brand-700 bg-brand-700 text-white" : "text-ink hover:border-brand-500"}`}>
          All ({cars.length})
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/cars?body=${t}`}
            aria-current={body === t ? "page" : undefined}
            className={`chip min-h-11 shrink-0 px-4 text-sm ${body === t ? "border-brand-700 bg-brand-700 text-white" : "text-ink hover:border-brand-500"}`}
          >
            {LABELS.bodyType[t]}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-muted">Cars will appear here once they are added in admin.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((car) => (
            <FleetCard key={car.id} car={car} kmPerDay={settings.includedKmPerDay} waNumber={settings.whatsappNumber} />
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <Link href="/book" className="btn btn-primary">Check availability for my dates</Link>
      </div>
    </div>
    </>
  );
}
