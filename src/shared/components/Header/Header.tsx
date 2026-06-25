import Link from "next/link";
import { site } from "@/shared/config/site";
import { CartIndicator } from "@/features/cart/components/CartIndicator/CartIndicator";
import styles from "./Header.module.css";

/**
 * Header is a Server Component. CartIndicator is a Client Component
 * (it has "use client") so React handles the boundary automatically:
 * the header HTML ships server-rendered, the cart counter hydrates on
 * the client. No need for next/dynamic here.
 */
export function Header() {
  return (
    <header className={styles.root}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${site.name} - home`}>
          <span className={styles.brandMark} aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M4 7h16l-1.4 11.2A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.8L4 7Zm4-3a4 4 0 1 1 8 0v3h-2V4a2 2 0 1 0-4 0v3H8V4Z"
              />
            </svg>
          </span>
          <span className={styles.brandText}>{site.name}</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <Link href="/products" className={styles.navLink}>
            Catalog
          </Link>
        </nav>

        <div className={styles.actions}>
          <CartIndicator />
        </div>
      </div>
    </header>
  );
}
