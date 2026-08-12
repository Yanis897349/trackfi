import { describe, expect, it } from "vitest"

import {
  expenseAnnualEquivalentMinor,
  expenseDatesInRange,
  expenseForecast,
  nextExpenseDate,
} from "../../src/expenses"

describe("expense calculations", () => {
  it("forecasts scheduled, one-time, and flexible expenses", () => {
    expect(nextExpenseDate("2024-02-10", "once", "2024-02-11")).toBeNull()
    expect(
      expenseDatesInRange("2024-01-01", "biweekly", "2024-01-01", "2024-01-31")
    ).toEqual(["2024-01-01", "2024-01-15", "2024-01-29"])
    expect(
      expenseAnnualEquivalentMinor({
        amountMinor: 100,
        scheduleType: "variable",
        cadence: null,
      })
    ).toBe(1200)
    expect(
      expenseForecast(
        [
          {
            amountMinor: 1000,
            scheduleType: "scheduled",
            cadence: "monthly",
            expenseAnchor: "2024-01-31",
          },
          {
            amountMinor: 500,
            scheduleType: "variable",
            cadence: null,
            expenseAnchor: null,
          },
          {
            amountMinor: 200,
            scheduleType: "scheduled",
            cadence: "once",
            expenseAnchor: "2024-02-10",
          },
        ],
        "2024-01-20",
        3
      )
    ).toEqual({
      months: 3,
      totalMinor: 4700,
      previousMonthMinor: 500,
      averageMonthlyMinor: 1567,
      series: [
        { month: "2024-01", amountMinor: 1500 },
        { month: "2024-02", amountMinor: 1700 },
        { month: "2024-03", amountMinor: 1500 },
      ],
    })
  })
})
