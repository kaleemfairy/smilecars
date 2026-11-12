import { Cog, Fuel, Users, CarFront } from "lucide-react";
import { LABELS } from "@/lib/format";
import type { Car } from "@/lib/types";

export function SpecChips({ car, withBody = true }: { car: Car; withBody?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Specifications">
      {withBody && (
        <li className="chip">
          <CarFront className="size-3.5" aria-hidden />
          {LABELS.bodyType[car.bodyType]}
        </li>
      )}
      <li className="chip">
        <Cog className="size-3.5" aria-hidden />
        {LABELS.transmission[car.transmission]}
      </li>
      <li className="chip">
        <Fuel className="size-3.5" aria-hidden />
        {LABELS.fuel[car.fuel]}
      </li>
      <li className="chip">
        <Users className="size-3.5" aria-hidden />
        {car.seats} seats
      </li>
    </ul>
  );
}
