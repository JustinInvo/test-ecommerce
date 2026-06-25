import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_PROFILES, CACHE_TAGS } from "@/shared/config/cache";
import type { Category, Product } from "../types/product";
import { asCategory } from "../types/product";

/**
 * Server-only data access for the FakeStore API.
 *
 * Design notes:
 *
 *  - `import "server-only"` guarantees these symbols can never leak into a
 *    client bundle (the build fails if they do). This is critical so the
 *    `use cache` machinery and any future credentials stay server-side.
 *
 *  - We use Next 16's `'use cache'` directive (Cache Components) with
 *    `cacheLife` + `cacheTag` instead of the legacy `fetch(..., { next: { revalidate }})`.
 *    The directive caches the *function result*, which means filtering and
 *    transformation done after the fetch are also cached, not recomputed.
 *
 *  - React's `cache()` wraps detail/list reads so multiple callsites within a
 *    single render (e.g., `generateMetadata` + the page) share one request.
 *    This dedupes work *per request*; `use cache` dedupes work *across
 *    requests*. Both are needed.
 *
 *  - We deliberately fetch the entire `/products` list once and let the
 *    Service layer derive filtered views in pure functions. FakeStore does not
 *    support combined search + category + sort, and round-tripping per filter
 *    permutation would torpedo cache hit rate.
 *
 *  - All network errors are normalized to `ApiError` so route boundaries can
 *    decide between `notFound()` and `throw` deterministically.
 */

const BASE_URL = "https://fakestoreapi.com";

export class ApiError extends Error {
  public override readonly name = "ApiError";
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
  }
}

async function safeFetch(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      // We rely on `'use cache'` (Cache Components), so disable the default
      // per-request memo here to avoid double-caching surprises.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new ApiError(
      `Network error fetching ${url}: ${(err as Error).message}`,
      0,
      url,
    );
  }
  if (!res.ok) {
    throw new ApiError(
      `Upstream ${res.status} for ${url}`,
      res.status,
      url,
    );
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

/**
 * List of all categories. Cached for ~1h; categories are effectively static.
 */
export const getCategories = cache(async (): Promise<readonly Category[]> => {
  "use cache";
  cacheLife(CACHE_PROFILES.categories);
  cacheTag(CACHE_TAGS.categories);

  const res = await safeFetch(`${BASE_URL}/products/categories`);
  const data = (await res.json()) as unknown;

  if (!Array.isArray(data) || data.some((v) => typeof v !== "string")) {
    throw new ApiError("Malformed categories payload", 502, `${BASE_URL}/products/categories`);
  }
  return (data as string[]).map(asCategory);
});

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

function assertProduct(value: unknown): asserts value is Product {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as Product).id !== "number" ||
    typeof (value as Product).title !== "string" ||
    typeof (value as Product).price !== "number" ||
    typeof (value as Product).image !== "string" ||
    typeof (value as Product).category !== "string"
  ) {
    throw new ApiError("Malformed product payload", 502, BASE_URL);
  }
}

/**
 * The full product catalog. Cached snapshot used to derive any filter view.
 */
export const getAllProducts = cache(async (): Promise<readonly Product[]> => {
  "use cache";
  cacheLife(CACHE_PROFILES.products);
  cacheTag(CACHE_TAGS.products);

  const res = await safeFetch(`${BASE_URL}/products`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new ApiError("Malformed products payload", 502, `${BASE_URL}/products`);
  }
  data.forEach(assertProduct);
  return data as Product[];
});

/**
 * Single product detail. Cached by id so popular PDPs avoid hitting upstream.
 */
export const getProductById = cache(
  async (id: number): Promise<Product | null> => {
    "use cache";
    cacheLife(CACHE_PROFILES.productDetail);
    cacheTag(CACHE_TAGS.productById(id));

    // FakeStore returns 200 with empty body for unknown IDs; guard against it.
    let res: Response;
    try {
      res = await safeFetch(`${BASE_URL}/products/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
    const text = await res.text();
    if (!text || text === "null") return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ApiError("Malformed product payload", 502, `${BASE_URL}/products/${id}`);
    }
    if (parsed === null) return null;
    assertProduct(parsed);
    return parsed;
  },
);

/**
 * Products restricted to a category. Convenience wrapper that re-uses the
 * cached full catalog snapshot so we get one upstream hit per 5-minute window
 * regardless of how many categories users browse.
 */
export const getProductsByCategory = cache(
  async (category: Category): Promise<readonly Product[]> => {
    "use cache";
    cacheLife(CACHE_PROFILES.products);
    cacheTag(CACHE_TAGS.productsByCategory(category));

    const all = await getAllProducts();
    return all.filter((p) => p.category === category);
  },
);
