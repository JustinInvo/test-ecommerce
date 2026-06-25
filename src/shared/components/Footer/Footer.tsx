"use client";

import { site } from "@/shared/config/site";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.copy}>
          (c) 2026 {site.name}. Built with Next.js 16.
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
