"use client";

import { useRecordVisit } from "../../hooks/useRecordVisit";

/**
 * Render-prop-free side-effect island used inside Server Components.
 * Increments the visited category counter exactly once per mount.
 */
export function RecordVisit({ category }: { category: string }) {
  useRecordVisit(category);
  return null;
}
