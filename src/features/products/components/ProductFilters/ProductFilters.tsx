"use client";

import { useEffect, useId, useState } from "react";
import {
  useProductFilters,
  asCategory,
} from "../../hooks/useProductFilters";
import { formatCategoryLabel } from "../../utils/format";
import type { Category, SortOrder } from "../../types/product";
import styles from "./ProductFilters.module.css";

interface ProductFiltersProps {
  categories: readonly Category[];
}

/**
 * Client component because it needs router + form interactions.
 *
 * Decisions:
 *  - Search input is debounced locally (300ms) before pushing to the URL so
 *    we don't replace the route on every keystroke.
 *  - All visible state derives from the URL — there is no shadow state. This
 *    matches the "URL is the source of truth" contract.
 */
export function ProductFilters({ categories }: ProductFiltersProps) {
  const { filters, setCategory, setSearch, setSort, reset, isPending } =
    useProductFilters();

  const searchId = useId();
  const sortId = useId();

  // Local mirror only for debounced typing.
  const [localSearch, setLocalSearch] = useState(filters.search);
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (localSearch === filters.search) return;
    const t = setTimeout(() => setSearch(localSearch), 300);
    return () => clearTimeout(t);
  }, [localSearch, filters.search, setSearch]);

  return (
    <section
      className={styles.root}
      aria-label="Catalog filters"
      data-pending={isPending}
    >
      <div className={styles.row}>
        <label htmlFor={searchId} className={styles.label}>
          Search
        </label>
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              d="m20 20-3.5-3.5M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"
            />
          </svg>
          <input
            id={searchId}
            type="search"
            className={styles.search}
            placeholder="Search products…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Category</span>
        <div className={styles.chipRow} role="group" aria-label="Category">
          <button
            type="button"
            className={styles.chip}
            data-active={filters.category === null}
            onClick={() => setCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={styles.chip}
              data-active={filters.category === c}
              onClick={() => setCategory(asCategory(c))}
            >
              {formatCategoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <label htmlFor={sortId} className={styles.label}>
          Sort
        </label>
        <select
          id={sortId}
          className={styles.select}
          value={filters.sort ?? ""}
          onChange={(e) => {
            const v = e.target.value as SortOrder | "";
            setSort(v === "" ? null : v);
          }}
        >
          <option value="">Recommended</option>
          <option value="asc">Price: low to high</option>
          <option value="desc">Price: high to low</option>
        </select>
      </div>

      {(filters.category || filters.search || filters.sort) && (
        <button type="button" className={styles.reset} onClick={reset}>
          Clear filters
        </button>
      )}
    </section>
  );
}
