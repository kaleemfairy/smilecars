import Link from "next/link";
import { Mail, MapPin, Phone, Siren } from "lucide-react";
import { phoneDigits } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { LOCATIONS } from "@/content/locations";
import { Logo } from "./Logo";

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-16 bg-brand-900 pb-28 pt-12 text-white/85">
      <div className="container-page grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo onDark />
          <p className="mt-4 max-w-md text-sm leading-6">
            Self drive car rental in Chennai for over 29 years. Hatchbacks, sedans and SUVs by the day,
            week or month, delivered to your door. All prices include GST.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{settings.address}</span>
            </li>
            {settings.phones.map((p) => (
              <li key={p} className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`tel:+${phoneDigits(p)}`} className="hover:text-white">{p}</a>
              </li>
            ))}
            {settings.emergencyPhone && (
              <li className="flex gap-2">
                <Siren className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden />
                <span>
                  24/7 emergency:{" "}
                  <a href={`tel:+${phoneDigits(settings.emergencyPhone)}`} className="font-semibold text-white hover:underline">{settings.emergencyPhone}</a>
                </span>
              </li>
            )}
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["/book", "Book a car"],
              ["/cars", "Our fleet"],
              ["/monthly-plans", "Monthly plans"],
              ["/my-orders", "My orders"],
              ["/faq", "FAQ"],
              ["/about", "About us"],
              ["/attach-your-vehicle", "Attach your vehicle"],
              ["/blog", "Blog"],
              ["/privacy", "Privacy policy"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Areas we serve</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm md:grid-cols-1">
            {LOCATIONS.slice(0, 10).map((l) => (
              <li key={l.slug}>
                <Link href={`/locations/${l.slug}`} className="hover:text-white">{l.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="container-page mt-10 border-t border-white/15 pt-6 text-xs text-white/60">
        © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
      </p>
    </footer>
  );
}
