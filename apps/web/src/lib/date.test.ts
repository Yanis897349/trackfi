import { describe, expect, it } from "vitest"

import { dateOnlyGroupLabel } from "./date"

describe("date-only group labels", () => {
  it("labels today, yesterday, and older dates in UTC", () => {
    const labels = { today: "Today", yesterday: "Yesterday" }
    const now = new Date("2026-08-13T23:30:00.000Z")

    expect(dateOnlyGroupLabel("2026-08-13", labels, now).relative).toBe("Today")
    expect(dateOnlyGroupLabel("2026-08-12", labels, now).relative).toBe(
      "Yesterday"
    )
    expect(dateOnlyGroupLabel("2026-08-11", labels, now).relative).toBeNull()
  })
})
