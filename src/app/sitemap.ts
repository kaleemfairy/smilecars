import type { MetadataRoute } from "next";
import { getActiveCars } from "@/lib/data";
import { safe } from "@/lib/safe";
import { LOCATIONS } from "@/content/locations";
import { BLOG_POSTS } from "@/content/legacy";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const cars = await safe(getActiveCars, [], "cars");
  const pages = ["", "/book", "/cars", "/monthly-plans", "/faq", "/about", "/attach-your-vehicle", "/privacy", "/blog"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...cars.map((c) => ({ url: `${base}/cars/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...LOCATIONS.map((l) => ({ url: `${base}/locations/${l.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...BLOG_POSTS.map((p) => ({ url: `${base}/blog/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
