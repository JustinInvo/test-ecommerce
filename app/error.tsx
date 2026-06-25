"use client";

import { useEffect } from "react";
import { RetryButton } from "@/shared/components/RetryButton/RetryButton";
import styles from "./products/error.module.css";

/**
 * App-level error boundary. Catches anything that escapes a segment-level
 * boundary so the user never sees a stark Next.js error screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app/error]", error);
  }, [error]);

  return (
    <section className={`container ${styles.root}`} role="alert">
      <h1 className={styles.title}>Something went wrong</h1>
      <p className={styles.message}>
        An unexpected error occurred. You can retry or head back to the
        catalog.
      </p>
      <RetryButton reset={reset} label="Retry" />
      {error.digest ? (
        <p className={styles.digest}>Ref: {error.digest}</p>
      ) : null}
    </section>
  );
}
