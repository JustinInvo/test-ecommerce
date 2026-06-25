import { describe, it, expect } from "vitest";
import { recommendByCategory } from "./recommend";
import { asCategory, type Product } from "@/features/products/types/product";

const p = (id: number, category: string, price = 10): Product => ({
  id,
  title: `P${id}`,
  description: "",
  price,
  category: asCategory(category),
  image: "https://example.com/x.jpg",
  rating: { rate: 4, count: 1 },
});

const catalog: Product[] = [
  p(1, "electronics"),
  p(2, "electronics"),
  p(3, "electronics"),
  p(4, "jewelery"),
  p(5, "jewelery"),
];

describe("recommendByCategory", () => {
  it("returns [] when there is no top category", () => {
    expect(recommendByCategory(catalog, null)).toEqual([]);
  });

  it("returns up to `limit` items matching the top category", () => {
    const out = recommendByCategory(catalog, "electronics", { limit: 2 });
    expect(out.map((x) => x.id)).toEqual([1, 2]);
  });

  it("excludes a specific id", () => {
    const out = recommendByCategory(catalog, "electronics", { excludeId: 1 });
    expect(out.map((x) => x.id)).toEqual([2, 3]);
  });

  it("is case-insensitive on category", () => {
    const out = recommendByCategory(catalog, "ELECTRONICS");
    expect(out.length).toBe(3);
  });
});
