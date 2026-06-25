import styles from "./Skeleton.module.css";

/**
 * Skeleton primitive. Authored as plain HTML + a single shimmer keyframe so
 * it can be used inside Server Components without flipping a Client boundary.
 */
export function Skeleton({
  width,
  height,
  radius = "var(--radius-md)",
  className,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`${styles.root} ${className ?? ""}`.trim()}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
