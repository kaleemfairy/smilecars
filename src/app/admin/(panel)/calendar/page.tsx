import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { intervalsInRange } from "@/lib/bookings";
import { getAllCars } from "@/lib/data";
import { blocksCar } from "@/lib/availability-core";
import { addDays, istDayRange, requestTime, todayIst } from "@/lib/time";
import { fmtDateTime, fmtIsoDay } from "@/lib/format";
import type { Block, Booking } from "@/lib/types";
import { addBlock, deleteBlock } from "../../actions";
import { Flash, PageTitle } from "../ui";

export const metadata = { title: "Availability calendar" };

const DAYS = 14;
const STATUS_COLOR: Record<string, string> = {
  new: "bg-sky-500",
  confirmed: "bg-brand-600",
  delivered: "bg-violet-600",
  returned: "bg-slate-400",
  closed: "bg-slate-300",
};

export default async function CalendarPage(props: PageProps<"/admin/calendar">) {
  await requireStaff();
  const sp = await props.searchParams;
  const today = todayIst();
  const from = typeof sp.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : today;
  const days = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
  const start = istDayRange(from).start;
  const end = istDayRange(days[DAYS - 1]).end;
  const [cars, { bookings, blocks }] = await Promise.all([getAllCars(), intervalsInRange(start, end)]);
  const now = requestTime();

  // Expired holds no longer block the car, so leave them off the grid.
  const live = bookings.filter((b) => b.status !== "new" || blocksCar(b, now));

  const cell = (carId: string, day: string) => {
    const r = istDayRange(day);
    const bs: Booking[] = live.filter((b) => b.carId === carId && b.startAt < r.end && b.endAt > r.start);
    const bls: Block[] = blocks.filter((b) => b.carId === carId && b.startAt < r.end && b.endAt > r.start);
    return { bs, bls };
  };

  return (
    <>
      <PageTitle title="Availability calendar">
        <div className="flex items-center gap-2">
          <Link href={`/admin/calendar?from=${addDays(from, -7)}`} className="btn btn-sm btn-secondary" aria-label="Previous week"><ChevronLeft className="size-4" aria-hidden /></Link>
          <Link href="/admin/calendar" className="btn btn-sm btn-secondary">Today</Link>
          <Link href={`/admin/calendar?from=${addDays(from, 7)}`} className="btn btn-sm btn-secondary" aria-label="Next week"><ChevronRight className="size-4" aria-hidden /></Link>
        </div>
      </PageTitle>
      <Flash sp={sp} />

      <ul className="mb-3 flex flex-wrap gap-3 text-xs">
        {[["bg-sky-500", "New (held)"], ["bg-brand-600", "Confirmed"], ["bg-violet-600", "Delivered"], ["bg-slate-400", "Returned"], ["bg-amber-500", "Blocked"]].map(([c, l]) => (
          <li key={l} className="flex items-center gap-1.5"><span className={`size-3 rounded ${c}`} />{l}</li>
        ))}
      </ul>

      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-36 border-b border-line bg-white px-3 py-2 text-left">Car</th>
              {days.map((d) => (
                <th key={d} className={`min-w-16 border-b border-l border-line px-1 py-2 font-semibold ${d === today ? "bg-accent-300/40" : ""}`}>
                  {fmtIsoDay(d).replace(",", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className={car.active ? "" : "opacity-50"}>
                <th scope="row" className="sticky left-0 z-10 border-b border-line bg-white px-3 py-2 text-left font-semibold">
                  {car.name}
                  {car.regNumber && <span className="block font-normal text-muted">{car.regNumber}</span>}
                </th>
                {days.map((d) => {
                  const { bs, bls } = cell(car.id, d);
                  return (
                    <td key={d} className="h-12 border-b border-l border-line p-0.5 align-top">
                      <div className="flex flex-col gap-0.5">
                        {bs.map((b) => (
                          <Link key={b.id} href={`/admin/bookings/${b.id}`} title={`${b.ticket} · ${b.customerName} · ${fmtDateTime(b.startAt)} → ${fmtDateTime(b.endAt)}`} className={`truncate rounded px-1 py-0.5 text-[10px] font-bold text-white ${STATUS_COLOR[b.status] ?? "bg-slate-400"}`}>
                            {b.ticket}
                          </Link>
                        ))}
                        {bls.map((bl) => (
                          <span key={bl.id} title={`${bl.reason}: ${bl.note}`} className="truncate rounded bg-amber-500 px-1 py-0.5 text-[10px] font-bold capitalize text-white">
                            {bl.reason}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {cars.length === 0 && <p className="p-6 text-center text-muted">Add cars first.</p>}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold">Block a car</h2>
          <p className="text-sm text-muted">For servicing, walk-in or phone bookings. Blocked cars don&apos;t show online for those times.</p>
          <form action={addBlock} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="from" value={from} />
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="carId">Car</label>
              <select id="carId" name="carId" required className="field">
                {cars.map((c) => <option key={c.id} value={c.id}>{c.name}{c.regNumber ? ` (${c.regNumber})` : ""}</option>)}
              </select>
            </div>
            <div><label className="field-label" htmlFor="startDate">From date</label><input id="startDate" name="startDate" type="date" required defaultValue={today} className="field" /></div>
            <div><label className="field-label" htmlFor="startTime">From time</label><input id="startTime" name="startTime" type="time" defaultValue="09:00" className="field" /></div>
            <div><label className="field-label" htmlFor="endDate">To date</label><input id="endDate" name="endDate" type="date" required defaultValue={today} className="field" /></div>
            <div><label className="field-label" htmlFor="endTime">To time</label><input id="endTime" name="endTime" type="time" defaultValue="18:00" className="field" /></div>
            <div>
              <label className="field-label" htmlFor="reason">Reason</label>
              <select id="reason" name="reason" className="field"><option value="servicing">Servicing</option><option value="walk-in">Walk-in / phone booking</option><option value="other">Other</option></select>
            </div>
            <div><label className="field-label" htmlFor="note">Note</label><input id="note" name="note" maxLength={300} className="field" placeholder="Customer name, garage…" /></div>
            <button type="submit" className="btn btn-teal sm:col-span-2">Add block</button>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Blocks in this period</h2>
          {blocks.length === 0 ? (
            <p className="mt-2 text-sm text-muted">None.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {blocks.sort((a, b) => a.startAt - b.startAt).map((bl) => (
                <li key={bl.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <strong>{cars.find((c) => c.id === bl.carId)?.name ?? "Car"}</strong> · <span className="capitalize">{bl.reason}</span>
                    <span className="block text-xs text-muted">{fmtDateTime(bl.startAt)} → {fmtDateTime(bl.endAt)}{bl.note ? ` · ${bl.note}` : ""}</span>
                  </span>
                  <form action={deleteBlock}>
                    <input type="hidden" name="id" value={bl.id} />
                    <input type="hidden" name="from" value={from} />
                    <button type="submit" className="btn btn-sm border border-red-300 text-red-700 hover:bg-red-50">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
