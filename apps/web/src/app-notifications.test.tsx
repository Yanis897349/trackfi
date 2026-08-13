import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, notificationFixture, sessionFor } from "./test/mock-api"

describe("Trackfi notifications", () => {
  it("shows unread alerts in the shell inbox and marks one as read", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      notifications: [
        notificationFixture(),
        notificationFixture({
          id: "limit-id",
          type: "expense_budget_limit",
          title: "Budget limit reached",
          context: {
            spentMinor: 100_000,
            budgetMinor: 100_000,
            currency: "EUR",
            thresholdPercent: 100,
          },
        }),
      ],
    })
    const { queryClient, router } = createTestRouter("/dashboard")
    render(<App queryClient={queryClient} router={router} />)

    fireEvent.click(
      await screen.findByRole("button", { name: "2 unread notifications" })
    )
    expect(await screen.findByText("Approaching budget")).toBeInTheDocument()
    expect(screen.getByText("Budget limit reached")).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole("button", { name: "Mark as read" })[0]!)

    await waitFor(() =>
      expect(
        requests.some(
          ({ method, url }) =>
            method === "PATCH" && url.includes("/notifications/")
        )
      ).toBe(true)
    )
  })

  it("renders the filterable notification history outside module navigation", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      notifications: [notificationFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/notifications")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Notification history" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Search notifications")).toBeInTheDocument()
    expect(await screen.findByText("Approaching budget")).toBeInTheDocument()
    expect(screen.getAllByText("Unread").length).toBeGreaterThan(0)
    expect(
      screen.queryByText("Notification history", { selector: "a" })
    ).not.toBeInTheDocument()
  })

  it("shows loading and empty history states", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      deferUrl: "/api/notifications?",
    })
    const loading = createTestRouter("/dashboard/notifications")
    const { unmount } = render(
      <App queryClient={loading.queryClient} router={loading.router} />
    )
    expect(
      await screen.findByRole("status", { name: "Loading notifications" })
    ).toBeInTheDocument()
    unmount()

    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const empty = createTestRouter("/dashboard/notifications")
    render(<App queryClient={empty.queryClient} router={empty.router} />)
    expect(await screen.findByText("No notifications yet")).toBeInTheDocument()
  })
})
