import Link from "next/link";
import { phoneDigits } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { PARTNERS_LINE } from "@/content/testimonials";
import { Logo } from "./Logo";

const LINKS: [string, string][] = [
  ["/book", "Book a car"],
  ["/cars", "Our fleet"],
  ["/monthly-plans", "Monthly plans"],
  ["/my-orders", "My orders"],
  ["/faq", "FAQs"],
  ["/about", "About Smile Cars"],
  ["/attach-your-vehicle", "Attach your vehicle"],
  ["/blog", "Blog"],
  ["/privacy", "Privacy policy"],
];

export function SiteFooter({ settings }: { settings: Settings }) {
  const offices = [
    { title: /anna nagar/i.test(settings.address) ? "Anna Nagar West (main office)" : "Main office", address: settings.address },
    ...settings.branchAddresses.map((a) => ({
      title: /choolaimedu/i.test(a) ? "Choolaimedu (branch)" : "Branch",
      address: a,
    })),
  ].filter((o) => o.address);

  return (
    <footer className="bg-forest-deep pb-20 pt-12 text-[#dce8e3]">
      <div className="container-page grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.5fr_1fr_0.8fr] lg:gap-11">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo onDark className="h-9 w-auto" />
          <p className="mt-5 max-w-xs text-[13px] leading-6 text-[#9bb0a8]">
            Self drive car rental in Chennai for over 29 years, delivered to your door. Here for your next drive, 24/7.
          </p>
        </div>

        <div>
          <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.13em] text-[#7fbaaa]">Come find us</h2>
          <ul className="mt-4 space-y-4 text-[13px] leading-6 text-[#c1d0ca]">
            {offices.map((o) => (
              <li key={o.address}>
                <b className="block font-semibold text-white">{o.title}</b>
                {o.address}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.13em] text-[#7fbaaa]">Say hello</h2>
          <ul className="mt-4 space-y-1 text-[13px] text-[#c1d0ca]">
            {settings.phones.map((p) => (
              <li key={p}>
                <a href={`tel:+${phoneDigits(p)}`} className="inline-flex min-h-8 items-center hover:text-white">{p}</a>
              </li>
            ))}
            <li>
              <a href={`mailto:${settings.email}`} className="inline-flex min-h-8 items-center hover:text-white">{settings.email}</a>
            </li>
            {settings.emergencyPhone && (
              <li className="pt-2 text-xs text-[#8ca49b]">
                24/7 emergency ·{" "}
                <a href={`tel:+${phoneDigits(settings.emergencyPhone)}`} className="font-semibold text-white hover:underline">
                  {settings.emergencyPhone}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.13em] text-[#7fbaaa]">Good to explore</h2>
          <ul className="mt-4 space-y-1 text-[13px] text-[#c1d0ca]">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-8 items-center hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-page mt-10">
        <div className="flex flex-col gap-2 border-t border-[#344a45] py-4 text-[11px] text-[#8fa49b] md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</span>
          <span>{PARTNERS_LINE}</span>
          <span>Made with a smile in Chennai</span>
        </div>
      </div>
    </footer>
  );
}
