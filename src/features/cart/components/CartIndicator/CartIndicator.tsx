"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCartStore, selectCartCount } from "../../store/cart.store";
import { useCartHydration } from "../../hooks/useCartHydration";
import styles from "./CartIndicator.module.css";

/**
 * Header cart indicator.
 *
 *  - Subscribes only to the count via selector — re-renders only when the
 *    total quantity changes (not on, say, item description edits).
 *  - Uses controlled hydration to avoid SSR mismatch with the persisted
 *    state. While unhydrated, renders an aria-hidden placeholder so layout
 *    is stable.
 */
export function CartIndicator() {
  const hydrated = useCartHydration();
  const count = useCartStore(selectCartCount);

  // Belt-and-braces: keep persisted state in sync across tabs.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "fakestore:cart:v1") {
        useCartStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <Link
      href="/cart"
      className={styles.root}
      aria-label={`Cart, ${count} items`}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        className={styles.icon}
        aria-hidden
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 4h2l2.4 11.2A2 2 0 0 0 9.4 17h8.6a2 2 0 0 0 2-1.6L21 8H6"
        />
        <circle cx="10" cy="20" r="1.3" fill="currentColor" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      </svg>
      <span className={styles.badge} data-empty={hydrated && count === 0}>
        <span className={styles.badgeText} suppressHydrationWarning>
          {hydrated ? count : 0}
        </span>
      </span>
    </Link>
  );
}
