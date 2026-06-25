import Link from "next/link";
import styles from "./products/[id]/not-found.module.css";

export default function NotFound() {
  return (
    <section className={`container ${styles.root}`} role="alert">
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.message}>
        The page you were looking for doesn’t exist. Try the catalog instead.
      </p>
      <Link href="/products" className={styles.action}>
        Go to catalog
      </Link>
    </section>
  );
}
