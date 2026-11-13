"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { addDays } from "@/lib/time";
import { inr } from "@/lib/format";
import type { DeliveryMode, RentalType } from "@/lib/types";

const MIN_DAYS: Record<RentalType, number> = { daily: 1, weekly: 7, monthly: 30 };

export interface SearchDefaults {
  type: RentalType;
  hub: string;
  mode: DeliveryMode;
  pd: string;
  pt: string;
  rd: string;
  rt: string;
}

interface Props {
  hubs: { id: string; name: string; deliveryFee: number }[];
  defaults: SearchDefaults;
  /** Earliest selectable pickup date (YYYY-MM-DD, IST). */
  minDate: string;
  submitLabel?: string;
}

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 ? "30" : "00";
  return `${h}:${m}`;
});

function label12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Step 1 of the booking flow. Submits as a GET form to /book so results are shareable links. */
export function SearchForm({ hubs, defaults, minDate, submitLabel = "Find available cars" }: Props) {
  const [type, setType] = useState<RentalType>(defaults.type);
  const [mode, setMode] = useState<DeliveryMode>(defaults.mode);
  const [pd, setPd] = useState(defaults.pd);
  const [rd, setRd] = useState(defaults.rd);

  function ensureMinReturn(nextType: RentalType, pickup: string) {
    const min = addDays(pickup, MIN_DAYS[nextType]);
    if (rd < min) setRd(min);
  }

  const box =
    "flex min-w-0 flex-col justify-center gap-1 rounded-lg border border-[#e5ebe9] bg-white px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20";
  const cap = "text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7a76]";
  const ctl = "w-full min-w-0 min-h-7 bg-transparent text-[14px] font-semibold text-[#34423f] outline-none";

  return (
    <form action="/book" method="get" className="@container">
      <div role="radiogroup" aria-label="Rental type" className="mb-4 flex gap-6 border-b border-line">
        {(["daily", "weekly", "monthly"] as const).map((t) => (
          <label
            key={t}
            className={`relative -mb-px flex min-h-11 cursor-pointer items-center border-b-2 px-0.5 text-[14px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500 ${
              type === t ? "border-brand-500 text-brand-700" : "border-transparent text-[#6f7b81] hover:text-ink"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => {
                setType(t);
                ensureMinReturn(t, pd);
              }}
              className="sr-only"
            />
            {t === "daily" ? "Daily" : t === "weekly" ? "Weekly" : "Monthly"}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 @4xl:grid-cols-[1fr_1fr_1.35fr_1.35fr_auto]">
        <div className={box}>
          <label htmlFor="hub" className={cap}>Delivery hub</label>
          <select id="hub" name="hub" defaultValue={defaults.hub} required className={ctl}>
            {hubs.length === 0 && <option value="">No hubs set up yet</option>}
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
                {h.deliveryFee > 0 ? ` (delivery ${inr(h.deliveryFee)})` : " (free delivery)"}
              </option>
            ))}
          </select>
        </div>

        <div className={box}>
          <label htmlFor="mode" className={cap}>Delivery option</label>
          <select id="mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value as DeliveryMode)} className={ctl}>
            <option value="two-way">Delivery &amp; pickup</option>
            <option value="one-way">Delivery only</option>
          </select>
        </div>

        <fieldset className={`${box} col-span-2 @4xl:col-span-1`}>
          <legend className="sr-only">Pickup</legend>
          <span className={cap} aria-hidden>Pickup date &amp; time</span>
          <div className="flex items-center gap-2">
            <label htmlFor="pd" className="sr-only">Pickup date</label>
            <input
              id="pd"
              name="pd"
              type="date"
              required
              min={minDate}
              value={pd}
              onChange={(e) => {
                setPd(e.target.value);
                ensureMinReturn(type, e.target.value);
              }}
              className={`${ctl} flex-[1.3]`}
            />
            <span className="h-5 w-px bg-line" aria-hidden />
            <label htmlFor="pt" className="sr-only">Pickup time</label>
            <select id="pt" name="pt" defaultValue={defaults.pt} className={`${ctl} flex-1`}>
              {TIMES.map((t) => (
                <option key={t} value={t}>{label12(t)}</option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className={`${box} col-span-2 @4xl:col-span-1`}>
          <legend className="sr-only">Return</legend>
          <span className={cap} aria-hidden>Return date &amp; time</span>
          <div className="flex items-center gap-2">
            <label htmlFor="rd" className="sr-only">Return date</label>
            <input
              id="rd"
              name="rd"
              type="date"
              required
              min={addDays(pd, MIN_DAYS[type] === 1 ? 0 : MIN_DAYS[type])}
              value={rd}
              onChange={(e) => setRd(e.target.value)}
              className={`${ctl} flex-[1.3]`}
            />
            <span className="h-5 w-px bg-line" aria-hidden />
            <label htmlFor="rt" className="sr-only">Return time</label>
            <select id="rt" name="rt" defaultValue={defaults.rt} className={`${ctl} flex-1`}>
              {TIMES.map((t) => (
                <option key={t} value={t}>{label12(t)}</option>
              ))}
            </select>
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary col-span-2 min-h-[58px] whitespace-nowrap px-6 text-[14px] @4xl:col-span-1">
          {submitLabel}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12px] text-[#6b7773]">
        <span>No login · No online payment · We call to confirm</span>
        <span>Prices in ₹ · GST included</span>
      </p>
    </form>
  );
}
