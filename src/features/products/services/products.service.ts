import type {
  Category,
  Product,
  ProductFilters,
  SortOrder,
} from "../types/product";
import { SORT_OPTIONS } from "../types/product";
import { asCategory } from "../types/product";

/**
 * Pure business policies for the catalog.
 *
 * Why a separate "service" layer:
 *  - These are decisions about the *product domain* (what does "search" mean?
 *    case-sensitive? title-only?). They must be expressible without React,
 *    without Next, without the DOM.
 *  - 100% unit testable. No mocking required.
 *  - Same code runs in RSC (server filtering) and in tests.
 *
 *  The functions are exported individually AND composed via `applyFilters` so
 *  consumers can reuse pieces (e.g., search in a typeahead) without paying
 *  the cost of irrelevant work.
 */

/* ---------------------------- URL <-> filters ---------------------------- */

/**
 * Parse a `URLSearchParams`-like into a strongly typed, validated
 * `ProductFilters`. Invalid values are dropped (no throwing — URLs are user
 * input and we degrade gracefully).
 */
export function parseFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): ProductFilters {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const v = params[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  const rawSort = get("sort");
  const sort: SortOrder | null = SORT_OPTIONS.includes(rawSort as SortOrder)
    ? (rawSort as SortOrder)
    : null;

  const search = (get("search") ?? "").trim().slice(0, 80);

  const rawCategory = get("category");
  const category: Category | null =
    rawCategory && rawCategory.length > 0 && rawCategory.length < 60
      ? asCategory(rawCategory)
      : null;

  return { category, search, sort };
}

/**
 * Serialize filters back into a `URLSearchParams` string. Sorted keys produce
 * stable URLs (good for canonicals and cache keys).
 */
export function serializeFilters(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", String(filters.category));
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  // Stable order:
  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return new URLSearchParams(entries).toString();
}

/* --------------------------- Filtering ---------------------------------- */

export function filterByCategory(
  products: readonly Product[],
  category: Category | null,
): readonly Product[] {
  if (!category) return products;
  return products.filter((p) => p.category === category);
}

/**
 * Search across title + description. Case-insensitive, accent-folded.
 * Short-circuits empty query for O(1) cost.
 */
export function searchProducts(
  products: readonly Product[],
  query: string,
): readonly Product[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return products;
  return products.filter((p) => {
    const haystack = `${p.title} ${p.description}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function sortByPrice(
  products: readonly Product[],
  order: SortOrder | null,
): readonly Product[] {
  if (!order) return products;
  // Copy to keep the input readonly and stable.
  const copy = [...products];
  copy.sort((a, b) => (order === "asc" ? a.price - b.price : b.price - a.price));
  return copy;
}

/**
 * Apply the full pipeline. Order matters: filter (cheap) → search (cheap) →
 * sort (allocates only once).
 */
export function applyFilters(
  products: readonly Product[],
  filters: ProductFilters,
): readonly Product[] {
  return sortByPrice(
    searchProducts(filterByCategory(products, filters.category), filters.search),
    filters.sort,
  );
}
