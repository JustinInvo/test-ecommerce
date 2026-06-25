import { describe, it, expect } from "vitest";
import {
  parseFilters,
  serializeFilters,
  filterByCategory,
  searchProducts,
  sortByPrice,
  applyFilters,
} from "./products.service";
import {
  asCategory,
  type Product,
  type ProductFilters,
} from "../types/product";

const product = (over: Partial<Product> = {}): Product => ({
  id: 1,
  title: "Item",
  price: 10,
  description: "Cool item.",
  category: asCategory("electronics"),
  image: "https://example.com/a.jpg",
  rating: { rate: 4.2, count: 50 },
  ...over,
});

describe("products.service.parseFilters", () => {
  it("returns empty defaults for missing keys", () => {
    const f = parseFilters(new URLSearchParams());
    expect(f).toEqual<ProductFilters>({
      category: null,
      search: "",
      sort: null,
    });
  });

  it("drops invalid sort values", () => {
    const f = parseFilters(new URLSearchParams("sort=banana"));
    expect(f.sort).toBeNull();
  });

  it("accepts asc/desc", () => {
    expect(parseFilters(new URLSearchParams("sort=asc")).sort).toBe("asc");
    expect(parseFilters(new URLSearchParams("sort=desc")).sort).toBe("desc");
  });

  it("trims and caps the search string", () => {
    const long = "  " + "x".repeat(200) + "  ";
    const f = parseFilters(new URLSearchParams(`search=${encodeURIComponent(long)}`));
    expect(f.search.length).toBe(80);
    expect(f.search.startsWith("x")).toBe(true);
  });

  it("reads from a plain object", () => {
    const f = parseFilters({ category: "jewelery", sort: "asc" });
    expect(f.category).toBe("jewelery");
    expect(f.sort).toBe("asc");
  });
});

describe("products.service.serializeFilters", () => {
  it("produces a stable, alphabetically sorted querystring", () => {
    const qs = serializeFilters({
      category: asCategory("electronics"),
      search: "phone",
      sort: "desc",
    });
    expect(qs).toBe("category=electronics&search=phone&sort=desc");
  });

  it("omits empty values", () => {
    expect(serializeFilters({ category: null, search: "", sort: null })).toBe(
      "",
    );
  });
});

describe("products.service.filtering", () => {
  const list: Product[] = [
    product({ id: 1, title: "Phone Pro", price: 800, category: asCategory("electronics") }),
    product({ id: 2, title: "Necklace", price: 50, category: asCategory("jewelery") }),
    product({ id: 3, title: "Headphones", price: 120, category: asCategory("electronics") }),
  ];

  it("filterByCategory: no category returns input", () => {
    expect(filterByCategory(list, null)).toBe(list);
  });

  it("filterByCategory: filters by exact match", () => {
    const out = filterByCategory(list, asCategory("electronics"));
    expect(out.map((p) => p.id)).toEqual([1, 3]);
  });

  it("searchProducts: empty query returns input", () => {
    expect(searchProducts(list, "")).toBe(list);
  });

  it("searchProducts: case-insensitive on title", () => {
    expect(searchProducts(list, "phone").map((p) => p.id)).toEqual([1, 3]);
  });

  it("sortByPrice: asc + desc both work and don't mutate input", () => {
    const asc = sortByPrice(list, "asc");
    const desc = sortByPrice(list, "desc");
    expect(asc.map((p) => p.id)).toEqual([2, 3, 1]);
    expect(desc.map((p) => p.id)).toEqual([1, 3, 2]);
    expect(list.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("applyFilters composes filter + search + sort", () => {
    const out = applyFilters(list, {
      category: asCategory("electronics"),
      search: "ph",
      sort: "asc",
    });
    expect(out.map((p) => p.id)).toEqual([3, 1]);
  });
});
