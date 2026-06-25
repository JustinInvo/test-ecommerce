"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "../../store/cart.store";
import { useCartHydration } from "../../hooks/useCartHydration";
import { formatPrice } from "@/features/products/utils/format";
import type { Product } from "@/features/products/types/product";
import styles from "./CartView.module.css";

/**
 * Cart page UI. Client Component.
 *
 * The cart store holds `{id, quantity}` only — to render line items we
 * resolve the product details from a public JSON snapshot via fetch.
 * `cache: "force-cache"` lets Next reuse the cached payload across views.
 *
 * Why fetching here (not server-rendering the cart): the cart is per-user,
 * lives in localStorage, and has no SEO value. Hydrating from server would
 * require shipping the cart in cookies — not the right trade-off.
 */
export function CartView() {
  const hydrated = useCartHydration();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("https://fakestoreapi.com/products", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Product[]>;
      })
      .then((all) => {
        if (cancelled) return;
        setProducts(all);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, items.length]);

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

  if (!hydrated || loading) {
    return (
      <p className={styles.muted} aria-busy>
        Loading your cart…
      </p>
    );
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        Couldn’t load product details: {error}.{" "}
        <button
          type="button"
          className={styles.link}
          onClick={() => setError(null)}
        >
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
          Browse the catalog and add favorites — they’ll show up here.
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
              <Link
                href={`/products/${product.id}`}
                className={styles.lineTitle}
              >
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
        <button type="button" className={styles.checkout} disabled>
          Checkout (demo)
        </button>
        <button
          type="button"
          className={styles.clear}
          onClick={() => clearCart()}
        >
          Clear cart
        </button>
      </aside>
    </div>
  );
}
