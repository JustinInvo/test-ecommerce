"use client";

import { useState } from "react";
import { useCartStore } from "../../store/cart.store";
import { useCartHydration } from "../../hooks/useCartHydration";
import { clamp } from "@/features/products/utils/format";
import styles from "./AddToCartButton.module.css";

/**
 * Client island used inside Server-rendered PDPs.
 *
 *  - Receives only the productId (never the whole product). Matches the
 *    "cart stores id+qty only" memory rule.
 *  - Has its own micro-state for quantity to keep UX snappy.
 *  - Briefly toggles a "Added!" affirmation so the action feels confirmed
 *    without leaving the page.
 */
export function AddToCartButton({ productId }: { productId: number }) {
  const hydrated = useCartHydration();
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  const onAdd = () => {
    addItem(productId, qty);
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  };

  return (
    <div className={styles.root}>
      <div className={styles.qty} role="group" aria-label="Quantity">
        <button
          type="button"
          className={styles.qtyBtn}
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => clamp(q - 1, 1, 99))}
          disabled={qty <= 1}
        >
          −
        </button>
        <input
          type="number"
          className={styles.qtyInput}
          min={1}
          max={99}
          value={qty}
          aria-label="Quantity"
          onChange={(e) => {
            const next = Number(e.target.value);
            setQty(Number.isFinite(next) ? clamp(next, 1, 99) : 1);
          }}
        />
        <button
          type="button"
          className={styles.qtyBtn}
          aria-label="Increase quantity"
          onClick={() => setQty((q) => clamp(q + 1, 1, 99))}
          disabled={qty >= 99}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className={styles.add}
        data-state={done ? "added" : "idle"}
        onClick={onAdd}
        disabled={!hydrated}
      >
        {done ? "Added!" : "Add to cart"}
      </button>
    </div>
  );
}
