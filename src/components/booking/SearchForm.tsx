"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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

  return (
    <form action="/book" method="get" className="space-y-4">
      <div role="radiogroup" aria-label="Rental type" className="grid grid-cols-3 gap-1 rounded-xl bg-brand-50 p-1">
        {(["daily", "weekly", "monthly"] as const).map((t) => (
          <label
            key={t}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              type === t ? "bg-white text-brand-700 shadow-sm" : "text-muted"
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

      <div>
        <label htmlFor="hub" className="field-label">Delivery hub</label>
        <select id="hub" name="hub" defaultValue={defaults.hub} required className="field">
          {hubs.length === 0 && <option value="">No hubs set up yet</option>}
          {hubs.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
              {h.deliveryFee > 0 ? ` (delivery ${inr(h.deliveryFee)})` : " (free delivery)"}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="field-label">Delivery</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["two-way", "Delivery & pickup"],
              ["one-way", "Delivery only"],
            ] as const
          ).map(([value, text]) => (
            <label
              key={value}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold ${
                mode === value ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="sr-only"
              />
              {text}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pd" className="field-label">Pickup date</label>
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
            className="field"
          />
        </div>
        <div>
          <label htmlFor="pt" className="field-label">Pickup time</label>
          <select id="pt" name="pt" defaultValue={defaults.pt} className="field">
            {TIMES.map((t) => (
              <option key={t} value={t}>{label12(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rd" className="field-label">Return date</label>
          <input
            id="rd"
            name="rd"
            type="date"
            required
            min={addDays(pd, MIN_DAYS[type] === 1 ? 0 : MIN_DAYS[type])}
            value={rd}
            onChange={(e) => setRd(e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="rt" className="field-label">Return time</label>
          <select id="rt" name="rt" defaultValue={defaults.rt} className="field">
            {TIMES.map((t) => (
              <option key={t} value={t}>{label12(t)}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full text-base">
        <Search className="size-5" aria-hidden />
        {submitLabel}
      </button>
      <p className="text-center text-xs text-muted">Prices include GST · No online payment · We call to confirm</p>
    </form>
  );
}
