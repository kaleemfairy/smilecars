// Client logo (public/logo.png, 600×163, transparent background, cut from the client's 1024px artwork).
export function Logo({ onDark = false, className = "h-10 w-auto" }: { onDark?: boolean; className?: string }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Smile Cars® — Rent-a-car, Own a Smile" width={600} height={163} className={className} />
  );
  // The logo has dark grey lettering, so on dark backgrounds it sits on a white pill.
  return onDark ? <span className="inline-flex rounded-xl bg-white px-3 py-2">{img}</span> : img;
}
