"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVisitedStore } from "../../store/visited.store";
import { recommendByCategory } from "../../services/recommend";
import { useProducts } from "@/features/products/hooks/useProducts";
import { formatPrice, formatCategoryLabel } from "@/features/products/utils/format";
import styles from "./RecommendedProducts.module.css";

interface Props {
  heading?: string;
  excludeId?: number;
  limit?: number;
}

/**
 * "Recommended For You" - the business-plus surface.
 *
 *  - Reads the persisted topCategory from the visited store.
 *  - Fetches the full catalog via the shared useProducts hook (no duplication
 *    of fetch logic; same retry / cancel semantics as the rest of the app).
 *  - Silent when the user has fewer than 2 visits or no products match -
 *    quiet failure beats empty rails.
 */
export function RecommendedProducts({
  heading = "Recommended for you",
  excludeId,
  limit = 8,
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const top = useVisitedStore((s) => s.topCategory());
  const { products } = useProducts();

  useEffect(() => {
    const unsub = useVisitedStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    useVisitedStore.persist.rehydrate();
    if (useVisitedStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

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
          Based on your interest in <strong>{formatCategoryLabel(top)}</strong>.
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
