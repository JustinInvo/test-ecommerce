"use client";

import styles from "./RetryButton.module.css";

/**
 * Reusable retry button used by `error.tsx` boundaries. Receives the `reset`
 * callback (provided by Next) and re-renders the segment.
 */
export function RetryButton({
  reset,
  label = "Try again",
}: {
  reset: () => void;
  label?: string;
}) {
  return (
    <button type="button" className={styles.root} onClick={() => reset()}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 11A8 8 0 1 0 11.5 19.5M20 4v7h-7"
        />
      </svg>
      {label}
    </button>
  );
}
