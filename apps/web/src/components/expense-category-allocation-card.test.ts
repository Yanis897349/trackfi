import { describe, expect, it } from "vitest"

import {
  expenseCategoryAllocationEntries,
  type ExpenseSummary,
} from "../lib/expenses"

describe("categoryEntries", () => {
  it("merges the rollup into an existing leading other category", () => {
    const entries = expenseCategoryAllocationEntries({
      categoryBreakdown: [
        { category: "other", totalMinor: 400 },
        { category: "housing", totalMinor: 300 },
        { category: "food", totalMinor: 200 },
        { category: "travel", totalMinor: 100 },
        { category: "health", totalMinor: 50 },
      ],
    } as ExpenseSummary)

    expect(entries).toEqual([
      { category: "other", totalMinor: 550 },
      { category: "housing", totalMinor: 300 },
      { category: "food", totalMinor: 200 },
    ])
  })
})
