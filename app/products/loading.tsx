import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton/ProductGridSkeleton";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import styles from "./page.module.css";

/**
 * `loading.tsx` is automatically wrapped in a Suspense boundary by Next.
 * Renders a realistic shell (header skeleton + filters block + grid skeleton)
 * so the layout never collapses during navigation.
 */
export default function Loading() {
  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <Skeleton width={260} height={32} />
        <Skeleton width={360} height={18} />
      </div>
      <Skeleton width="100%" height={140} radius="var(--radius-lg)" />
      <ProductGridSkeleton />
    </div>
  );
}
