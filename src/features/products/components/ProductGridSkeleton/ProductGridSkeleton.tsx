import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import styles from "./ProductGridSkeleton.module.css";

/**
 * Mirrors the real grid layout dimensions so loading state doesn't trigger a
 * layout shift when the data resolves.
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className={styles.grid} aria-label="Loading products" aria-busy>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={styles.cell}>
          <div className={styles.card}>
            <Skeleton width="100%" height="100%" radius="0" />
            <div className={styles.meta}>
              <Skeleton width="40%" height={10} />
              <Skeleton width="90%" height={14} />
              <Skeleton width="60%" height={14} />
              <div className={styles.priceRow}>
                <Skeleton width="30%" height={16} />
                <Skeleton width="20%" height={12} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
