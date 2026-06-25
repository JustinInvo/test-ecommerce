import type { MetadataRoute } from "next";
import { getAllProducts } from "@/features/products/api/products.api";
import { site } from "@/shared/config/site";

/**
 * Dynamic sitemap. Includes:
 *   - home, catalog
 *   - one entry per product
 *
 * Wrapped in try/catch so a transient upstream failure during build doesn't
 * produce an empty/broken sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: `${site.url}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site.url}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const products = await getAllProducts();
    const productEntries = products.map<MetadataRoute.Sitemap[number]>((p) => ({
      url: `${site.url}/products/${p.id}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...base, ...productEntries];
  } catch {
    return base;
  }
}
