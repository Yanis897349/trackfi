import { describe, expect, it } from "vitest"

import {
  dashboardChartColors,
  dashboardMovementColor,
} from "./dashboard-colors"

describe("dashboard chart colors", () => {
  it("uses the standard Expenses color for every negative movement", () => {
    expect(dashboardMovementColor(-1_000, 6, 7)).toBe(
      dashboardChartColors.expenses
    )
  })

  it("highlights the latest positive bucket with the Revenue color", () => {
    expect(dashboardMovementColor(1_000, 6, 7)).toBe(
      dashboardChartColors.revenue
    )
    expect(dashboardMovementColor(1_000, 5, 7)).toBe(
      dashboardChartColors.neutral
    )
  })
})
