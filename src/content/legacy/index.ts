// Content migrated from the old smilecars.net (area pages and blog posts), converted to
// structured blocks by a one-off script. Edit the JSON files to change the text.
import areasJson from "./areas.json";
import blogJson from "./blog.json";

export type Block = { type: "p" | "h3"; text: string } | { type: "ul"; items: string[] };
export interface Section {
  heading: string | null;
  blocks: Block[];
}
export interface Faq {
  q: string;
  a: string;
}
export interface AreaContent {
  title: string;
  sections: Section[];
  faq: Faq[];
}
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  sections: Section[];
  faq: Faq[];
}

export const AREA_CONTENT = areasJson as Record<string, AreaContent>;
export const BLOG_POSTS = (blogJson as BlogPost[]).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
