import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatCategoryLabel,
  clamp,
  truncate,
} from "./format";

describe("format.formatPrice", () => {
  it("renders USD with 2 decimals", () => {
    expect(formatPrice(9.5)).toMatch(/\$9\.50/);
    expect(formatPrice(1000)).toMatch(/\$1,000\.00/);
  });
});

describe("format.formatCategoryLabel", () => {
  it("title-cases each word", () => {
    expect(formatCategoryLabel("men's clothing")).toBe("Men's Clothing");
    expect(formatCategoryLabel("electronics")).toBe("Electronics");
  });
});

describe("format.clamp", () => {
  it("clamps below, above, within", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("format.truncate", () => {
  it("returns original if short", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });
  it("cuts at a word boundary when possible", () => {
    const out = truncate("this is a slightly longer sentence", 20);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(20);
  });
});
