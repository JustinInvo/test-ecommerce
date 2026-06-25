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
 * Transport is delegated to `@/shared/api/http.server` (SRP). This module owns
 * only domain decisions: which cache profile, what tags, how to validate the
 * payload, what counts as "not found".
 *
 * Composition layers:
 *   `'use cache'`         <- cross-request memoization (Cache Components)
 *    + cacheLife/Tag      <- TTL + targeted invalidation
 *    + React cache()      <- per-request memoization (metadata + page share one fetch)
 *
 * Build-time resilience:
 *   FakeStore sometimes 403s build IPs (CI/CD, Vercel, etc.). We refuse to
 *   let a transient upstream issue break a deploy. During the production
 *   build phase only, failures are logged and the function returns an empty
 *   payload so prerender succeeds. At runtime, errors throw normally and are
 *   caught by `error.tsx` boundaries (so users still see a real error UI
 *   with Retry instead of stale empty data).
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

export const getCategories = cache(async (): Promise<readonly Category[]> => {
  "use cache";
  cacheLife(CACHE_PROFILES.categories);
  cacheTag(CACHE_TAGS.categories);

  try {
    const data = await httpServer<unknown>(endpoints.categories());
    if (!Array.isArray(data) || data.some((v) => typeof v !== "string")) {
      throw new ApiError("Malformed categories payload", 502, endpoints.categories());
    }
    return (data as string[]).map(asCategory);
  } catch (err) {
    if (isBuildPhase()) {
      logBuildFailure("getCategories", err);
      return [];
    }
    throw err;
  }
});

/* -------------------------------- Products --------------------------------- */

export const getAllProducts = cache(async (): Promise<readonly Product[]> => {
  "use cache";
  cacheLife(CACHE_PROFILES.products);
  cacheTag(CACHE_TAGS.products);

  try {
    const data = await httpServer<unknown>(endpoints.productsList());
    if (!Array.isArray(data)) {
      throw new ApiError("Malformed products payload", 502, endpoints.productsList());
    }
    data.forEach(assertProduct);
    return data as Product[];
  } catch (err) {
    if (isBuildPhase()) {
      logBuildFailure("getAllProducts", err);
      return [];
    }
    throw err;
  }
});

export const getProductById = cache(
  async (id: number): Promise<Product | null> => {
    "use cache";
    cacheLife(CACHE_PROFILES.productDetail);
    cacheTag(CACHE_TAGS.productById(id));

    try {
      const data = await httpServerNullable<unknown>(endpoints.productById(id));
      if (data === null) return null;
      assertProduct(data);
      return data;
    } catch (err) {
      if (isBuildPhase()) {
        logBuildFailure(`getProductById(${id})`, err);
        return null;
      }
      throw err;
    }
  },
);

export const getProductsByCategory = cache(
  async (category: Category): Promise<readonly Product[]> => {
    "use cache";
    cacheLife(CACHE_PROFILES.products);
    cacheTag(CACHE_TAGS.productsByCategory(category));

    const all = await getAllProducts();
    return all.filter((p) => p.category === category);
  },
);
