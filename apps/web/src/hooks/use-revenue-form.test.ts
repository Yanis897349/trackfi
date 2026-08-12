import type { FormEvent } from "react"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { RevenueSource, RevenueSourceInput } from "../lib/revenue"
import { useRevenueForm } from "./use-revenue-form"

const source: RevenueSource = {
  id: "revenue-source-id",
  name: "Primary job",
  amountMinor: 300_000,
  scheduleType: "scheduled",
  cadence: "monthly",
  paymentAnchor: "2024-01-31",
  nextPaymentDate: "2026-08-31",
  category: "salary",
  notes: null,
  status: "active",
  monthlyEquivalentMinor: 300_000,
  annualEquivalentMinor: 3_600_000,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

describe("useRevenueForm", () => {
  it("uses the displayed next payment date when cadence changes", () => {
    const submissions: RevenueSourceInput[] = []
    const { result } = renderHook(() =>
      useRevenueForm({
        currency: "EUR",
        source,
        onSubmit: (input) => submissions.push(input),
      })
    )

    act(() => result.current.setValue("cadence", "yearly"))
    act(() => result.current.submit(submitEvent()))

    expect(submissions).toHaveLength(1)
    expect(submissions[0]).toMatchObject({
      cadence: "yearly",
      paymentAnchor: "2026-08-31",
    })
  })

  it("preserves the historical anchor when cadence and date are unchanged", () => {
    const submissions: RevenueSourceInput[] = []
    const { result } = renderHook(() =>
      useRevenueForm({
        currency: "EUR",
        source,
        onSubmit: (input) => submissions.push(input),
      })
    )

    act(() => result.current.submit(submitEvent()))

    expect(submissions[0]?.paymentAnchor).toBe("2024-01-31")
  })

  it("preserves the payment date when editing an expired one-time source", () => {
    const submissions: RevenueSourceInput[] = []
    const { result } = renderHook(() =>
      useRevenueForm({
        currency: "EUR",
        source: {
          ...source,
          cadence: "once",
          paymentAnchor: "2024-01-31",
          nextPaymentDate: null,
          monthlyEquivalentMinor: 0,
          annualEquivalentMinor: 0,
        },
        onSubmit: (input) => submissions.push(input),
      })
    )

    expect(result.current.values.paymentAnchor).toBe("2024-01-31")

    act(() => result.current.submit(submitEvent()))

    expect(submissions).toHaveLength(1)
    expect(submissions[0]?.paymentAnchor).toBe("2024-01-31")
  })
})

function submitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as FormEvent<HTMLFormElement>
}
