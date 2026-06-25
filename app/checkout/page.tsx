import type { Metadata } from "next";
import { CheckoutView } from "@/features/checkout/components/CheckoutView/CheckoutView";
import styles from "./page.module.css";

/**
 * Checkout route.
 *
 * Like /cart, this is user-private and has zero SEO value (noindex). The view
 * is a Client Component because it owns form state + a simulated submission.
 * The page shell stays a thin Server Component that just renders the layout.
 */

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.sub}>Simulated payment - no real charge.</p>
      </header>
      <CheckoutView />
    </div>
  );
}
