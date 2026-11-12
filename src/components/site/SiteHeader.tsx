import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { phoneDigits } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { Logo } from "./Logo";

export const NAV = [
  { href: "/cars", label: "Our Fleet" },
  { href: "/monthly-plans", label: "Monthly Plans" },
  { href: "/my-orders", label: "My Orders" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/attach-your-vehicle", label: "Attach Your Car" },
];

export function SiteHeader({ settings }: { settings: Settings }) {
  const phone = settings.phones[0];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label="Smile Cars home" className="shrink-0">
          <Logo className="h-10 w-auto sm:h-11" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-50 hover:text-brand-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {phone && (
            <a
              href={`tel:+${phoneDigits(phone)}`}
              className="btn btn-sm btn-secondary"
              aria-label={`Call ${phone}`}
            >
              <Phone className="size-4" aria-hidden />
              <span className="hidden sm:inline">{phone}</span>
              <span className="sm:hidden">Call</span>
            </a>
          )}
          <Link href="/book" className="btn btn-sm btn-primary hidden sm:inline-flex">
            Book now
          </Link>
          {/* details/summary keeps the phone menu working without JavaScript */}
          <details className="group relative lg:hidden">
            <summary
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-white [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5" aria-hidden />
            </summary>
            <nav
              aria-label="Mobile"
              className="card absolute right-0 top-13 w-60 p-2"
            >
              <Link href="/book" className="block rounded-lg px-3 py-3 font-semibold text-brand-700 hover:bg-brand-50">
                Book a car
              </Link>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 font-medium hover:bg-brand-50">
                  {n.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
