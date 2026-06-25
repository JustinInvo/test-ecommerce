import Image from "next/image";
import Link from "next/link";
import type { Product } from "../../types/product";
import { formatPrice, formatCategoryLabel, truncate } from "../../utils/format";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  /** Mark the LCP card so next/image gives it priority. Typically only true for index 0. */
  priority?: boolean;
}

/**
 * Catalog product card. Server-rendered HTML.
 *
 * Performance choices:
 *  - `next/image` with explicit width/height + `sizes` so the browser picks
 *    the right resource and the layout reserves the right space (no CLS).
 *  - Only the first card receives `priority` so we don't fight with above-
 *    the-fold prioritization across the grid.
 *  - Card is a single `<Link>` so the whole tile is a click target (better
 *    UX, fewer DOM nodes than nested clickable areas).
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className={styles.card}
      aria-label={`View details for ${product.title}`}
    >
      <article className={styles.inner}>
        <div className={styles.imageBox}>
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1200px) 280px, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className={styles.image}
          />
        </div>
        <div className={styles.meta}>
          <p className={styles.category}>{formatCategoryLabel(product.category)}</p>
          <h3 className={styles.title}>{truncate(product.title, 60)}</h3>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            <span
              className={styles.rating}
              aria-label={`Rated ${product.rating.rate} out of 5 by ${product.rating.count} buyers`}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                <path
                  fill="currentColor"
                  d="m12 17.3-6.18 3.7 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.73 1.64 7.03z"
                />
              </svg>
              {product.rating.rate.toFixed(1)}
              <span className={styles.ratingCount}>({product.rating.count})</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
