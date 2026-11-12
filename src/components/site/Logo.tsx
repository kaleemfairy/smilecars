// Text logo placeholder. Replace with the client's logo file (public/logo.svg) when available.
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-accent-400"
      >
        ☺
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-brand-700"}`}>
        smile<span className={light ? "text-accent-400" : "text-ink"}>cars</span>
        <sup className="text-[0.55em] font-semibold">®</sup>
      </span>
    </span>
  );
}
