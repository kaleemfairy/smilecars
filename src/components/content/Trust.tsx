import { Plane, Quote } from "lucide-react";
import { GOOGLE_RATING, PARTNERS_LINE, TESTIMONIALS, TRUST_POINTS } from "@/content/testimonials";

const FIGURES = [
  { value: "29", plus: "+", label: "years in Chennai" },
  { value: "2,00,000", plus: "+", label: "customers served" },
  { value: "200", plus: "+", label: "cars to choose from" },
  { value: GOOGLE_RATING.stars, plus: "★", label: `from ${GOOGLE_RATING.reviews.replace("3200", "3,200")} Google reviews` },
];

/** Full-width tinted band of trust figures and airline partners. */
export function ProofStrip() {
  return (
    <section aria-label="Smile Cars in numbers" className="bg-tint">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-5 py-6 md:flex md:items-center md:justify-between">
        {FIGURES.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <strong className="font-display text-[22px] font-extrabold tracking-tight md:text-[26px]">
              {f.value}
              <span className="text-brand-500">{f.plus}</span>
            </strong>
            <span className="text-[12px] text-[#5f6f6a]">{f.label}</span>
          </div>
        ))}
        <p className="col-span-2 flex items-start gap-2 border-t border-[#d2e3dd] pt-4 text-[12px] leading-5 text-[#5c6c67] md:max-w-[260px] md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <Plane className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
          <span>{PARTNERS_LINE}</span>
        </p>
      </div>
    </section>
  );
}

/** Compact grid of all trust points (used on inner pages). */
export function TrustStrip() {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TRUST_POINTS.map((t) => (
          <li key={t.label} className="card-tint p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-brand-700">{t.value}</p>
            <p className="text-sm text-muted">{t.label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-700">
        <Plane className="size-4 shrink-0 text-brand-700" aria-hidden />
        {PARTNERS_LINE}
      </p>
    </div>
  );
}

const AVATAR = ["bg-[#d6efe6] text-brand-700", "bg-[#f8e7dc] text-[#98654b]", "bg-[#e0e9f4] text-[#526c8d]"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Testimonials({ limit }: { limit?: number }) {
  const items = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;
  return (
    <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
      {items.map((t, i) => (
        <li key={t.name} className="card flex flex-col p-5 md:p-6">
          <blockquote className="flex-1 text-[14px] leading-7 text-[#485752]">{t.text}</blockquote>
          <div className="mt-5 flex items-center gap-3">
            <span className={`flex size-9 items-center justify-center rounded-full text-[11px] font-bold ${AVATAR[i % 3]}`} aria-hidden>
              {initials(t.name)}
            </span>
            <span className="flex-1">
              <b className="block text-[13px]">{t.name}</b>
              <small className="text-[11px] text-[#7b8982]">Smile Cars customer</small>
            </span>
            <Quote className="size-7 text-[#c6e9dc]" aria-hidden />
          </div>
        </li>
      ))}
    </ul>
  );
}
