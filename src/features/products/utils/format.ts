/**
 * Pure formatting helpers. Pure functions = trivially testable, zero runtime
 * coupling, can be reused in RSC and Client Components alike.
 */

/** Format a number as USD currency. Allows override per locale/currency. */
export function formatPrice(
  amount: number,
  options: { locale?: string; currency?: string } = {},
): string {
  const { locale = "en-US", currency = "USD" } = options;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Title-case a category id for display ("men's clothing" → "Men's Clothing"). */
export function formatCategoryLabel(category: string): string {
  return category
    .split(" ")
    .map((word) =>
      word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Clamp a number to [min, max]. Useful for quantity inputs. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Cap a string to N chars with an ellipsis. Word-safe-ish (no mid-word cuts). */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trimEnd()}…`;
}
