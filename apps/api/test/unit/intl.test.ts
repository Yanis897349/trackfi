import { describe, expect, it } from "vitest"

import { safeErrorMessage } from "../../src/errors"
import { formatCurrencyMinor, formatDateOnlyRange } from "../../src/intl"

describe("API formatting utilities", () => {
  it("formats minor currency amounts for the requested locale", () => {
    expect(formatCurrencyMinor(123_456, "EUR", "en")).toBe("€1,234.56")
    expect(formatCurrencyMinor(123_456, "EUR", "fr")).toContain("1 234,56")
  })

  it("formats UTC date-only ranges without timezone drift", () => {
    expect(formatDateOnlyRange("2026-08-01", "2026-09-01", "en")).toBe(
      "Aug 1–Sep 1"
    )
  })

  it("bounds provider error details and falls back safely", () => {
    expect(safeErrorMessage(new Error("failure"), "fallback", 4)).toBe("fail")
    expect(safeErrorMessage("failure", "fallback")).toBe("fallback")
  })
})
