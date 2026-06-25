/**
 * Single source of truth for brand + URL configuration.
 *
 * Centralising this prevents string drift across `<head>`, OG tags, sitemap,
 * footer and analytics.
 */
export const site = {
  name: "FakeStore",
  shortName: "FakeStore",
  description:
    "Discover quality products across electronics, fashion and jewelry, curated by FakeStore.",
  // Override at deploy time via NEXT_PUBLIC_SITE_URL.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://fakestore.example.com",
  locale: "en_US",
  twitter: "@fakestore",
} as const;

export type SiteConfig = typeof site;
