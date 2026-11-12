// Client logo (public/logo.png, 223×61 with a transparent background).
// Ask the client for an SVG or a 2× PNG for sharper rendering on high-resolution phones.
export function Logo({ onDark = false, className = "h-10 w-auto" }: { onDark?: boolean; className?: string }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Smile Cars® — Rent-a-car, Own a Smile" width={223} height={61} className={className} />
  );
  // The logo has black lettering, so on dark backgrounds it sits on a white pill.
  return onDark ? <span className="inline-flex rounded-xl bg-white px-3 py-2">{img}</span> : img;
}
