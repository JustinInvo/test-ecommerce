import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={`container ${styles.page}`}>
      <Skeleton width={240} height={14} />
      <div className={styles.grid}>
        <Skeleton width="100%" height={420} radius="var(--radius-lg)" />
        <div className={styles.info}>
          <Skeleton width={100} height={10} />
          <Skeleton width="80%" height={28} />
          <Skeleton width="40%" height={14} />
          <Skeleton width={140} height={32} />
          <div className={styles.lines}>
            <Skeleton width="100%" height={12} />
            <Skeleton width="95%" height={12} />
            <Skeleton width="92%" height={12} />
            <Skeleton width="70%" height={12} />
          </div>
          <Skeleton width={220} height={44} radius="var(--radius-pill)" />
        </div>
      </div>
    </div>
  );
}
