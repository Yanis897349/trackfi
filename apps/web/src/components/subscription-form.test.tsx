import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Subscription } from "../lib/subscriptions"
import { SubscriptionForm } from "./subscription-form"

const subscription: Subscription = {
  id: "subscription-id",
  name: "Design software",
  amountMinor: 1000,
  cadence: "monthly",
  billingAnchor: "2024-01-30",
  nextRenewalDate: "2024-02-29",
  category: "software",
  websiteUrl: "https://example.com",
  notes: null,
  status: "active",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

describe("SubscriptionForm", () => {
  it("preserves the original renewal anchor until the billing date is edited", () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <SubscriptionForm
        currency="EUR"
        subscription={subscription}
        error=""
        onSubmit={onSubmit}
      />
    )
    const form = container.querySelector("form")!

    fireEvent.submit(form)
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ billingAnchor: "2024-01-30" })
    )

    fireEvent.change(screen.getByLabelText("Next billing date"), {
      target: { value: "2024-03-15" },
    })
    fireEvent.submit(form)
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ billingAnchor: "2024-03-15" })
    )
  })
})
