import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/data";
import Link from "next/link";
import { phoneDigits } from "@/lib/format";
import { Testimonials, TrustStrip } from "@/components/content/Trust";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About us",
  description: "Smile Cars® has offered self drive car rental in Chennai for over 29 years, from our base in Anna Nagar West.",
};

export default async function AboutPage() {
  const s = await getPublicSettings();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: s.businessName,
    address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: "Chennai", addressRegion: "Tamil Nadu", addressCountry: "IN" },
    ...(s.branchAddresses.length
      ? {
          department: s.branchAddresses.map((a) => ({
            "@type": "AutoRental",
            name: `${s.businessName} branch`,
            address: { "@type": "PostalAddress", streetAddress: a, addressLocality: "Chennai", addressRegion: "Tamil Nadu", addressCountry: "IN" },
          })),
        }
      : {}),
    telephone: s.phones[0],
    email: s.email,
    url: process.env.NEXT_PUBLIC_SITE_URL,
  };
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-3xl font-extrabold">About Smile Cars®</h1>
      <div className="prose-page mt-4">
        <p>
          Smile Cars® has been renting self drive cars in Chennai for over 29 years. From our base in Anna Nagar West we
          deliver well-maintained hatchbacks, sedans and SUVs across the city, for a day, a week or a month.
        </p>
        <p>
          We keep things simple: clear prices with GST included, a real person who calls you to confirm every booking,
          and a team you can reach throughout your trip.
        </p>

        <h2>Why Smile Cars®</h2>
        <ul>
          <li><strong>Logo-free cars.</strong> No rental branding, so you drive privately, as if it were your own car.</li>
          <li><strong>Doorstep delivery and pickup</strong> anywhere in Chennai: home, office, hotel, railway station or airport. Step out of the airport and start driving.</li>
          <li><strong>Checked before every trip.</strong> Our technical team inspects and cleans each car before handover.</li>
          <li><strong>24/7 support.</strong> Our team is available round the clock for bookings and help during your trip, and arranges a replacement car if needed.</li>
          <li><strong>Daily, weekly, monthly and yearly plans</strong>, with special pricing for long-term rentals.</li>
        </ul>

        <h2>Other services</h2>
        <ul>
          <li><strong>Driver on request.</strong> For long drives, a professional driver can take the wheel and help with luggage.</li>
          <li><strong>Wedding and event cars.</strong> Premium cars with a chauffeur for weddings and special occasions.</li>
          <li><strong>Corporate rentals.</strong> Packages for companies and long-term vehicle management. We are an official transport partner for SriLankan Airlines, Kuwait Airways and Emirates.</li>
          <li><strong>Attach your car.</strong> Car owners can <Link href="/attach-your-vehicle" className="font-semibold text-brand-700 underline">earn from their vehicle</Link> with us.</li>
        </ul>
        <p>For a driver, wedding car or corporate quote, call or WhatsApp us using the buttons on this page.</p>

        <h2>What you need to rent</h2>
        <ul>
          <li>A valid driving licence (held for 3+ years; minimum age 24, or 27 for premium cars and big SUVs)</li>
          <li>Aadhaar card</li>
          <li>Employee ID or business proof</li>
          <li>NRI and foreign customers: passport, international ID and an international driving licence valid in India</li>
        </ul>
      </div>

      <div className="mt-8">
        <TrustStrip />
      </div>
      <section id="reviews" className="mt-10 scroll-mt-20">
        <h2 className="mb-4 text-xl font-extrabold">What our customers say</h2>
        <Testimonials />
      </section>

      <section id="contact" className="card mt-8 scroll-mt-20 p-5">
        <h2 className="text-lg font-bold">Contact us</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-brand-600" aria-hidden /><span><strong className="block">Main office</strong>{s.address}</span></li>
          {s.branchAddresses.map((a) => (
            <li key={a} className="flex gap-3"><MapPin className="size-5 shrink-0 text-brand-600" aria-hidden /><span><strong className="block">Branch</strong>{a}</span></li>
          ))}
          {s.phones.map((p) => (
            <li key={p} className="flex gap-3"><Phone className="size-5 shrink-0 text-brand-600" aria-hidden /><a href={`tel:+${phoneDigits(p)}`} className="font-semibold hover:underline">{p}</a></li>
          ))}
          <li className="flex gap-3"><Mail className="size-5 shrink-0 text-brand-600" aria-hidden /><a href={`mailto:${s.email}`} className="font-semibold hover:underline">{s.email}</a></li>
        </ul>
        <iframe
          title="Smile Cars location on Google Maps"
          src={`https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`}
          loading="lazy"
          className="mt-4 h-64 w-full rounded-xl border-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
