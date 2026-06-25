/**
 * Domain types — derived from the actual FakeStore API contract.
 *
 *   GET /products            → Product[]
 *   GET /products/{id}       → Product
 *   GET /products/categories → Category[]   (array of strings)
 *
 * Types are intentionally narrow and read-only. Mutating shapes downstream is
 * a smell; copy + transform instead. `Category` is a branded string so it can
 * be passed around without being accidentally confused with `string`.
 */

export type Category = string & { readonly __category: unique symbol };

export interface ProductRating {
  readonly rate: number;
  readonly count: number;
}

export interface Product {
  readonly id: number;
  readonly title: string;
  readonly price: number;
  readonly description: string;
  readonly category: Category;
  readonly image: string;
  readonly rating: ProductRating;
}

/** Helper: assert a runtime string as Category (no runtime cost). */
export const asCategory = (value: string): Category => value as Category;

/**
 * Sort options the catalog supports. Kept as a const tuple so the type is the
 * union of literal strings AND can be iterated at runtime for validation.
 */
export const SORT_OPTIONS = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_OPTIONS)[number];

/** Shape of validated filter state derived from URL search params. */
export interface ProductFilters {
  readonly category: Category | null;
  readonly search: string;
  readonly sort: SortOrder | null;
}
