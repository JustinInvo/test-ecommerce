import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCartButton } from "./AddToCartButton";
import { useCartStore, selectCartCount } from "../../store/cart.store";

// next/link / next/image are fine in jsdom but next/dynamic isn't used here.
// We *do* mock the controlled-hydration hook so the button isn't disabled in
// the test environment.
vi.mock("../../hooks/useCartHydration", () => ({
  useCartHydration: () => true,
}));

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("AddToCartButton (integration with cart store)", () => {
  it("clicking 'Add to cart' increments the cart count by chosen qty", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton productId={42} />);

    // Bump qty to 3 then add to cart.
    const inc = screen.getByRole("button", { name: /increase quantity/i });
    await user.click(inc);
    await user.click(inc);

    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(useCartStore.getState().items).toEqual([
      { id: 42, quantity: 3 },
    ]);
    expect(selectCartCount(useCartStore.getState())).toBe(3);

    // The button shows a confirmation label briefly.
    expect(
      await screen.findByRole("button", { name: /added/i }),
    ).toBeInTheDocument();
  });

  it("adding the same product twice merges quantities", async () => {
    const user = userEvent.setup();
    render(<AddToCartButton productId={7} />);

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("button", { name: /add to cart|added/i }));

    expect(useCartStore.getState().items).toEqual([
      { id: 7, quantity: 2 },
    ]);
  });
});
