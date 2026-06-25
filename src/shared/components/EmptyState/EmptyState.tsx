import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  cta?: { href: string; label: string };
  variant?: "card" | "strip";
}

/**
 * Generic empty / fallback surface.
 *
 * Used wherever an upstream call returns no data (either legitimately empty
 * or because we degraded an upstream failure). Lives in `shared/` so any
 * feature can reuse it without coupling to product domain.
 */
export function EmptyState({
  title,
  message,
  icon,
  cta,
  variant = "card",
}: EmptyStateProps) {
  return (
    <section
      className={`${styles.root} ${variant === "strip" ? styles.strip : styles.card}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.illustration} aria-hidden>
        {icon ?? <DefaultIcon />}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {message ? <p className={styles.message}>{message}</p> : null}
        {cta ? (
          <Link href={cta.href} className={styles.action}>
            {cta.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden>
      <rect
        x="10"
        y="18"
        width="44"
        height="34"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M22 18V12a10 10 0 0 1 20 0v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 32h16M24 40h10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
