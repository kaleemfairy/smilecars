import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getAllCars } from "@/lib/data";
import { inr, LABELS } from "@/lib/format";
import { CarImage } from "@/components/cars/CarImage";
import { PageTitle } from "../ui";

export const metadata = { title: "Cars" };

export default async function CarsAdmin() {
  await requireStaff(["owner"]);
  const cars = await getAllCars();
  return (
    <>
      <PageTitle title="Cars">
        <Link href="/admin/cars/new" className="btn btn-primary"><Plus className="size-5" aria-hidden />Add car</Link>
      </PageTitle>
      {cars.length === 0 ? (
        <p className="card p-6 text-center text-muted">No cars yet. Add your first car.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cars.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/cars/${c.id}`} className="card flex gap-3 p-3 transition-colors hover:bg-brand-50">
                <CarImage car={c} className="h-16 w-24 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate font-bold">{c.name}</p>
                  <p className="text-xs text-muted">{LABELS.bodyType[c.bodyType]} · {LABELS.transmission[c.transmission]} · {LABELS.fuel[c.fuel]}{c.regNumber ? ` · ${c.regNumber}` : ""}</p>
                  <p className="text-sm font-semibold">{inr(c.dailyRate)}/day · {c.units} car{c.units > 1 ? "s" : ""}</p>
                  {!c.active && <span className="text-xs font-bold text-red-700">Inactive (hidden from website)</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
