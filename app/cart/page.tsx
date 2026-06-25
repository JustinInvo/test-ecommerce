import type { Metadata } from "next";
import { CartView } from "@/features/cart/components/CartView/CartView";
import styles from "./page.module.css";

/**
 * Cart route.
 *
 * CartView is a Client Component ("use client"). Importing it directly from a
 * Server Component is the standard way to mount a client island: the server
 * sends a tiny placeholder, the client hydrates with the persisted localStorage
 * state. Marked noindex because the cart is user-private.
 */

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review items in your cart and proceed to checkout.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your cart</h1>
      </header>
      <CartView />
    </div>
  );
}
