import type { Faq, Section } from "@/content/legacy";

/** Renders migrated article content (headings, paragraphs, lists). */
export function Prose({ sections, headingLevel = 2 }: { sections: Section[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const Sub = headingLevel === 2 ? "h3" : "h4";
  return (
    <div className="prose-page">
      {sections.map((s, i) => (
        <section key={i}>
          {s.heading && <H>{s.heading}</H>}
          {s.blocks.map((b, j) =>
            b.type === "ul" ? (
              <ul key={j} className="my-3 space-y-1">
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            ) : b.type === "h3" ? (
              <Sub key={j} className="mt-5 mb-1 font-bold text-ink">{b.text}</Sub>
            ) : (
              <p key={j} className="my-3">{b.text}</p>
            ),
          )}
        </section>
      ))}
    </div>
  );
}

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="space-y-2">
      {items.map((f) => (
        <details key={f.q} className="card p-4">
          <summary className="cursor-pointer font-semibold">{f.q}</summary>
          <p className="mt-2 leading-7 text-slate-700">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
