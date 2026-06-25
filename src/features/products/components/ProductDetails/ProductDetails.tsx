import Image from "next/image";
import Link from "next/link";
import type { Product } from "../../types/product";
import { formatPrice, formatCategoryLabel } from "../../utils/format";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton/AddToCartButton";
import { RecordVisit } from "@/features/recommendations/components/RecordVisit/RecordVisit";
import styles from "./ProductDetails.module.css";

/**
 * PDP body. Server-rendered HTML.
 *
 *  - Only the AddToCartButton + RecordVisit are Client Components — minimal
 *    interactivity surface.
 *  - Image uses `priority` because it's the LCP candidate on this route.
 *  - JSON-LD Product schema is emitted inline (next/script via Server
 *    Component is awkward in Next 16; a typed object inside <script> is the
 *    canonical pattern).
 */
export function ProductDetails({ product }: { product: Product }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [product.image],
    description: product.description,
    sku: String(product.id),
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating.rate,
      reviewCount: product.rating.count,
    },
  };

  return (
    <article className={styles.root} itemScope itemType="https://schema.org/Product">
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <ol className={styles.crumbList}>
          <li>
            <Link href="/products">Catalog</Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link
              href={`/products?category=${encodeURIComponent(String(product.category))}`}
            >
              {formatCategoryLabel(product.category)}
            </Link>
          </li>
        </ol>
      </nav>

      <div className={styles.grid}>
        <div className={styles.imageBox}>
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            priority
            className={styles.image}
          />
        </div>

        <div className={styles.info}>
          <p className={styles.category}>{formatCategoryLabel(product.category)}</p>
          <h1 className={styles.title} itemProp="name">
            {product.title}
          </h1>
          <div className={styles.rating} aria-label={`Rating ${product.rating.rate} of 5`}>
            <span className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden
                >
                  <path
                    fill={i < Math.round(product.rating.rate) ? "currentColor" : "transparent"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    d="m12 17.3-6.18 3.7 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62 7.19.62-5.46 4.73 1.64 7.03z"
                  />
                </svg>
              ))}
            </span>
            <span className={styles.ratingText}>
              {product.rating.rate.toFixed(1)} · {product.rating.count} reviews
            </span>
          </div>

          <p className={styles.price} itemProp="offers">
            {formatPrice(product.price)}
          </p>

          <p className={styles.description} itemProp="description">
            {product.description}
          </p>

          <div className={styles.cta}>
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>

      {/* Client island: record visit for recommendations. */}
      <RecordVisit category={product.category} />

      <script
        type="application/ld+json"
        // safe: we control the keys and serialize a typed object
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </article>
  );
}
