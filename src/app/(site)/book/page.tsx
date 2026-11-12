import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { getActiveHubs } from "@/lib/data";
import { findAvailableCars } from "@/lib/bookings";
import { pickParams, SEARCH_KEYS, searchToQuery, validateSearch } from "@/lib/search";
import { searchDefaults } from "@/lib/search-defaults";
import { safe } from "@/lib/safe";
import { fmtIsoDay, fmtTime12, LABELS } from "@/lib/format";
import { SearchForm } from "@/components/booking/SearchForm";
import { Stepper } from "@/components/booking/Stepper";
import { CarResults } from "@/components/booking/CarResults";
import type { DeliveryMode, RentalType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Book a self drive car",
  description: "Check which self drive cars are free for your dates in Chennai and see the full price.",
};

export default async function BookPage(props: PageProps<"/book">) {
  const sp = await props.searchParams;
  const raw = pickParams(sp, [...SEARCH_KEYS]);
  const hubs = await safe(getActiveHubs, [], "hubs");
  const hasSearch = Object.keys(raw).length > 0;
  const result = hasSearch ? validateSearch(raw) : null;

  const editing = sp.edit === "1";

  // Step 1: no search yet, editing, or the search was not valid
  if (!result || !result.ok || editing) {
    const { defaults, minDate } = searchDefaults(hubs, {
      type: raw.type as RentalType | undefined,
      hub: raw.hub,
      mode: raw.mode as DeliveryMode | undefined,
      pd: raw.pd,
      pt: raw.pt,
      rd: raw.rd,
      rt: raw.rt,
    });
    return (
      <div className="container-page max-w-xl py-6">
        <Stepper current={1} />
        <h1 className="mt-6 text-2xl font-extrabold">When do you need the car?</h1>
        {result && !result.ok && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {result.error}
          </p>
        )}
        <div className="card mt-5 p-4 sm:p-6">
          <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} />
        </div>
      </div>
    );
  }

  // Step 2: available cars
  const search = result.search;
  const { hub, results } = await findAvailableCars(search);
  if (!hub) {
    return (
      <div className="container-page max-w-xl py-10">
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-red-800">
          That delivery hub is not available. <Link href="/book" className="font-semibold underline">Start again</Link>
        </p>
      </div>
    );
  }
  const query = searchToQuery(search);

  return (
    <div className="container-page py-6">
      <Stepper current={2} />
      <div className="card mt-5 flex items-start justify-between gap-3 p-4">
        <div className="text-sm">
          <p className="font-bold">
            {hub.name} · {LABELS.rentalType[search.type]} · {search.days} day{search.days > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-muted">
            {fmtIsoDay(search.pd)}, {fmtTime12(search.pt)} → {fmtIsoDay(search.rd)}, {fmtTime12(search.rt)}
          </p>
          <p className="mt-1 text-muted">{LABELS.deliveryMode[search.mode]}</p>
        </div>
        <Link href={`/book?${query}&edit=1`} className="btn btn-sm btn-secondary shrink-0" aria-label="Edit search">
          <Pencil className="size-4" aria-hidden />
          Edit
        </Link>
      </div>
      <h1 className="mt-6 text-2xl font-extrabold">Choose your car</h1>
      <CarResults
        results={results.map((r) => ({ car: { ...r.car, regNumber: "" }, price: r.price }))}
        confirmQuery={query}
      />
    </div>
  );
}
