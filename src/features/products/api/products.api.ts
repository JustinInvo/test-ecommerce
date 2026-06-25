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
 * IMPORTANT - two-layer composition:
 *
 *   _fetchX  -> `'use cache'`-wrapped fetcher. THROWS on any upstream
 *               failure so Cache Components never stores an empty/failed
 *               result. This was the production bug we had: a single
 *               transient 403 during build was cached for 6h and served
 *               as if it were real data.
 *
 *   getX     -> React `cache()` outer wrapper. Per-request memoization +
 *               try/catch that degrades to a safe default at the page-render
 *               boundary - never inside the cross-request cache.
 *
 * Resilience policy:
 *   - Build phase: every fetcher degrades to empty so prerender never
 *     fails the deploy. Cache fills on first real request.
 *   - Runtime, catalog-shaped (`getCategories`, `getAllProducts`): degrade
 *     to empty so home and PLP can render their empty states.
 *   - Runtime, detail-shaped (`getProductById`): keep throwing - a missing
 *     product IS the signal that drives `notFound()` and PDP error.tsx.
 *
 * Every degradation is logged with full stack so observability stays intact.
 */

export { ApiError } from "@/shared/api/errors";

const isBuildPhase = (): boolean =>
  process.env.NEXT_PHASE === "phase-production-build";

function logBuildFailure(label: string, err: unknown): void {
  // eslint-disable-next-line no-console
  console.warn(
    `[build] ${label} upstream failed; degrading to empty payload for prerender.`,
    err instanceof Error ? err.message : err,
  );
}

function logRuntimeFailure(label: string, err: unknown): void {
  // eslint-disable-next-line no-console
  console.error(
    `[runtime] ${label} upstream failed; degrading to empty payload.`,
    err instanceof Error ? { message: err.message, stack: err.stack } : err,
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

  const data = await httpServer<unknown>(endpoints.categories());
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    data.some((v) => typeof v !== "string")
  ) {
    // Treat empty / malformed as failure so the cache stays clean.
    throw new ApiError(
      "Malformed or empty categories payload",
      502,
      endpoints.categories(),
    );
  }
  return (data as string[]).map(asCategory);
}

export const getCategories = cache(async (): Promise<readonly Category[]> => {
  try {
    return await _fetchCategories();
  } catch (err) {
    if (isBuildPhase()) {
      logBuildFailure("getCategories", err);
    } else {
      logRuntimeFailure("getCategories", err);
    }
    return [];
  }
});

/* -------------------------------- Products --------------------------------- */

async function _fetchAllProducts(): Promise<readonly Product[]> {
  "use cache";
  cacheLife(CACHE_PROFILES.products);
  cacheTag(CACHE_TAGS.products);

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
}

export const getAllProducts = cache(async (): Promise<readonly Product[]> => {
  try {
    return await _fetchAllProducts();
  } catch (err) {
    if (isBuildPhase()) {
      logBuildFailure("getAllProducts", err);
    } else {
      logRuntimeFailure("getAllProducts", err);
    }
    return [];
  }
});

async function _fetchProductById(id: number): Promise<Product | null> {
  "use cache";
  cacheLife(CACHE_PROFILES.productDetail);
  cacheTag(CACHE_TAGS.productById(id));

  const data = await httpServerNullable<unknown>(endpoints.productById(id));
  if (data === null) return null;
  assertProduct(data);
  return data;
}

export const getProductById = cache(
  async (id: number): Promise<Product | null> => {
    try {
      return await _fetchProductById(id);
    } catch (err) {
      if (isBuildPhase()) {
        logBuildFailure(`getProductById(${id})`, err);
        return null;
      }
      // PDP keeps strict semantics: rethrow so `notFound()` / error.tsx can
      // do their job. Empty/null product is a different signal than failure.
      throw err;
    }
  },
);

export const getProductsByCategory = cache(
  async (category: Category): Promise<readonly Product[]> => {
    // Reuses the cached `getAllProducts` (1 upstream call backs N categories).
    const all = await getAllProducts();
    return all.filter((p) => p.category === category);
  },
);
