import type { Car } from "@/lib/types";

/**
 * Car photo with a neutral placeholder when no photo has been uploaded yet.
 * Uses a plain <img>: photos are already resized on upload, and this avoids
 * Vercel image-optimisation limits on the free plan.
 */
export function CarImage({
  car,
  index = 0,
  className = "",
  eager = false,
}: {
  car: Pick<Car, "name" | "photos">;
  index?: number;
  className?: string;
  eager?: boolean;
}) {
  const src = car.photos[index];
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-50 to-white ${className}`}
        role="img"
        aria-label={`${car.name} (photo coming soon)`}
      >
        <svg viewBox="0 0 120 50" className="w-1/2 text-brand-600/40" fill="currentColor" aria-hidden>
          <path d="M18 34c0-4 3-7 7-7s7 3 7 7h56c0-4 3-7 7-7s7 3 7 7h6c2 0 3-1 3-3v-6c0-3-2-5-5-6l-14-3-12-10c-2-1-4-2-6-2H44c-3 0-5 1-7 3l-9 9-15 3c-3 1-5 3-5 6v6c0 2 1 3 3 3h7zm29-21h12v8H38l6-6c1-1 2-2 3-2zm16 0h10c1 0 2 0 3 1l7 7H63v-8z" />
          <circle cx="25" cy="35" r="5" />
          <circle cx="95" cy="35" r="5" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={car.name}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
