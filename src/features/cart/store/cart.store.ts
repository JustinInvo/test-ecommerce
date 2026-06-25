"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "../types/cart";

/**
 * Cart store.
 *
 * Design notes:
 *
 *  - Zustand is preferred over Context+Reducer because selectors avoid the
 *    "every consumer re-renders on every state change" trap. The header
 *    counter, for instance, subscribes only to `items.length` via a selector.
 *
 *  - `persist` middleware keeps the cart between refreshes (and tabs, modulo
 *    storage events). Versioned `name` lets us migrate future schemas.
 *
 *  - State only contains `{id, quantity}` pairs (see types/cart.ts). Adding a
 *    product just bumps quantity if it already exists — idempotent.
 *
 *  - All mutations are atomic and immutable (no in-place array mutation), so
 *    React + Zustand can shallow-compare and skip unaffected components.
 *
 *  - `skipHydration: true` lets us control SSR/CSR hydration ourselves via
 *    `useCartHydration()`. This prevents the dreaded "Hydration mismatch"
 *    when the persisted client cart differs from the server-rendered shell.
 */

interface CartState {
  items: CartItem[];
  addItem: (id: number, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "fakestore:cart:v1";

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (id, quantity = 1) =>
        set((state) => {
          const safeQty = Math.max(1, Math.min(99, Math.floor(quantity)));
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id
                  ? { ...i, quantity: Math.min(99, i.quantity + safeQty) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { id, quantity: safeQty }] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          const q = Math.floor(quantity);
          if (q <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          const next = Math.min(99, q);
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity: next } : i,
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // We hydrate explicitly via useCartHydration() to avoid SSR/CSR drift.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Stable selector for total quantity of items in cart (sum of qty). */
export const selectCartCount = (state: CartState): number =>
  state.items.reduce((acc, item) => acc + item.quantity, 0);
