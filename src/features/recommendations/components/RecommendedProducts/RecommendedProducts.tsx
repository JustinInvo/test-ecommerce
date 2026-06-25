"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVisitedStore } from "../../store/visited.store";
import { recommendByCategory } from "../../services/recommend";
import { formatPrice, formatCategoryLabel } from "@/features/products/utils/format";
import type { Product } from "@/features/products/types/product";
import styles from "./RecommendedProducts.module.css";

interface Props {
  heading?: string;
  /** Exclude a specific product (e.g., the one on the PDP currently). */
  excludeId?: number;
  /** Maximum recommendations to render. */
  limit?: number;
}

/**
 * "Recommended For You" — the business-plus surface.
 *
 *  - Reads the persisted "topCategory" from visited store.
 *  - If the user has fewer than 2 visits, renders nothing (no noisy empty
 *    state). Quiet failure beats fake recommendations.
 *  - Lightly client-fetches the catalog with `cache: "force-cache"` so the
 *    browser reuses the same payload as the cart and other islands.
 *
 * Why this matters for the business:
 *   - Conversion lift: users coming back to /products see exactly what they
 *     already showed interest in (no friction).
 *   - Engagement: surfaces inventory the user might otherwise miss.
 *   - Mirrors the Promart/Amazon "for you" mechanic without requiring auth.
 */
export function RecommendedProducts({
  heading = "Recommended for you",
  excludeId,
  limit = 8,
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const top = useVisitedStore((s) => s.topCategory());

  useEffect(() => {
    const unsub = useVisitedStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    useVisitedStore.persist.rehydrate();
    if (useVisitedStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || !top) return;
    let cancelled = false;
    fetch("https://fakestoreapi.com/products", { cache: "force-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<Product[]>) : Promise.reject(r.status)))
      .then((all) => {
        if (!cancelled) setProducts(all);
      })
      .catch(() => {
        /* fail silently — recommendations are best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, top]);

  const items = useMemo(
    () => recommendByCategory(products, top, { limit, excludeId }),
    [products, top, limit, excludeId],
  );

  if (!hydrated || !top || items.length === 0) return null;

  return (
    <section className={styles.root} aria-label={heading}>
      <header className={styles.head}>
        <h2 className={styles.title}>{heading}</h2>
        <p className={styles.sub}>
          Based on your interest in{" "}
          <strong>{formatCategoryLabel(top)}</strong>.
        </p>
      </header>
      <ul className={styles.rail} role="list">
        {items.map((p) => (
          <li key={p.id} className={styles.cell}>
            <Link href={`/products/${p.id}`} className={styles.card}>
              <div className={styles.imageBox}>
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(min-width: 768px) 220px, 60vw"
                  className={styles.image}
                />
              </div>
              <div className={styles.meta}>
                <p className={styles.cardTitle}>{p.title}</p>
                <p className={styles.cardPrice}>{formatPrice(p.price)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
