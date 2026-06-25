"use client";

import { httpClient } from "@/shared/api/http.client";
import { endpoints } from "@/shared/api/config";
import { asCategory } from "../types/product";
import type { Product } from "../types/product";

/**
 * Client-side product service. Mirrors the server API surface so consumers
 * can swap them at the boundary (Dependency Inversion: features depend on
 * the *shape* of the data, not on which side fetched it).
 *
 * `signal` is forwarded so callers can cancel on unmount.
 */

function assertProduct(value: unknown): asserts value is Product {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as Product).id !== "number"
  ) {
    throw new Error("Malformed product");
  }
}

export async function fetchAllProductsClient(
  signal?: AbortSignal,
): Promise<Product[]> {
  const data = await httpClient<unknown>(endpoints.productsList(), { signal });
  if (!Array.isArray(data)) throw new Error("Malformed products payload");
  data.forEach(assertProduct);
  return data as Product[];
}

export async function fetchCategoriesClient(
  signal?: AbortSignal,
): Promise<string[]> {
  const data = await httpClient<unknown>(endpoints.categories(), { signal });
  if (!Array.isArray(data) || data.some((v) => typeof v !== "string")) {
    throw new Error("Malformed categories payload");
  }
  return (data as string[]).map((c) => String(asCategory(c)));
}
