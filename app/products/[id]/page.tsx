import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/features/products/api/products.api";
import { ProductDetails } from "@/features/products/components/ProductDetails/ProductDetails";
import { truncate } from "@/features/products/utils/format";
import { site } from "@/shared/config/site";
import styles from "./page.module.css";

/**
 * Product detail page (PDP).
 *
 *  - `params` is a Promise in Next 16 — must be awaited.
 *  - `getProductById` is wrapped in React `cache()` so `generateMetadata` and
 *    the page share a single fetch within one request.
 *  - Unknown ids resolve to `notFound()`, rendering `not-found.tsx`.
 *  - OG image is set to the product image — exactly the requirement for
 *    rich shares on WhatsApp / Facebook / LinkedIn / Discord.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return { title: "Product not found" };

  const product = await getProductById(id);
  if (!product) return { title: "Product not found" };

  const description = truncate(product.description, 155);
  const canonical = `/products/${product.id}`;

  return {
    title: product.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url: canonical,
      siteName: site.name,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 1200,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) notFound();

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className={`container ${styles.page}`}>
      <ProductDetails product={product} />
    </div>
  );
}
