import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { DashboardActivity } from "../lib/dashboard"
import { DashboardActivityStatus } from "./dashboard-activity-parts"

const baseActivity: DashboardActivity = {
  id: "activity-id",
  sourceId: "source-id",
  date: "2026-08-13",
  label: "Activity",
  module: "expenses",
  direction: "out",
  amountMinor: 1_000,
  status: "approved",
}

describe("DashboardActivityStatus", () => {
  it.each([
    ["approved expense", {}, "Approved", "bg-[#F6F6F4]", "text-[#FF7A00]"],
    [
      "pending expense",
      { status: "pending" },
      "Pending",
      "bg-[#F6F6F4]",
      "text-[#FF7A00]",
    ],
    [
      "renewal",
      { module: "subscriptions", status: "scheduled" },
      "Auto-renew",
      "bg-[#F6F6F4]",
      "text-[#111111]",
    ],
    [
      "scheduled revenue",
      { module: "revenue", direction: "in", status: "scheduled" },
      "Scheduled",
      "bg-[#E7FAF3]",
      "text-[#00A876]",
    ],
  ] as const)(
    "uses the Pencil table palette for %s",
    (_name, overrides, label, background, foreground) => {
      render(
        <DashboardActivityStatus
          activity={{ ...baseActivity, ...overrides } as DashboardActivity}
        />
      )

      const badge = screen.getByText(label)
      expect(badge).toHaveClass(background, foreground)
      expect(badge).toHaveClass("h-6", "rounded-md", "px-2", "text-[10px]")
    }
  )
})
