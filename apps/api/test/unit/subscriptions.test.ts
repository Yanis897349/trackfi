import { describe, expect, it } from "vitest"

import {
  annualEquivalentMinor,
  nextRenewalDate,
  renewalDatesInRange,
} from "../../src/subscriptions"

describe("subscription calculations", () => {
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
})
