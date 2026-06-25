"use client";

import { useEffect } from "react";
import { RetryButton } from "@/shared/components/RetryButton/RetryButton";
import styles from "../error.module.css";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[products/[id]/error]", error);
  }, [error]);

  return (
    <section className={`container ${styles.root}`} role="alert">
      <h1 className={styles.title}>We couldn’t load this product</h1>
      <p className={styles.message}>
        Something went wrong fetching this product. You can retry, or go back
        to the catalog.
      </p>
      <RetryButton reset={reset} label="Retry" />
      {error.digest ? (
        <p className={styles.digest}>Ref: {error.digest}</p>
      ) : null}
    </section>
  );
}
