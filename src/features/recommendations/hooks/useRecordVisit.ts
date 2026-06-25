"use client";

import { useEffect } from "react";
import { useVisitedStore } from "../store/visited.store";

/**
 * Side-effect: record a category visit exactly once per mount.
 *
 * Use on the PDP. Strict-mode double-invoke is acceptable here because each
 * call increments by 1; a one-off duplicate inflation is irrelevant to the
 * "top category" computation. Keeping the effect free of guards keeps the
 * hook simple and dependable.
 */
export function useRecordVisit(category: string | undefined): void {
  useEffect(() => {
    if (!category) return;
    // Make sure store is hydrated before mutating so we accumulate rather than
    // overwrite the persisted state on first render.
    useVisitedStore.persist.rehydrate();
    useVisitedStore.getState().recordVisit(category);
  }, [category]);
}
