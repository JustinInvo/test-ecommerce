import Link from "next/link";
import { Suspense } from "react";
import {
  getAllProducts,
  getCategories,
} from "@/features/products/api/products.api";
import { ProductCard } from "@/features/products/components/ProductCard/ProductCard";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton/ProductGridSkeleton";
import { RecommendedProducts } from "@/features/recommendations/components/RecommendedProducts/RecommendedProducts";
import { formatCategoryLabel } from "@/features/products/utils/format";
import { site } from "@/shared/config/site";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <p className={styles.eyebrow}>{site.name}</p>
          <h1 className={styles.heroTitle}>
            Quality products, curated for everyday life.
          </h1>
          <p className={styles.heroLead}>
            Electronics, fashion and jewelry - handpicked from a single
            catalog. Fast, transparent, no clutter.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/products" className={styles.primary}>
              Browse the catalog
            </Link>
            <Link href="/products?sort=asc" className={styles.secondary}>
              See best prices
            </Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Shop by category</h2>
        </header>
        <Suspense fallback={<div className={styles.catPlaceholder} />}>
          <CategoriesStrip />
        </Suspense>
      </section>

      <section className={`container ${styles.section}`}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Featured</h2>
          <Link href="/products" className={styles.sectionLink}>
            See all
          </Link>
        </header>
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <FeaturedStrip />
        </Suspense>
      </section>

      <section className={`container ${styles.section}`}>
        <RecommendedProducts heading="Recommended for you" />
      </section>
    </>
  );
}

async function CategoriesStrip() {
  const categories = await getCategories();
  return (
    <ul className={styles.catList}>
      {categories.map((c) => (
        <li key={c}>
          <Link
            href={`/products?category=${encodeURIComponent(String(c))}`}
            className={styles.catChip}
          >
            {formatCategoryLabel(c)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function FeaturedStrip() {
  const products = await getAllProducts();
  const featured = [...products]
    .sort(
      (a, b) =>
        b.rating.rate * Math.log10(b.rating.count + 1) -
        a.rating.rate * Math.log10(a.rating.count + 1),
    )
    .slice(0, 4);
  return (
    <ul className={styles.featured}>
      {featured.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i === 0} />
        </li>
      ))}
    </ul>
  );
}
