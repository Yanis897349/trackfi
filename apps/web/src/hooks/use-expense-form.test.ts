import type { FormEvent } from "react"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Expense, ExpenseInput } from "../lib/expenses"
import { useExpenseForm } from "./use-expense-form"

const expense: Expense = {
  id: "expense-id",
  name: "Rent",
  amountMinor: 120_000,
  scheduleType: "scheduled",
  cadence: "monthly",
  expenseAnchor: "2024-01-31",
  nextExpenseDate: "2026-08-31",
  category: "housing",
  notes: null,
  status: "active",
  monthlyEquivalentMinor: 120_000,
  annualEquivalentMinor: 1_440_000,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

describe("useExpenseForm", () => {
  it("preserves the historical anchor when the schedule is unchanged", () => {
    const submissions: ExpenseInput[] = []
    const { result } = renderHook(() =>
      useExpenseForm({
        currency: "EUR",
        expense,
        onSubmit: (input) => submissions.push(input),
      })
    )

    act(() => result.current.submit(submitEvent()))

    expect(submissions[0]?.expenseAnchor).toBe("2024-01-31")
  })

  it("uses the displayed occurrence when the cadence changes", () => {
    const submissions: ExpenseInput[] = []
    const { result } = renderHook(() =>
      useExpenseForm({
        currency: "EUR",
        expense,
        onSubmit: (input) => submissions.push(input),
      })
    )

    act(() => result.current.setValue("cadence", "yearly"))
    act(() => result.current.submit(submitEvent()))

    expect(submissions[0]).toMatchObject({
      cadence: "yearly",
      expenseAnchor: "2026-08-31",
    })
  })

  it("preserves an elapsed one-time expense date", () => {
    const submissions: ExpenseInput[] = []
    const { result } = renderHook(() =>
      useExpenseForm({
        currency: "EUR",
        expense: {
          ...expense,
          cadence: "once",
          nextExpenseDate: null,
          monthlyEquivalentMinor: 0,
          annualEquivalentMinor: 0,
        },
        onSubmit: (input) => submissions.push(input),
      })
    )

    expect(result.current.values.expenseAnchor).toBe("2024-01-31")
    act(() => result.current.submit(submitEvent()))
    expect(submissions[0]?.expenseAnchor).toBe("2024-01-31")
  })
})

function submitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as FormEvent<HTMLFormElement>
}
