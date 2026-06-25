"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import {
  parseFilters,
  serializeFilters,
} from "../services/products.service";
import type { ProductFilters, SortOrder, Category } from "../types/product";
import { asCategory } from "../types/product";

/**
 * `useProductFilters` — the single source of truth for filter state.
 *
 * Responsibilities:
 *   - Read the current `URLSearchParams` and project them to a typed
 *     `ProductFilters` value.
 *   - Provide imperative setters that update the URL via `router.replace`
 *     using `{ scroll: false }` so the user stays in place.
 *   - Maintain a `useTransition` so URL updates feel non-blocking.
 *
 * Why a custom hook? PLP, filter UI, sort UI, and any future widget would
 * otherwise duplicate this URL-sync logic, which is a perfect SoC violation.
 */
export interface UseProductFiltersResult {
  filters: ProductFilters;
  isPending: boolean;
  setCategory: (category: Category | null) => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortOrder | null) => void;
  reset: () => void;
}

export function useProductFilters(): UseProductFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(search.toString())),
    [search],
  );

  const replaceWith = useCallback(
    (next: ProductFilters) => {
      const qs = serializeFilters(next);
      const url = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => router.replace(url, { scroll: false }));
    },
    [pathname, router],
  );

  return {
    filters,
    isPending,
    setCategory: (category) => replaceWith({ ...filters, category }),
    setSearch: (value) =>
      replaceWith({ ...filters, search: value.trim().slice(0, 80) }),
    setSort: (sort) => replaceWith({ ...filters, sort }),
    reset: () =>
      replaceWith({ category: null, search: "", sort: null }),
  };
}

/** Re-export this so consumers don't have to reach into types/. */
export { asCategory };
