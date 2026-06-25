import { describe, it, expect, beforeEach } from "vitest";
import { useVisitedStore } from "./visited.store";

beforeEach(() => {
  useVisitedStore.setState({ visits: {} });
});

describe("visited.store", () => {
  it("requires at least 2 visits to recommend (avoid noise on a stray click)", () => {
    useVisitedStore.getState().recordVisit("electronics");
    expect(useVisitedStore.getState().topCategory()).toBeNull();
    useVisitedStore.getState().recordVisit("electronics");
    expect(useVisitedStore.getState().topCategory()).toBe("electronics");
  });

  it("ignores empty/whitespace and is case-insensitive", () => {
    useVisitedStore.getState().recordVisit("   ");
    useVisitedStore.getState().recordVisit("ELECTRONICS");
    useVisitedStore.getState().recordVisit("electronics");
    expect(useVisitedStore.getState().topCategory()).toBe("electronics");
  });

  it("picks the most-visited when there are several", () => {
    const { recordVisit } = useVisitedStore.getState();
    recordVisit("jewelery");
    recordVisit("jewelery");
    recordVisit("electronics");
    recordVisit("electronics");
    recordVisit("electronics");
    expect(useVisitedStore.getState().topCategory()).toBe("electronics");
  });
});
