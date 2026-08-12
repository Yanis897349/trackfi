import type { FormEvent } from "react"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Expense, ExpenseInput } from "../lib/expenses"
import { useExpenseForm } from "./use-expense-form"

const expense: Expense = {
  id: "expense-id",
  merchant: "Rent",
  amountMinor: 120_000,
  transactionDate: "2026-08-01",
  category: "housing",
  status: "approved",
  reimbursable: false,
  notes: null,
  receipt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
}

describe("useExpenseForm", () => {
  it("submits canonical transaction fields", () => {
    const submissions: ExpenseInput[] = []
    const { result } = renderHook(() =>
      useExpenseForm({
        currency: "EUR",
        expense,
        onSubmit: (input) => submissions.push(input),
      })
    )
    act(() => result.current.setValue("status", "declined"))
    act(() => result.current.submit(submitEvent()))
    expect(submissions[0]).toMatchObject({
      merchant: "Rent",
      amountMinor: 120_000,
      transactionDate: "2026-08-01",
      status: "declined",
    })
  })

  it("marks an existing receipt for removal", () => {
    const submissions: ExpenseInput[] = []
    const { result } = renderHook(() =>
      useExpenseForm({
        currency: "EUR",
        expense: {
          ...expense,
          receipt: {
            name: "rent.pdf",
            contentType: "application/pdf",
            size: 128,
            url: "/api/expenses/expense-id/receipt",
          },
        },
        onSubmit: (input) => submissions.push(input),
      })
    )
    act(() => result.current.setRemoveReceipt(true))
    act(() => result.current.submit(submitEvent()))
    expect(submissions[0]?.removeReceipt).toBe(true)
  })
})

function submitEvent() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
}
