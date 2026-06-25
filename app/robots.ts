import type { MetadataRoute } from "next";
import { site } from "@/shared/config/site";

/**
 * Robots configuration. Allows indexing of catalog + PDPs. Disallows the
 * user-private cart route (which is also marked noindex via metadata).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/cart"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
