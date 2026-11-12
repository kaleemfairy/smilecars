import type { NextConfig } from "next";

// Old smilecars.net area pages, kept as 301 redirects so search rankings carry over.
const oldAreaPages = [
  "adyar",
  "ambattur",
  "anna-nagar",
  "arumbakkam",
  "ecr",
  "guindy",
  "koyambedu",
  "mogappair",
  "nungambakkam",
  "omr",
  "porur",
  "t-nagar",
  "tambaram",
  "thiruvanmiyur",
  "vadapalani",
  "velachery",
];

const oldPages: Record<string, string> = {
  "/index.html": "/",
  "/home.html": "/",
  "/about.html": "/about",
  "/why-smile-cars.html": "/about",
  "/contact.html": "/about#contact",
  "/faq-terms.html": "/faq",
  "/privacy.html": "/privacy",
  "/car-listing.html": "/cars",
  "/services.html": "/cars",
  "/booking.html": "/book",
  "/bookcar.html": "/book",
  "/thank-you.html": "/",
  "/covid-19.html": "/",
  "/blog.html": "/blog",
};

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: pages read live availability from Firestore,
  // and shared data (cars, hubs, settings) is cached with unstable_cache + tags.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Car photos are resized in the browser before upload, so 4 MB is plenty.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      ...oldAreaPages.map((slug) => ({
        source: `/self-drive-cars-${slug}-chennai.html`,
        destination: `/locations/${slug}`,
        permanent: true,
      })),
      ...Object.entries(oldPages).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      // Old blog posts keep their slugs, minus ".html".
      { source: "/blog/:slug.html", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
