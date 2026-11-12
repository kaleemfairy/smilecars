import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/content/legacy";
import { FaqList, faqJsonLd, JsonLd, Prose } from "@/components/content/Prose";
import { fmtDate } from "@/lib/format";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getBlogPost((await props.params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const post = getBlogPost((await props.params).slug);
  if (!post) notFound();
  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug);
  return (
    <article className="container-page max-w-3xl py-8">
      <Link href="/blog" className="text-sm font-semibold text-brand-700 hover:underline">← All posts</Link>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight">{post.title}</h1>
      {post.date && <p className="mt-2 text-sm text-muted">{fmtDate(Date.parse(`${post.date}T12:00:00+05:30`))}</p>}
      <div className="mt-4">
        <Prose sections={post.sections} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 rounded-2xl bg-brand-50 p-5">
        <p className="w-full font-bold">Ready to drive?</p>
        <Link href="/book" className="btn btn-primary">Check available cars</Link>
        <Link href="/cars" className="btn btn-secondary">Browse the fleet</Link>
      </div>

      {post.faq.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">FAQs</h2>
          <FaqList items={post.faq} />
          <JsonLd data={faqJsonLd(post.faq)} />
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">More from the blog</h2>
          <ul className="space-y-2">
            {others.map((p) => (
              <li key={p.slug}><Link href={`/blog/${p.slug}`} className="font-semibold text-brand-700 hover:underline">{p.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          ...(post.date ? { datePublished: post.date } : {}),
          author: { "@type": "Organization", name: "Smile Cars®" },
          publisher: { "@type": "Organization", name: "Smile Cars®" },
        }}
      />
    </article>
  );
}
