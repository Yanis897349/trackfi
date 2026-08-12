import { describe, expect, it } from "vitest"

import {
  nextRevenuePaymentDate,
  revenueAnnualEquivalentMinor,
  revenueForecast,
  revenueMonthlyEquivalentMinor,
  revenuePaymentDatesInRange,
} from "../../src/revenue"

describe("revenue calculations", () => {
  it("normalizes scheduled and variable revenue forecasts", () => {
    expect(
      revenueAnnualEquivalentMinor({
        amountMinor: 100,
        scheduleType: "scheduled",
        cadence: "biweekly",
      })
    ).toBe(2600)
    expect(
      revenueMonthlyEquivalentMinor({
        amountMinor: 100,
        scheduleType: "variable",
        cadence: null,
      })
    ).toBe(100)
  })

  it("forecasts biweekly revenue and preserves calendar anchors", () => {
    expect(nextRevenuePaymentDate("2024-01-01", "biweekly", "2024-01-16")).toBe(
      "2024-01-29"
    )
    expect(
      revenuePaymentDatesInRange(
        "2024-01-01",
        "biweekly",
        "2024-01-01",
        "2024-01-31"
      )
    ).toEqual(["2024-01-01", "2024-01-15", "2024-01-29"])
    expect(nextRevenuePaymentDate("2024-01-31", "monthly", "2024-02-01")).toBe(
      "2024-02-29"
    )
  })

  it("includes one-time revenue only on its payment date", () => {
    expect(nextRevenuePaymentDate("2024-02-10", "once", "2024-02-01")).toBe(
      "2024-02-10"
    )
    expect(
      nextRevenuePaymentDate("2024-02-10", "once", "2024-02-11")
    ).toBeNull()
    expect(
      revenuePaymentDatesInRange(
        "2024-02-10",
        "once",
        "2024-02-01",
        "2024-02-29"
      )
    ).toEqual(["2024-02-10"])
    expect(
      revenuePaymentDatesInRange(
        "2024-02-10",
        "once",
        "2024-03-01",
        "2024-03-31"
      )
    ).toEqual([])
    expect(
      revenueAnnualEquivalentMinor({
        amountMinor: 1200,
        scheduleType: "scheduled",
        cadence: "once",
      })
    ).toBe(1200)
  })

  it("forecasts complete calendar months across year boundaries", () => {
    expect(
      revenueForecast(
        [
          {
            amountMinor: 100,
            scheduleType: "scheduled",
            cadence: "weekly",
            paymentAnchor: "2024-12-02",
          },
          {
            amountMinor: 250,
            scheduleType: "scheduled",
            cadence: "monthly",
            paymentAnchor: "2024-01-31",
          },
          {
            amountMinor: 75,
            scheduleType: "variable",
            cadence: null,
            paymentAnchor: null,
          },
          {
            amountMinor: 500,
            scheduleType: "scheduled",
            cadence: "once",
            paymentAnchor: "2025-01-10",
          },
        ],
        "2024-12-20",
        3
      )
    ).toEqual({
      months: 3,
      totalMinor: 2775,
      previousMonthMinor: 325,
      series: [
        { month: "2024-12", amountMinor: 825 },
        { month: "2025-01", amountMinor: 1225 },
        { month: "2025-02", amountMinor: 725 },
      ],
    })
  })

  it("returns a zero previous-month projection when income starts later", () => {
    expect(
      revenueForecast(
        [
          {
            amountMinor: 500,
            scheduleType: "scheduled",
            cadence: "monthly",
            paymentAnchor: "2025-01-15",
          },
        ],
        "2025-01-20",
        6
      ).previousMonthMinor
    ).toBe(0)
  })
})
