import type { Product } from "@/features/products/types/product";

/**
 * Pure recommendation policy.
 *
 * `topCategory` is the user's most-visited category (signal from visited
 * store). We surface up to `limit` products from that category, excluding the
 * id passed via `excludeId` (so a PDP never recommends the very product the
 * user is on).
 */
export function recommendByCategory(
  products: readonly Product[],
  topCategory: string | null,
  options: { limit?: number; excludeId?: number } = {},
): readonly Product[] {
  const { limit = 8, excludeId } = options;
  if (!topCategory) return [];
  const lc = topCategory.toLowerCase();
  return products
    .filter(
      (p) =>
        p.category.toLowerCase() === lc &&
        (excludeId === undefined || p.id !== excludeId),
    )
    .slice(0, limit);
}
