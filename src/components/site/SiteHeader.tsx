import Link from "next/link";
import { ArrowUpRight, Menu, Phone } from "lucide-react";
import { phoneDigits } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { Logo } from "./Logo";

export const NAV = [
  { href: "/cars", label: "Our Fleet" },
  { href: "/monthly-plans", label: "Monthly Plans" },
  { href: "/my-orders", label: "My Orders" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ settings }: { settings: Settings }) {
  const phone = settings.phones[0];
  const support = settings.emergencyPhone || phone;
  return (
    <>
      {/* Top line: tagline + 24/7 number */}
      <div className="bg-forest-top text-[11px] text-[#d8eee7]">
        <div className="container-page flex h-[34px] items-center justify-between gap-3">
          <span className="truncate">Chennai&rsquo;s trusted self drive cars, for over 29 years</span>
          {support && (
            <a href={`tel:+${phoneDigits(support)}`} className="shrink-0 hover:text-white">
              <span className="hidden sm:inline">24/7 support </span>
              <b className="ml-1 font-semibold text-white">{support}</b>
            </a>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#eef2f0] bg-white/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[82px]">
          <Link href="/" aria-label="Smile Cars home" className="shrink-0">
            <Logo className="h-10 w-auto lg:h-12" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="py-2 text-[13px] font-semibold text-[#45515a] transition-colors hover:text-brand-700"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {phone && (
              <a
                href={`tel:+${phoneDigits(phone)}`}
                className="hidden min-h-11 items-center gap-1.5 px-3 text-[13px] font-bold text-brand-700 hover:text-brand-800 sm:inline-flex"
                aria-label={`Call ${phone}`}
              >
                <Phone className="size-4" aria-hidden />
                Call
              </a>
            )}
            <Link href="/book" className="btn btn-primary min-h-11 gap-2 px-4 text-[13px] sm:min-h-12 sm:px-5">
              Book now
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            {/* details/summary keeps the phone menu working without JavaScript */}
            <details className="group lg:hidden">
              <summary
                className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg text-ink hover:bg-tint [&::-webkit-details-marker]:hidden"
                aria-label="Menu"
              >
                <Menu className="size-6" aria-hidden />
              </summary>
              <nav
                aria-label="Mobile"
                className="absolute inset-x-0 top-full border-t border-[#eff3f1] bg-white px-4 pb-4 shadow-[0_12px_20px_rgb(24_37_29/0.09)]"
              >
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="block border-b border-[#eff3f1] px-1 py-3.5 text-[15px] font-semibold">
                    {n.label}
                  </Link>
                ))}
                <Link href="/attach-your-vehicle" className="block border-b border-[#eff3f1] px-1 py-3.5 text-[15px] font-semibold">
                  Attach your car
                </Link>
                {phone && (
                  <a href={`tel:+${phoneDigits(phone)}`} className="flex items-center gap-2 px-1 py-3.5 text-[15px] font-bold text-brand-700">
                    <Phone className="size-4" aria-hidden /> Call {phone}
                  </a>
                )}
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
