import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/content/legacy";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips and guides on self drive car rental in Chennai from Smile Cars®.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-3xl font-extrabold">Smile Cars® blog</h1>
      <p className="mt-2 text-muted">Guides and tips for self drive car rental in Chennai.</p>
      <ul className="mt-6 space-y-4">
        {BLOG_POSTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="card block p-5 transition-colors hover:bg-brand-50">
              {p.date && <p className="text-xs font-semibold uppercase text-muted">{fmtDate(Date.parse(`${p.date}T12:00:00+05:30`))}</p>}
              <h2 className="mt-1 text-lg font-bold text-brand-700">{p.title}</h2>
              <p className="mt-2 text-sm text-slate-700">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
