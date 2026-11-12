import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCars, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { LABELS } from "@/lib/format";
import { BODY_TYPES, type BodyType } from "@/lib/types";
import { FleetCard } from "@/components/cars/FleetCard";

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
    <div className="container-page py-8">
      <h1 className="text-3xl font-extrabold">Our fleet</h1>
      <p className="mt-2 text-muted">Daily prices include GST. Pick your dates to see which cars are free and the total price.</p>
      <nav aria-label="Car types" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/cars" aria-current={!body ? "page" : undefined} className={`chip shrink-0 px-4 py-2 text-sm ${!body ? "border-brand-600 bg-brand-600 text-white" : "text-ink"}`}>
          All ({cars.length})
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/cars?body=${t}`}
            aria-current={body === t ? "page" : undefined}
            className={`chip shrink-0 px-4 py-2 text-sm ${body === t ? "border-brand-600 bg-brand-600 text-white" : "text-ink"}`}
          >
            {LABELS.bodyType[t]}
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-muted">Cars will appear here once they are added in admin.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((car) => (
            <FleetCard key={car.id} car={car} kmPerDay={settings.includedKmPerDay} />
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <Link href="/book" className="btn btn-primary">Check availability for my dates</Link>
      </div>
    </div>
  );
}
