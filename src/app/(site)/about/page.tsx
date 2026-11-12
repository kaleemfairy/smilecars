import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/data";
import { phoneDigits } from "@/lib/format";

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
        <h2>What you need to rent</h2>
        <ul>
          <li>A valid driving licence</li>
          <li>Aadhaar card</li>
          <li>Employee ID or business proof</li>
        </ul>
      </div>

      <section id="contact" className="card mt-8 scroll-mt-20 p-5">
        <h2 className="text-lg font-bold">Contact us</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-brand-600" aria-hidden />{s.address}</li>
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
