"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllProductsClient } from "../services/products.client.service";
import type { Product } from "../types/product";

/**
 * useProducts - client-side product fetching hook.
 *
 * Responsibilities (SRP):
 *  - own loading / error / data state for the products list;
 *  - cancel in-flight requests on unmount via AbortController;
 *  - expose a `retry` callback that bumps an internal nonce so the effect
 *    runs again. This is exactly what fixed the cart-retry bug previously.
 *
 * Why not a global cache library: the client side has two consumers (cart,
 * recommendations) and `force-cache` on the fetch means the browser already
 * de-dupes the underlying network call. A library would be overkill.
 */
export interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    fetchAllProductsClient(ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setProducts(data);
      })
      .catch((err: Error) => {
        if (ctrl.signal.aborted) return;
        setError(err);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [retryNonce]);

  return useMemo(
    () => ({
      products,
      isLoading,
      error,
      retry: () => setRetryNonce((n) => n + 1),
    }),
    [products, isLoading, error],
  );
}
