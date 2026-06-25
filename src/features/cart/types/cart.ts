/**
 * Cart domain types.
 *
 * Memory-strategy decision: a CartItem stores ONLY the product id and the
 * quantity. We never duplicate the product (title, image, price, etc.) in
 * cart state because:
 *
 *   1. localStorage payload stays tiny (a few bytes per line).
 *   2. The cart can never drift from the source of truth (price changes
 *      reflect immediately on next page render).
 *   3. Eventual backend sync is trivial — just push `{id, quantity}` pairs.
 *
 * Product details for cart rows are resolved at render time from the cached
 * product API. That is exactly what `react.cache()` + Cache Components were
 * built for.
 */
export interface CartItem {
  readonly id: number;
  readonly quantity: number;
}
