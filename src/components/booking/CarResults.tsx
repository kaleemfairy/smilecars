"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { inr, LABELS } from "@/lib/format";
import { BODY_TYPES, FUELS, TRANSMISSIONS, type Car, type PriceBreakdown } from "@/lib/types";
import { CarImage } from "@/components/cars/CarImage";
import { SpecChips } from "@/components/cars/SpecChips";
import { CarWhatsApp } from "@/components/cars/CarWhatsApp";

interface Result {
  car: Car;
  price: PriceBreakdown;
}

type Sort = "price-asc" | "price-desc";

export function CarResults({
  results,
  confirmQuery,
  waNumber = "",
  tripLabel = "",
}: {
  results: Result[];
  confirmQuery: string;
  waNumber?: string;
  tripLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [body, setBody] = useState<string[]>([]);
  const [trans, setTrans] = useState<string[]>([]);
  const [fuel, setFuel] = useState<string[]>([]);
  const [seats, setSeats] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("price-asc");
  const [showFilters, setShowFilters] = useState(false);

  const seatOptions = useMemo(() => [...new Set(results.map((r) => r.car.seats))].sort((a, b) => a - b), [results]);
  const activeFilters = body.length + trans.length + fuel.length + (seats ? 1 : 0);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return results
      .filter((r) => !term || r.car.name.toLowerCase().includes(term))
      .filter((r) => !body.length || body.includes(r.car.bodyType))
      .filter((r) => !trans.length || trans.includes(r.car.transmission))
      .filter((r) => !fuel.length || fuel.includes(r.car.fuel))
      .filter((r) => !seats || r.car.seats >= seats)
      .sort((a, b) => (sort === "price-asc" ? 1 : -1) * (a.price.total - b.price.total));
  }, [results, q, body, trans, fuel, seats, sort]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const clear = () => {
    setBody([]);
    setTrans([]);
    setFuel([]);
    setSeats(null);
  };

  if (results.length === 0) {
    return (
      <div className="card mt-5 p-6 text-center">
        <p className="font-bold">No cars are free for these dates.</p>
        <p className="mt-2 text-muted">Try different dates or another rental type, or message us on WhatsApp and we will help.</p>
        <Link href={`/book?${confirmQuery}&edit=1`} className="btn btn-primary mt-5">Change dates</Link>
      </div>
    );
  }

  const filterGroup = (
    title: string,
    options: readonly string[],
    labels: Record<string, string>,
    selected: string[],
    set: (v: string[]) => void,
  ) => {
    const present = options.filter((o) => results.some((r) => Object.values(r.car).includes(o)));
    if (present.length < 2) return null;
    return (
      <fieldset>
        <legend className="mb-2 text-sm font-bold">{title}</legend>
        <div className="flex flex-wrap gap-2">
          {present.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={selected.includes(o)}
              onClick={() => toggle(selected, set, o)}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                selected.includes(o) ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white"
              }`}
            >
              {labels[o]}
            </button>
          ))}
        </div>
      </fieldset>
    );
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="car-search">Search car name</label>
        <input
          id="car-search"
          type="search"
          placeholder="Search car name, e.g. Swift"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="field sm:max-w-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className="btn btn-sm btn-secondary flex-1 sm:flex-none"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters{activeFilters ? ` (${activeFilters})` : ""}
          </button>
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field flex-1 sm:w-56 sm:flex-none">
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="card mt-3 space-y-4 p-4">
          {filterGroup("Body type", BODY_TYPES, LABELS.bodyType, body, setBody)}
          {filterGroup("Transmission", TRANSMISSIONS, LABELS.transmission, trans, setTrans)}
          {filterGroup("Fuel", FUELS, LABELS.fuel, fuel, setFuel)}
          {seatOptions.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold">Seats</legend>
              <div className="flex flex-wrap gap-2">
                {seatOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={seats === s}
                    onClick={() => setSeats(seats === s ? null : s)}
                    className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                      seats === s ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white"
                    }`}
                  >
                    {s}+ seats
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={clear} className="btn btn-sm flex-1 border border-line-strong">
              <X className="size-4" aria-hidden /> Clear
            </button>
            <button type="button" onClick={() => setShowFilters(false)} className="btn btn-sm btn-teal flex-1">
              Show {shown.length} car{shown.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {shown.length} car{shown.length === 1 ? "" : "s"} available for your dates
      </p>

      <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map(({ car, price }) => (
          <li key={car.id} className="card flex flex-col overflow-hidden">
            <CarImage car={car} className="aspect-[16/10] w-full" />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <h2 className="text-lg font-bold">{car.name}</h2>
              <SpecChips car={car} />
              <p className="text-xs text-muted">
                {price.includedKm.toLocaleString("en-IN")} km included · extra {inr(car.extraKmRate)}/km
              </p>
              <div className="mt-auto flex items-end justify-between gap-3 rounded-xl bg-brand-50 p-3">
                <div>
                  <p className="text-sm text-muted">{inr(car.dailyRate)}/day</p>
                  <p className="text-2xl font-extrabold tabular-nums">{inr(price.total)}</p>
                  <p className="text-xs text-muted">total for {price.days} day{price.days > 1 ? "s" : ""}, GST incl.</p>
                </div>
                <div className="flex gap-2">
                  <CarWhatsApp waNumber={waNumber} carName={car.name} extra={tripLabel} />
                  <Link href={`/book/confirm?${confirmQuery}&car=${encodeURIComponent(car.id)}`} className="btn btn-primary">
                    Select
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="card mt-3 p-6 text-center text-muted">No cars match these filters. <button type="button" onClick={clear} className="font-semibold text-brand-700 underline">Clear filters</button></p>
      )}
    </div>
  );
}
