import Link from "next/link";
import { inr } from "@/lib/format";
import type { Car } from "@/lib/types";
import { CarImage } from "./CarImage";
import { SpecChips } from "./SpecChips";
import { CarWhatsApp } from "./CarWhatsApp";

/** Fleet / catalogue card without dates (no availability). */
export function FleetCard({ car, kmPerDay, waNumber = "" }: { car: Car; kmPerDay: number; waNumber?: string }) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link href={`/cars/${car.slug}`} className="block">
        <CarImage car={car} className="aspect-[16/10] w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg font-bold">
          <Link href={`/cars/${car.slug}`} className="hover:text-brand-700">{car.name}</Link>
        </h3>
        <SpecChips car={car} />
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="text-2xl font-extrabold">
              {inr(car.dailyRate)}
              <span className="text-sm font-medium text-muted">/day</span>
            </p>
            <p className="text-xs text-muted">GST included · {car.includedKmPerDay ?? kmPerDay} km/day</p>
          </div>
          <div className="flex gap-2">
            <CarWhatsApp waNumber={waNumber} carName={car.name} />
            <Link href={`/cars/${car.slug}`} className="btn btn-sm btn-secondary">Details</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
