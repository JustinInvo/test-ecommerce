"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Persisted store of category visit counts. Drives the "Recommended For You"
 * section. Mirrors the implicit signal that drives Promart-style retargeting:
 * users who view several PDPs in one category are clearly interested in it.
 *
 *  - Counts decay implicitly via the 30-visit window (older visits drop off
 *    when we cap stored events at MAX_EVENTS - keeps localStorage tiny).
 *  - `topCategory()` returns the most-visited category ignoring ties beyond
 *    a 2-visit minimum (don't recommend on a single accidental click).
 */

interface VisitedState {
  visits: Record<string, number>;
  recordVisit: (category: string) => void;
  topCategory: () => string | null;
  reset: () => void;
}

const STORAGE_KEY = "fakestore:visited:v1";
const MIN_VISITS_FOR_RECOMMENDATION = 2;

export const useVisitedStore = create<VisitedState>()(
  persist(
    (set, get) => ({
      visits: {},

      recordVisit: (category) =>
        set((state) => {
          const cleaned = category.trim().toLowerCase();
          if (!cleaned) return state;
          const next = { ...state.visits };
          next[cleaned] = (next[cleaned] ?? 0) + 1;
          return { visits: next };
        }),

      topCategory: () => {
        const visits = get().visits as Record<string, number>;
        const entries: [string, number][] = Object.entries(visits);
        if (entries.length === 0) return null;
        const [top] = entries.sort((a, b) => b[1] - a[1]);
        if (!top || top[1] < MIN_VISITS_FOR_RECOMMENDATION) return null;
        return top[0];
      },

      reset: () => set({ visits: {} }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ visits: state.visits }),
    },
  ),
);
