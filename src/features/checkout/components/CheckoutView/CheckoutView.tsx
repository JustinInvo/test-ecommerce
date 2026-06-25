"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/features/cart/store/cart.store";
import { useCartHydration } from "@/features/cart/hooks/useCartHydration";
import { useProducts } from "@/features/products/hooks/useProducts";
import { formatPrice } from "@/features/products/utils/format";
import type { Product } from "@/features/products/types/product";
import styles from "./CheckoutView.module.css";

/**
 * Simulated checkout screen. NOT a real payment integration - it merely
 * mimics the UX of one so the demo feels complete:
 *
 *  - Reads the cart from the persisted store (id+quantity).
 *  - Joins with the cached product catalog (via useProducts) for prices
 *    and titles. Same composition pattern as CartView.
 *  - On submit, simulates a network call with a small delay, clears the
 *    cart, and shows a success state. No card data leaves the page.
 *
 * SOLID notes:
 *  - SRP: View only. No HTTP, no money math beyond a sum.
 *  - DIP: Depends on the cart store and useProducts hook abstractions,
 *    not on the underlying transport.
 */

type Stage = "form" | "processing" | "success";

export function CheckoutView() {
  const hydrated = useCartHydration();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { products } = useProducts();

  const [stage, setStage] = useState<Stage>("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    card: "",
    exp: "",
    cvc: "",
  });

  const lines = useMemo(() => {
    return items
      .map((i) => {
        const product = products.find((p) => p.id === i.id);
        return product ? { product, quantity: i.quantity } : null;
      })
      .filter((v): v is { product: Product; quantity: number } => v !== null);
  }, [items, products]);

  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + l.product.price * l.quantity, 0),
    [lines],
  );
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 4.99;
  const total = subtotal + tax + shipping;

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStage("processing");
    // Simulate latency
    setTimeout(() => {
      const fakeOrder =
        "FS-" + Date.now().toString(36).toUpperCase().slice(-8);
      setOrderId(fakeOrder);
      setStage("success");
      clearCart();
    }, 900);
  }

  if (!hydrated) {
    return <p className={styles.muted} aria-busy>Loading checkout...</p>;
  }

  if (stage === "success" && orderId) {
    return (
      <div className={styles.success} role="status">
        <div className={styles.successIcon} aria-hidden>
          <svg viewBox="0 0 24 24" width="40" height="40">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12.5l4.5 4.5L19 7.5"
            />
          </svg>
        </div>
        <h2 className={styles.successTitle}>Payment successful</h2>
        <p className={styles.successText}>
          Order <strong>{orderId}</strong> has been confirmed (simulated).
        </p>
        <div className={styles.successCtas}>
          <Link href="/products" className={styles.primary}>
            Keep shopping
          </Link>
          <Link href="/" className={styles.secondary}>
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.muted}>
          You cannot check out without items. Browse the catalog first.
        </p>
        <Link href="/products" className={styles.primary}>
          Go to catalog
        </Link>
      </div>
    );
  }

  const disabled = stage === "processing";

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <fieldset className={styles.fieldset} disabled={disabled}>
          <legend className={styles.legend}>Contact</legend>
          <label className={styles.field}>
            <span className={styles.label}>Full name</span>
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={onChange}
              required
              autoComplete="name"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
            />
          </label>
        </fieldset>

        <fieldset className={styles.fieldset} disabled={disabled}>
          <legend className={styles.legend}>Payment (simulated)</legend>
          <label className={styles.field}>
            <span className={styles.label}>Card number</span>
            <input
              className={styles.input}
              name="card"
              value={form.card}
              onChange={onChange}
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              required
              autoComplete="cc-number"
            />
          </label>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span className={styles.label}>Expiration</span>
              <input
                className={styles.input}
                name="exp"
                value={form.exp}
                onChange={onChange}
                placeholder="MM/YY"
                required
                autoComplete="cc-exp"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>CVC</span>
              <input
                className={styles.input}
                name="cvc"
                value={form.cvc}
                onChange={onChange}
                inputMode="numeric"
                placeholder="123"
                required
                autoComplete="cc-csc"
              />
            </label>
          </div>
          <p className={styles.note}>
            This is a demo. No payment will be processed and no card data
            leaves your browser.
          </p>
        </fieldset>

        <button type="submit" className={styles.submit} disabled={disabled}>
          {disabled ? "Processing..." : `Pay ${formatPrice(total)}`}
        </button>
      </form>

      <aside className={styles.summary}>
        <h2 className={styles.summaryTitle}>Order</h2>
        <ul className={styles.lines}>
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className={styles.lineRow}>
              <span className={styles.lineName}>
                {quantity}x {product.title}
              </span>
              <span className={styles.lineAmt}>
                {formatPrice(product.price * quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.divider} />
        <div className={styles.row}>
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.row}>
          <span>Tax (8%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className={styles.row}>
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className={`${styles.row} ${styles.total}`}>
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  );
}
