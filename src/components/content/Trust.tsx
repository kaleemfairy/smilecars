import { Plane, Quote } from "lucide-react";
import { PARTNERS_LINE, TESTIMONIALS, TRUST_POINTS } from "@/content/testimonials";

export function TrustStrip() {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TRUST_POINTS.map((t) => (
          <li key={t.label} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-700">{t.value}</p>
            <p className="text-sm text-muted">{t.label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-700">
        <Plane className="size-4 shrink-0 text-brand-600" aria-hidden />
        {PARTNERS_LINE}
      </p>
    </div>
  );
}

export function Testimonials({ limit }: { limit?: number }) {
  const items = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;
  return (
    <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {items.map((t) => (
        <li key={t.name} className="card flex w-72 shrink-0 snap-start flex-col p-5 md:w-auto">
          <Quote className="size-6 text-brand-500" aria-hidden />
          <blockquote className="mt-2 flex-1 text-sm leading-6 text-slate-700">{t.text}</blockquote>
          <p className="mt-3 text-sm font-bold">{t.name}</p>
        </li>
      ))}
    </ul>
  );
}
