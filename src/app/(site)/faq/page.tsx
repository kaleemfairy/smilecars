import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/data";
import { getFaq } from "@/content/faq";
import { PageHeader } from "@/components/site/PageHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about booking, documents, payment, km limits and delivery for Smile Cars self drive rentals in Chennai.",
};

export default async function FaqPage() {
  const settings = await getPublicSettings();
  const faq = getFaq(settings);
  const categories = [...new Set(faq.map((f) => f.category))];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
    <PageHeader
      narrow
      eyebrow="A few good answers"
      title={<>Good to <em className="not-italic text-brand-500">know.</em></>}
      lead="Booking, documents, payment, kilometres and delivery: everything about renting a self drive car with Smile Cars."
    />
    <div className="container-page max-w-3xl pb-14 pt-4">
      {categories.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="text-lg font-bold text-brand-700">{cat}</h2>
          <div className="mt-3 space-y-2">
            {faq.filter((f) => f.category === cat).map((f) => (
              <details key={f.q} className="card group p-4">
                <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {f.q}
                    <span aria-hidden className="text-brand-700 transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
    </>
  );
}
