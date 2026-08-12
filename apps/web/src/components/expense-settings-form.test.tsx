import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ExpenseSettings } from "../lib/expenses"
import { ExpenseSettingsForm } from "./expense-settings-form"

const settings: ExpenseSettings = {
  monthlyBudgetMinor: 500_000,
  dailyTargetMinor: 8_000,
  budgetPeriod: "monthly",
  resetDay: 1,
  rolloverEnabled: false,
  approachingThreshold: 80,
  limitThreshold: 100,
  updatedAt: null,
}

describe("ExpenseSettingsForm", () => {
  it("allows optional budget targets to be cleared", () => {
    const onSave = vi.fn()
    const { container } = render(
      <ExpenseSettingsForm
        currency="EUR"
        settings={settings}
        error=""
        onSave={onSave}
      />
    )

    fireEvent.change(screen.getByLabelText("Monthly budget"), {
      target: { value: "" },
    })
    fireEvent.change(screen.getByLabelText("Daily spending target"), {
      target: { value: "" },
    })
    fireEvent.submit(container.querySelector("form")!)

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyBudgetMinor: null,
        dailyTargetMinor: null,
      })
    )
  })
})
