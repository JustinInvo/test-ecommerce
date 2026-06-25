import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_PROFILES, CACHE_TAGS } from "@/shared/config/cache";
import { httpServer, httpServerNullable } from "@/shared/api/http.server";
import { endpoints } from "@/shared/api/config";
import { ApiError } from "@/shared/api/errors";
import type { Category, Product } from "../types/product";
import { asCategory } from "../types/product";

/**
 * Server-only data access for products.
 *
 * Transport is delegated to `@/shared/api/http.server` (SRP). This module
 * owns only domain decisions: which cache profile, what tags, how to
 * validate the payload, what counts as "not found".
 *
 * NEXT 16 CACHE COMPONENTS - critical detail
 * -----------------------------------------
 * A throw INSIDE a `'use cache'` function is fatal for prerendering even if
 * the caller wraps it in try/catch. Next treats it as a Server Component
 * render error and aborts the export. The build log will still show the
 * outer catch running, but the build fails anyway with
 * "Export encountered an error on /page". So:
 *
 *   - We catch INSIDE the cached function and return a safe default.
 *   - On failure we DOWNGRADE the cacheLife to ~60s so the empty payload
 *     is not served for hours. Next legitimate request re-hits upstream.
 *   - We expose `getX` wrappers via `cache(...)` only for per-request memo;
 *     they no longer need a try/catch.
 *
 * Resilience policy:
 *   - Build phase: every fetcher degrades to empty so prerender never
 *     fails the deploy. Cache fills on first real request after deploy.
 *   - Runtime, catalog-shaped (`getCategories`, `getAllProducts`): degrade
 *     to empty so home and PLP can render their empty-state UI.
 *   - Runtime, detail-shaped (`getProductById`): degrade to `null`. The
 *     PDP turns `null` into `notFound()` so existing UX is preserved.
 *
 * Every degradation is logged with the full error so observability stays
 * intact (Vercel runtime logs will surface the upstream 403/timeout).
 */

export { ApiError } from "@/shared/api/errors";

/** Short lifetime applied when we cache a degraded payload. */
const FAILURE_CACHE_LIFE = { stale: 10, revalidate: 30, expire: 60 } as const;

const isBuildPhase = (): boolean =>
  process.env.NEXT_PHASE === "phase-production-build";

function logFailure(label: string, err: unknown): void {
  const tag = isBuildPhase() ? "[build]" : "[runtime]";
  // eslint-disable-next-line no-console
  console.warn(
    `${tag} ${label} upstream failed; degrading to empty payload.`,
    err instanceof Error ? err.message : err,
  );
}

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
    throw new ApiError("Malformed product payload", 502, "products");
  }
}

/* -------------------------------- Categories ------------------------------- */

async function _fetchCategories(): Promise<readonly Category[]> {
  "use cache";
  cacheLife(CACHE_PROFILES.categories);
  cacheTag(CACHE_TAGS.categories);

  try {
    const data = await httpServer<unknown>(endpoints.categories());
    if (
      !Array.isArray(data) ||
      data.length === 0 ||
      data.some((v) => typeof v !== "string")
    ) {
      throw new ApiError(
        "Malformed or empty categories payload",
        502,
        endpoints.categories(),
      );
    }
    return (data as string[]).map(asCategory);
  } catch (err) {
    // Downgrade the cache lifetime so this empty payload only sticks for ~60s.
    cacheLife(FAILURE_CACHE_LIFE);
    logFailure("getCategories", err);
    return [];
  }
}

export const getCategories = cache(
  async (): Promise<readonly Category[]> => _fetchCategories(),
);

/* -------------------------------- Products --------------------------------- */

async function _fetchAllProducts(): Promise<readonly Product[]> {
  "use cache";
  cacheLife(CACHE_PROFILES.products);
  cacheTag(CACHE_TAGS.products);

  try {
    const data = await httpServer<unknown>(endpoints.productsList());
    if (!Array.isArray(data) || data.length === 0) {
      throw new ApiError(
        "Malformed or empty products payload",
        502,
        endpoints.productsList(),
      );
    }
    data.forEach(assertProduct);
    return data as Product[];
  } catch (err) {
    cacheLife(FAILURE_CACHE_LIFE);
    logFailure("getAllProducts", err);
    return [];
  }
}

export const getAllProducts = cache(
  async (): Promise<readonly Product[]> => _fetchAllProducts(),
);

async function _fetchProductById(id: number): Promise<Product | null> {
  "use cache";
  cacheLife(CACHE_PROFILES.productDetail);
  cacheTag(CACHE_TAGS.productById(id));

  try {
    const data = await httpServerNullable<unknown>(endpoints.productById(id));
    if (data === null) return null;
    assertProduct(data);
    return data;
  } catch (err) {
    cacheLife(FAILURE_CACHE_LIFE);
    logFailure(`getProductById(${id})`, err);
    // Returning null instead of throwing so prerender never fails. The PDP
    // converts null -> notFound() which renders our custom not-found page.
    return null;
  }
}

export const getProductById = cache(
  async (id: number): Promise<Product | null> => _fetchProductById(id),
);

export const getProductsByCategory = cache(
  async (category: Category): Promise<readonly Product[]> => {
    // Reuses the cached `getAllProducts` (1 upstream call backs N categories).
    const all = await getAllProducts();
    return all.filter((p) => p.category === category);
  },
);
