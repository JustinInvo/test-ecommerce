"use client";

import { useEffect } from "react";
import { RetryButton } from "@/shared/components/RetryButton/RetryButton";
import styles from "./error.module.css";

/**
 * Segment-level error boundary for /products.
 *
 * Why scoped here (not just app-level):
 *   - A catalog fetch failure shouldn't blow up the entire app shell.
 *   - We preserve the header/footer and offer retry within the segment.
 */
export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook for an observability layer (Sentry, Datadog, etc.).
    // eslint-disable-next-line no-console
    console.error("[products/error]", error);
  }, [error]);

  return (
    <section className={`container ${styles.root}`} role="alert">
      <h1 className={styles.title}>Catalog temporarily unavailable</h1>
      <p className={styles.message}>
        We couldn’t load the product catalog right now. This is usually a
        short-lived upstream issue.
      </p>
      <RetryButton reset={reset} label="Retry" />
      {error.digest ? (
        <p className={styles.digest}>Ref: {error.digest}</p>
      ) : null}
    </section>
  );
}
