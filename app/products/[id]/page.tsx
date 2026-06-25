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
 * `params` is a Promise in Next 16 - must be awaited.
 * `getProductById` is wrapped in React `cache()` so `generateMetadata` and
 * the page share a single fetch within one request.
 *
 * OG strategy (covers Facebook, WhatsApp, LinkedIn, Discord, Pinterest,
 * Slack, Telegram - all of which read og:* tags). Twitter has its own card.
 *  - og:type = "product" + og:price:amount/currency for richer FB/IG link
 *    previews and Pinterest Rich Pins.
 *  - og:image width/height = 1200x1200 to satisfy LinkedIn's preferred ratio
 *    and avoid square-image cropping on WhatsApp / Discord.
 *  - twitter:card = "summary_large_image" so the product image dominates.
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
      // og:type = "product" is the e-commerce-aware variant. FB / WhatsApp /
      // LinkedIn / Discord / Pinterest all understand it and show price.
      type: "website",
      title: product.title,
      description,
      url: canonical,
      siteName: site.name,
      locale: site.locale,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 1200,
          alt: product.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [product.image],
      site: site.twitter,
      creator: site.twitter,
    },
    // Extra OG / commerce fields that the Metadata type does not type out
    // strongly. Emitted via `other` so they reach <head> verbatim.
    other: {
      "og:type": "product",
      "og:price:amount": product.price.toFixed(2),
      "og:price:currency": "USD",
      "product:price:amount": product.price.toFixed(2),
      "product:price:currency": "USD",
      "product:availability": "in stock",
      "product:condition": "new",
      "product:retailer_item_id": String(product.id),
      "product:category": product.category,
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
