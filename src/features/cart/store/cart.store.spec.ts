import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, selectCartCount } from "./cart.store";

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cart.store", () => {
  it("addItem inserts a new line with qty 1 by default", () => {
    useCartStore.getState().addItem(1);
    expect(useCartStore.getState().items).toEqual([{ id: 1, quantity: 1 }]);
  });

  it("addItem on an existing id increments the quantity (capped at 99)", () => {
    const { addItem } = useCartStore.getState();
    addItem(1, 50);
    addItem(1, 60);
    expect(useCartStore.getState().items[0]?.quantity).toBe(99);
  });

  it("updateQuantity removes the line when qty goes to 0", () => {
    useCartStore.getState().addItem(7, 3);
    useCartStore.getState().updateQuantity(7, 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("updateQuantity clamps to 99", () => {
    useCartStore.getState().addItem(2, 1);
    useCartStore.getState().updateQuantity(2, 999);
    expect(useCartStore.getState().items[0]?.quantity).toBe(99);
  });

  it("removeItem deletes by id", () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem(1);
    addItem(2);
    removeItem(1);
    expect(useCartStore.getState().items.map((i) => i.id)).toEqual([2]);
  });

  it("clearCart empties items", () => {
    useCartStore.getState().addItem(1);
    useCartStore.getState().addItem(2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("selectCartCount sums quantities", () => {
    useCartStore.getState().addItem(1, 2);
    useCartStore.getState().addItem(2, 3);
    expect(selectCartCount(useCartStore.getState())).toBe(5);
  });
});
