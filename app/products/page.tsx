import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getAllProducts,
  getCategories,
} from "@/features/products/api/products.api";
import {
  applyFilters,
  parseFilters,
} from "@/features/products/services/products.service";
import { ProductFilters } from "@/features/products/components/ProductFilters/ProductFilters";
import { ProductGrid } from "@/features/products/components/ProductGrid/ProductGrid";
import { ProductGridSkeleton } from "@/features/products/components/ProductGridSkeleton/ProductGridSkeleton";
import { EmptyResults } from "@/features/products/components/EmptyResults/EmptyResults";
import { RecommendedProducts } from "@/features/recommendations/components/RecommendedProducts/RecommendedProducts";
import { formatCategoryLabel } from "@/features/products/utils/format";
import { site } from "@/shared/config/site";
import styles from "./page.module.css";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const filters = parseFilters(raw);

  const parts: string[] = [];
  if (filters.category) parts.push(formatCategoryLabel(String(filters.category)));
  if (filters.search) parts.push(`Results for "${filters.search}"`);
  if (!filters.category && !filters.search) parts.push("Catalog");

  const title = `${parts.join(" - ")} Products`;
  const description = filters.category
    ? `Browse ${formatCategoryLabel(String(filters.category))} products from ${site.name}.`
    : `Browse the full ${site.name} catalog. Curated quality across all categories.`;

  const qs = new URLSearchParams();
  if (filters.category) qs.set("category", String(filters.category));
  if (filters.search) qs.set("search", filters.search);
  if (filters.sort) qs.set("sort", filters.sort);
  const canonical = qs.toString() ? `/products?${qs.toString()}` : "/products";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const categories = await getCategories();
  const filtersFromUrl = parseFilters(await searchParams);

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {filtersFromUrl.category
            ? `${formatCategoryLabel(String(filtersFromUrl.category))} Products`
            : "All Products"}
        </h1>
        <p className={styles.subtitle}>
          {filtersFromUrl.search
            ? `Results for "${filtersFromUrl.search}"`
            : "Browse the catalog and add favorites to your cart."}
        </p>
      </header>

      <ProductFilters categories={categories} />

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductsResults searchParams={searchParams} />
      </Suspense>

      <RecommendedProducts />
    </div>
  );
}

async function ProductsResults({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const filters = parseFilters(await searchParams);
  const all = await getAllProducts();
  const products = applyFilters(all, filters);

  if (products.length === 0) {
    return <EmptyResults />;
  }
  return <ProductGrid products={products} />;
}
