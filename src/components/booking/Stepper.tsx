import { Check } from "lucide-react";

const STEPS = ["Search", "Choose car", "Confirm"];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Booking steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done ? "bg-brand-600 text-white" : active ? "bg-accent-400 text-ink" : "bg-line text-muted"
              }`}
            >
              {done ? <Check className="size-4" aria-hidden /> : n}
            </span>
            <span className={`text-xs font-semibold sm:text-sm ${active ? "text-ink" : "text-muted"}`}>{label}</span>
            {n < STEPS.length && <span className="hidden h-px flex-1 bg-line sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
