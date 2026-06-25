/**
 * API configuration - single source of truth for endpoints.
 *
 * Versioning pattern: keys are version ids, values are base URLs. This lets
 * the codebase support multiple API versions in parallel during a migration
 * (e.g. a `v2` rollout) without leaking version strings into every fetcher.
 *
 * FakeStore does NOT version its API, but we still:
 *  - keep a `version` field, so a future migration is a one-line change;
 *  - keep the base URL behind an env (NEXT_PUBLIC_API_BASE_URL) so deployments
 *    can point at a staging mirror or proxy without code changes.
 *
 * The public surface stays small (resolve, endpoints, withVersion) to follow
 * Interface Segregation: callers see only what they need.
 */

export type ApiVersion = "v1";

export const API_VERSIONS: Readonly<Record<ApiVersion, string>> = {
  v1:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "https://fakestoreapi.com",
};

export const DEFAULT_API_VERSION: ApiVersion = "v1";

/** Resolve a path against a version's base URL. */
export function resolve(path: string, version: ApiVersion = DEFAULT_API_VERSION): string {
  const base = API_VERSIONS[version];
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/**
 * Endpoint catalog. Single source of truth - all callers pass through here so
 * a path rename never spreads across the codebase.
 */
export const endpoints = {
  productsList: () => resolve("/products"),
  productById: (id: number) => resolve(`/products/${id}`),
  categories: () => resolve("/products/categories"),
} as const;
