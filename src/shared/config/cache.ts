/**
 * Cache policy constants.
 *
 * Why centralize:
 *  - The cache profile is a product decision (how stale is acceptable?). It
 *    must live next to other product-config knobs, not buried in fetchers.
 *  - Documented justification travels with the value.
 *
 * Why these profiles:
 *  - Products: light churn (price/inventory) but tolerate ~5 min lag for SEO
 *    and TTFB wins. Cap at 1h so the cache cannot serve genuinely stale data.
 *  - Categories: virtually immutable. 1h revalidate, 6h hard expire.
 *  - Product detail: same churn profile as products; long stale window to
 *    survive traffic spikes (stale-while-revalidate behavior).
 */

export const CACHE_PROFILES = {
  products: { stale: 60, revalidate: 300, expire: 3600 },
  productDetail: { stale: 60, revalidate: 300, expire: 3600 },
  categories: { stale: 300, revalidate: 3600, expire: 21600 },
} as const;

export const CACHE_TAGS = {
  products: "products",
  productById: (id: number | string) => `product:${id}`,
  productsByCategory: (cat: string) => `products:${cat.toLowerCase()}`,
  categories: "categories",
} as const;
