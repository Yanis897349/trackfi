import { describe, expect, it } from "vitest"

import {
  annualEquivalentMinor,
  nextRenewalDate,
  renewalDatesInRange,
} from "../src/subscriptions"
import {
  addDateOnlyDays,
  isDateOnly,
  subtractUtcCalendarMonth,
} from "../src/date"
import {
  nextRevenuePaymentDate,
  revenueAnnualEquivalentMinor,
  revenueForecast,
  revenueMonthlyEquivalentMinor,
  revenuePaymentDatesInRange,
} from "../src/revenue"

describe("subscription calculations", () => {
  it("validates real calendar dates", () => {
    expect(isDateOnly("2024-02-29")).toBe(true)
    expect(isDateOnly("2023-02-29")).toBe(false)
    expect(isDateOnly("02/29/2024")).toBe(false)
  })

  it("advances weekly anchors in seven-day increments", () => {
    expect(nextRenewalDate("2024-01-01", "weekly", "2024-01-10")).toBe(
      "2024-01-15"
    )
  })

  it("preserves end-of-month and leap-day anchors", () => {
    expect(nextRenewalDate("2024-01-31", "monthly", "2024-02-01")).toBe(
      "2024-02-29"
    )
    expect(nextRenewalDate("2024-02-29", "yearly", "2025-01-01")).toBe(
      "2025-02-28"
    )
  })

  it("supports every calendar cadence without permanent date drift", () => {
    expect(nextRenewalDate("2024-01-30", "monthly", "2024-03-01")).toBe(
      "2024-03-30"
    )
    expect(nextRenewalDate("2024-01-15", "quarterly", "2024-02-01")).toBe(
      "2024-04-15"
    )
    expect(nextRenewalDate("2024-01-15", "semiannual", "2024-08-01")).toBe(
      "2025-01-15"
    )
    expect(nextRenewalDate("2024-01-15", "yearly", "2025-01-15")).toBe(
      "2025-01-15"
    )
  })

  it("normalizes annual totals using cadence multipliers", () => {
    expect(
      annualEquivalentMinor([
        { amountMinor: 100, cadence: "weekly" },
        { amountMinor: 100, cadence: "monthly" },
        { amountMinor: 100, cadence: "quarterly" },
        { amountMinor: 100, cadence: "semiannual" },
        { amountMinor: 100, cadence: "yearly" },
      ])
    ).toBe(7100)
    expect(addDateOnlyDays("2024-02-01", 30)).toBe("2024-03-02")
  })

  it("enumerates every renewal inside an inclusive range", () => {
    expect(
      renewalDatesInRange("2024-08-31", "weekly", "2024-08-26", "2024-10-06")
    ).toEqual([
      "2024-08-31",
      "2024-09-07",
      "2024-09-14",
      "2024-09-21",
      "2024-09-28",
      "2024-10-05",
    ])
  })

  it("subtracts one UTC calendar month with end-of-month clamping", () => {
    expect(
      subtractUtcCalendarMonth(
        new Date("2024-03-31T12:30:00.000Z")
      ).toISOString()
    ).toBe("2024-02-29T12:30:00.000Z")
  })

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
