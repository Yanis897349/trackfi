import { describe, expect, it } from "vitest"

import {
  addDateOnlyDays,
  isDateOnly,
  monthEndDateOnly,
  monthEndDatesInRange,
  subtractUtcCalendarMonth,
  utcIsoTimestampDaysAgo,
  utcIsoWeekStart,
} from "../../src/date"

describe("date calculations", () => {
  it("validates real calendar dates", () => {
    expect(isDateOnly("2024-02-29")).toBe(true)
    expect(isDateOnly("2023-02-29")).toBe(false)
    expect(isDateOnly("02/29/2024")).toBe(false)
    expect(addDateOnlyDays("2024-02-01", 30)).toBe("2024-03-02")
  })

  it("subtracts one UTC calendar month with end-of-month clamping", () => {
    expect(
      subtractUtcCalendarMonth(
        new Date("2024-03-31T12:30:00.000Z")
      ).toISOString()
    ).toBe("2024-02-29T12:30:00.000Z")
  })

  it("calculates month ends within an inclusive range", () => {
    expect(monthEndDateOnly("2024-02-10")).toBe("2024-02-29")
    expect(monthEndDatesInRange("2024-01-31", "2024-03-15")).toEqual([
      "2024-01-31",
      "2024-02-29",
    ])
  })

  it("calculates UTC range cutoffs and ISO-week starts", () => {
    const now = new Date("2026-08-13T12:30:00.000Z")
    expect(utcIsoTimestampDaysAgo(7, now)).toBe("2026-08-06T12:30:00.000Z")
    expect(utcIsoWeekStart(now)).toBe("2026-08-10T00:00:00.000Z")
  })
})
