import { describe, expect, it } from "vitest"

import {
  monthlyComparisonLabel,
  type SubscriptionSummary,
} from "./subscriptions"

describe("monthlyComparisonLabel", () => {
  it.each([
    [1200, 1000, "+20% vs last month"],
    [800, 1000, "−20% vs last month"],
    [1004, 1000, "No change vs last month"],
    [1000, 0, "New since last month"],
    [0, 0, "No change vs last month"],
  ])(
    "formats a %d current and %d previous commitment",
    (monthlyEquivalentMinor, previousMonthlyEquivalentMinor, expected) => {
      expect(
        monthlyComparisonLabel(
          summary({
            monthlyEquivalentMinor,
            monthlyComparison: { previousMonthlyEquivalentMinor },
          })
        )
      ).toBe(expected)
    }
  )

  it("tracks changes until a trustworthy baseline exists", () => {
    expect(monthlyComparisonLabel(summary())).toBe("Tracking changes")
  })
})

function summary(
  overrides: Partial<SubscriptionSummary> = {}
): SubscriptionSummary {
  return {
    currency: "USD",
    activeCount: 0,
    pausedCount: 0,
    activeCategoryCount: 0,
    monthlyEquivalentMinor: 0,
    annualEquivalentMinor: 0,
    upcomingCount: 0,
    upcomingTotalMinor: 0,
    upcoming: [],
    monthlyComparison: null,
    ...overrides,
  }
}
