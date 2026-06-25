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

/**
 * Cache tag namespace.
 *
 * Tags are versioned (`:v2`) so the next deploy after a cache-bug fix starts
 * with a CLEAN cache - otherwise the new build inherits any empty payload
 * that an older broken build cached for hours.
 *
 * Bump the suffix any time the shape of a cached payload changes, or to
 * force-purge a polluted cache without waiting for `expire` to elapse.
 */
export const CACHE_TAGS = {
  products: "products:v2",
  productById: (id: number | string) => `product:v2:${id}`,
  productsByCategory: (cat: string) => `products:v2:${cat.toLowerCase()}`,
  categories: "categories:v2",
} as const;
