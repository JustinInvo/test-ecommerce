"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "../../store/cart.store";
import { useCartHydration } from "../../hooks/useCartHydration";
import { useProducts } from "@/features/products/hooks/useProducts";
import { formatPrice } from "@/features/products/utils/format";
import type { Product } from "@/features/products/types/product";
import styles from "./CartView.module.css";

/**
 * Cart page UI. Client Component.
 *
 * Data flow:
 *   useCartStore  -> cart items ({id, quantity})
 *   useProducts   -> all products (fetched once via shared client service)
 *   join in-memory to build the line items
 *
 * Decisions:
 *  - No product details are persisted in the cart store. Joining at render
 *    time keeps the price/title authoritative (memory strategy).
 *  - Retry is delegated to useProducts.retry() so the effect actually re-runs
 *    (fixes the prior bug where clicking Retry only cleared the message).
 */
export function CartView() {
  const hydrated = useCartHydration();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const { products, isLoading, error, retry } = useProducts();

  const lines = useMemo(() => {
    return items
      .map((i) => {
        const product = products.find((p) => p.id === i.id);
        return product ? { product, quantity: i.quantity } : null;
      })
      .filter((v): v is { product: Product; quantity: number } => v !== null);
  }, [items, products]);

  const total = useMemo(
    () => lines.reduce((acc, l) => acc + l.product.price * l.quantity, 0),
    [lines],
  );

  if (!hydrated || (isLoading && items.length > 0)) {
    return <p className={styles.muted} aria-busy>Loading your cart...</p>;
  }

  if (error && items.length > 0) {
    return (
      <div className={styles.error} role="alert">
        We could not load product details: {error.message}.{" "}
        <button type="button" className={styles.link} onClick={retry}>
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.muted}>
          Browse the catalog and add favorites - they will show up here.
        </p>
        <Link href="/products" className={styles.cta}>
          Go to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <ul className={styles.list}>
        {lines.map(({ product, quantity }) => (
          <li key={product.id} className={styles.line}>
            <Link href={`/products/${product.id}`} className={styles.thumb}>
              <Image
                src={product.image}
                alt=""
                fill
                sizes="96px"
                className={styles.thumbImg}
              />
            </Link>
            <div className={styles.lineBody}>
              <Link href={`/products/${product.id}`} className={styles.lineTitle}>
                {product.title}
              </Link>
              <div className={styles.lineMeta}>
                <span className={styles.unit}>
                  {formatPrice(product.price)} each
                </span>
                <span className={styles.subtotal}>
                  {formatPrice(product.price * quantity)}
                </span>
              </div>
              <div className={styles.controls}>
                <label className={styles.qtyLabel}>
                  Quantity
                  <input
                    type="number"
                    className={styles.qtyInput}
                    value={quantity}
                    min={1}
                    max={99}
                    onChange={(e) =>
                      updateQty(product.id, Number(e.target.value) || 1)
                    }
                  />
                </label>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeItem(product.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className={styles.summary}>
        <h2 className={styles.summaryTitle}>Order summary</h2>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span className={styles.summaryAmt}>{formatPrice(total)}</span>
        </div>
        <p className={styles.smallNote}>
          Taxes and shipping calculated at checkout.
        </p>
        <Link href="/checkout" className={styles.checkout}>
          Proceed to checkout
        </Link>
        <button type="button" className={styles.clear} onClick={() => clearCart()}>
          Clear cart
        </button>
      </aside>
    </div>
  );
}
