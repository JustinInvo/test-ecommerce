"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "../store/cart.store";

/**
 * Bridge between SSR-rendered shell and persisted client cart.
 *
 * `useCartStore` is configured with `skipHydration: true`, so on first paint
 * the store contains its initial state (empty cart). We rehydrate from
 * localStorage *after* mount, then flip a flag so consumers can render the
 * real count without producing a hydration mismatch warning.
 */
export function useCartHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    useCartStore.persist.rehydrate();
    // If the store was already hydrated (e.g., HMR), reflect immediately.
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
