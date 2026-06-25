import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters } from "./ProductFilters";
import { asCategory } from "@/features/products/types/product";

// In-memory mock router that records URL replacements.
const replaced: string[] = [];
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: (url: string) => {
      replaced.push(url);
      const q = url.split("?")[1] ?? "";
      currentSearch = q;
    },
  }),
  usePathname: () => "/products",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

beforeEach(() => {
  replaced.length = 0;
  currentSearch = "";
});

describe("<ProductFilters /> URL sync (integration)", () => {
  it("selecting a category writes ?category=… to the URL", async () => {
    const user = userEvent.setup();
    render(
      <ProductFilters
        categories={[asCategory("electronics"), asCategory("jewelery")]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /electronics/i }));
    expect(replaced.at(-1)).toBe("/products?category=electronics");
  });

  it("changing the sort writes ?sort=asc", async () => {
    const user = userEvent.setup();
    render(<ProductFilters categories={[asCategory("electronics")]} />);
    await user.selectOptions(
      screen.getByLabelText(/sort/i),
      "asc",
    );
    expect(replaced.at(-1)).toBe("/products?sort=asc");
  });

  it("typing in the search debounces and writes ?search=…", async () => {
    const user = userEvent.setup();
    render(<ProductFilters categories={[asCategory("electronics")]} />);
    await user.type(screen.getByPlaceholderText(/search products/i), "phone");
    // Wait for the 300ms debounce.
    await new Promise((r) => setTimeout(r, 400));
    expect(replaced.at(-1)).toBe("/products?search=phone");
  });
});
