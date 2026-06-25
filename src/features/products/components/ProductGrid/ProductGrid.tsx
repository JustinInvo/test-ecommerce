import type { Product } from "../../types/product";
import { ProductCard } from "../ProductCard/ProductCard";
import styles from "./ProductGrid.module.css";

export function ProductGrid({ products }: { products: readonly Product[] }) {
  return (
    <ul className={styles.grid} aria-label="Products">
      {products.map((p, i) => (
        <li key={p.id} className={styles.cell}>
          <ProductCard product={p} priority={i === 0} />
        </li>
      ))}
    </ul>
  );
}
