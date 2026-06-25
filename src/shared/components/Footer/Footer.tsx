import { site } from "@/shared/config/site";
import styles from "./Footer.module.css";

/**
 * Resolved at build time (or from env). Avoids `new Date()` inside an
 * uncached Server Component, which Next 16 Cache Components forbid
 * (see https://nextjs.org/docs/messages/next-prerender-current-time).
 *
 * Override at deploy time via NEXT_PUBLIC_COPY_YEAR if you want it dynamic.
 */
const COPY_YEAR = Number(process.env.NEXT_PUBLIC_COPY_YEAR) || 2026;

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.copy}>
          (c) {COPY_YEAR} {site.name}. Built with Next.js 16.
        </p>
        <p className={styles.note}>
          Demo storefront. Products served from{" "}
          <a
            href="https://fakestoreapi.com"
            target="_blank"
            rel="noreferrer noopener"
            className={styles.link}
          >
            fakestoreapi.com
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
