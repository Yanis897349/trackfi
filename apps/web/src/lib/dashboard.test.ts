import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { invalidateDashboardQueries } from "./dashboard"

describe("dashboard queries", () => {
  it("invalidates overview and calendar data together", async () => {
    const queryClient = new QueryClient()
    const overviewKey = ["dashboard-overview", "2026-08-01", "2026-08-31", 1]
    const calendarKey = ["dashboard-calendar", "2026-08"]
    queryClient.setQueryData(overviewKey, { overview: {} })
    queryClient.setQueryData(calendarKey, { calendar: {} })

    await invalidateDashboardQueries(queryClient)

    expect(queryClient.getQueryState(overviewKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(calendarKey)?.isInvalidated).toBe(true)
  })
})
