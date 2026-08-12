import { describe, expect, it } from "vitest"

import {
  addDateOnlyDays,
  isDateOnly,
  subtractUtcCalendarMonth,
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
})
