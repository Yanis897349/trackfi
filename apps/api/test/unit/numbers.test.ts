import { describe, expect, it } from "vitest"

import { percentageChange, sumBy } from "../../src/numbers"

describe("numeric utilities", () => {
  it("sums values selected from records", () => {
    expect(
      sumBy([{ amount: 120 }, { amount: -20 }], (item) => item.amount)
    ).toBe(100)
  })

  it("calculates rounded percentage changes against the previous magnitude", () => {
    expect(percentageChange(125, 100, 1)).toBe(25)
    expect(percentageChange(-75, -100, 1)).toBe(25)
    expect(percentageChange(100, 0, 1)).toBeNull()
  })
})
