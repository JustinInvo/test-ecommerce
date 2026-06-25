import Link from "next/link";
import styles from "./not-found.module.css";

/**
 * Rendered when `notFound()` is called inside the PDP. Page-level 404 so the
 * header/footer stay visible — users can pivot to the catalog instead of
 * landing on a dead end.
 */
export default function ProductNotFound() {
  return (
    <section className={`container ${styles.root}`} role="alert">
      <h1 className={styles.title}>Product not found</h1>
      <p className={styles.message}>
        The product you’re looking for is no longer available or never existed.
      </p>
      <Link href="/products" className={styles.action}>
        Browse the catalog
      </Link>
    </section>
  );
}
