import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getCarById, getSettings } from "@/lib/data";
import { LABELS } from "@/lib/format";
import { BODY_TYPES, FUELS, TRANSMISSIONS, type Car } from "@/lib/types";
import { changeCarPhoto, saveCar } from "../../../actions";
import { Flash } from "../../ui";
import { PhotoUpload } from "./PhotoUpload";

export const metadata = { title: "Edit car" };

const EMPTY: Car = {
  id: "",
  slug: "",
  name: "",
  bodyType: "hatchback",
  transmission: "manual",
  fuel: "petrol",
  seats: 5,
  units: 1,
  dailyRate: 0,
  weeklyRate: null,
  monthlyRate: null,
  includedKmPerDay: null,
  extraKmRate: 0,
  photos: [],
  description: "",
  features: [],
  active: true,
  sortOrder: 0,
  regNumber: "",
};

export default async function CarEdit(props: PageProps<"/admin/cars/[id]">) {
  await requireStaff(["owner"]);
  const { id } = await props.params;
  const sp = await props.searchParams;
  const isNew = id === "new";
  const car = isNew ? EMPTY : await getCarById(id);
  if (!car) notFound();
  const settings = await getSettings();

  const num = (name: keyof Car, label: string, help?: string, required = false) => (
    <div>
      <label htmlFor={name} className="field-label">{label}{required ? " *" : ""}</label>
      <input id={name} name={name} type="number" min={0} step="any" required={required} defaultValue={(car[name] as number | null) ?? ""} className="field" />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl">
      <Link href="/admin/cars" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><ArrowLeft className="size-4" aria-hidden />All cars</Link>
      <h1 className="mb-5 text-2xl font-extrabold">{isNew ? "Add car" : car.name}</h1>
      <Flash sp={sp} />

      <form action={saveCar} className="card grid gap-4 p-5 sm:grid-cols-2">
        <input type="hidden" name="id" value={car.id} />
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field-label">Name *</label>
          <input id="name" name="name" required defaultValue={car.name} className="field" placeholder="Maruti Swift (Automatic)" />
        </div>
        <div>
          <label htmlFor="bodyType" className="field-label">Body type</label>
          <select id="bodyType" name="bodyType" defaultValue={car.bodyType} className="field">{BODY_TYPES.map((v) => <option key={v} value={v}>{LABELS.bodyType[v]}</option>)}</select>
        </div>
        <div>
          <label htmlFor="transmission" className="field-label">Transmission</label>
          <select id="transmission" name="transmission" defaultValue={car.transmission} className="field">{TRANSMISSIONS.map((v) => <option key={v} value={v}>{LABELS.transmission[v]}</option>)}</select>
        </div>
        <div>
          <label htmlFor="fuel" className="field-label">Fuel</label>
          <select id="fuel" name="fuel" defaultValue={car.fuel} className="field">{FUELS.map((v) => <option key={v} value={v}>{LABELS.fuel[v]}</option>)}</select>
        </div>
        {num("seats", "Seats", undefined, true)}
        {num("units", "Number of cars of this model", "How many can be out at the same time. Each booking or block uses one.", true)}
        {num("dailyRate", "Daily rate ₹ (GST incl.)", undefined, true)}
        {num("weeklyRate", "Weekly rate ₹ (7 days)", "Leave blank to charge 7 × daily.")}
        {num("monthlyRate", "Monthly rate ₹ (30 days)", "Leave blank to hide from Monthly Plans.")}
        {num("includedKmPerDay", "Included km per day", `Blank = default (${settings.includedKmPerDay} km).`)}
        {num("extraKmRate", "Extra km rate ₹/km")}
        <div>
          <label htmlFor="regNumber" className="field-label">Registration number</label>
          <input id="regNumber" name="regNumber" defaultValue={car.regNumber} className="field uppercase" placeholder="TN 02 AB 1234" />
          <p className="mt-1 text-xs text-muted">Admin only. Not shown on the website.</p>
        </div>
        {num("sortOrder", "Display order", "Lower numbers show first.")}
        <div>
          <label htmlFor="slug" className="field-label">Web address</label>
          <input id="slug" name="slug" defaultValue={car.slug} className="field" placeholder="auto from name" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="field-label">Description</label>
          <textarea id="description" name="description" defaultValue={car.description} maxLength={1000} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="features" className="field-label">Features (one per line)</label>
          <textarea id="features" name="features" defaultValue={car.features.join("\n")} className="field" placeholder={"Touchscreen with Android Auto\nRear parking camera"} />
        </div>
        <label className="flex items-center gap-2 font-semibold sm:col-span-2">
          <input type="checkbox" name="active" defaultChecked={car.active} className="size-5 accent-brand-600" />
          Active (shown on the website and bookable)
        </label>
        <button type="submit" className="btn btn-primary sm:col-span-2">{isNew ? "Create car" : "Save changes"}</button>
      </form>

      {!isNew && (
        <section className="card mt-5 p-5">
          <h2 className="font-bold">Photos</h2>
          <p className="text-sm text-muted">The first photo is the main one. Photos are resized before upload.</p>
          {car.photos.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {car.photos.map((src, i) => (
                <li key={src} className="overflow-hidden rounded-xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${car.name} photo ${i + 1}`} className="aspect-[16/10] w-full object-cover" />
                  <div className="flex gap-1 p-1.5">
                    {i > 0 && (
                      <form action={changeCarPhoto} className="flex-1">
                        <input type="hidden" name="id" value={car.id} /><input type="hidden" name="index" value={i} /><input type="hidden" name="op" value="first" />
                        <button className="btn btn-sm w-full border border-line-strong text-xs" type="submit">Make main</button>
                      </form>
                    )}
                    <form action={changeCarPhoto} className="flex-1">
                      <input type="hidden" name="id" value={car.id} /><input type="hidden" name="index" value={i} /><input type="hidden" name="op" value="remove" />
                      <button className="btn btn-sm w-full border border-red-300 text-xs text-red-700" type="submit">Remove</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <PhotoUpload carId={car.id} />
        </section>
      )}
    </div>
  );
}
