import Link from "next/link";
import styles from "./EmptyResults.module.css";

interface EmptyResultsProps {
  /** Build the "clear filters" link target. Falls back to /products. */
  clearHref?: string;
  /** Customizable copy, but defaults read well for our use case. */
  title?: string;
  message?: string;
}

export function EmptyResults({
  clearHref = "/products",
  title = "No products match your filters",
  message = "Try removing a filter, broadening your search or browsing all categories.",
}: EmptyResultsProps) {
  return (
    <section className={styles.root} aria-label="No results">
      <div className={styles.illustration} aria-hidden>
        <svg viewBox="0 0 64 64" width="56" height="56">
          <circle
            cx="28"
            cy="28"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="m44 44 14 14"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M22 28h12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      <Link href={clearHref} className={styles.action}>
        Clear filters
      </Link>
    </section>
  );
}
