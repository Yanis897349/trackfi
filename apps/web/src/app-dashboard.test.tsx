import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, sessionFor } from "./test/mock-api"

describe("Trackfi dashboard application", () => {
  it("shows admin navigation to admin users", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("admin"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Financial overview",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("Waitlist approvals")).toBeInTheDocument()
    expect(screen.getByText("Feature flags")).toBeInTheDocument()
    expect(screen.getAllByText("Subscriptions").length).toBeGreaterThan(0)
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("hides admin navigation from regular users", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Financial overview",
      })
    ).toBeInTheDocument()
    expect(screen.queryByText("Waitlist approvals")).not.toBeInTheDocument()
    expect(screen.queryByText("Feature flags")).not.toBeInTheDocument()
    expect(screen.getAllByText("Subscriptions").length).toBeGreaterThan(0)
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("confirms and updates waitlist mode", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("admin"),
      featureFlags: true,
    })
    const { queryClient, router } = createTestRouter("/dashboard/feature-flags")

    render(<App queryClient={queryClient} router={router} />)

    const waitlistSwitch = await screen.findByRole("switch", {
      name: "Waitlist mode",
    })
    await waitFor(() => expect(waitlistSwitch).not.toBeDisabled())
    fireEvent.click(waitlistSwitch)
    expect(
      await screen.findByRole("heading", { name: "Open registration?" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Confirm change" }))

    await waitFor(() =>
      expect(
        requests.some(
          ({ method, url }) =>
            method === "PATCH" && url.includes("/feature-flags/waitlist_mode")
        )
      ).toBe(true)
    )
  })

  it("approves pending waitlist entries", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("admin"),
      waitlistEntries: true,
    })
    const { queryClient, router } = createTestRouter("/dashboard/waitlist")

    render(<App queryClient={queryClient} router={router} />)

    fireEvent.click(await screen.findByRole("button", { name: "Approve" }))

    await waitFor(() =>
      expect(
        requests.some(
          ({ method, url }) =>
            method === "POST" && url.endsWith("/entry-id/approve")
        )
      ).toBe(true)
    )
  })

  it("offers sign-out from the current-user footer", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("button", { name: "Sign out" })
    ).toBeInTheDocument()
    expect(screen.getByText("Regular User")).toBeInTheDocument()
    expect(screen.getByText("user@example.com")).toBeInTheDocument()
  })

  it("uses contextual skeletons for admin data", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("admin"),
      deferUrl: "/api/admin/feature-flags",
    })
    const featureFlags = createTestRouter("/dashboard/feature-flags")

    const { unmount } = render(
      <App
        queryClient={featureFlags.queryClient}
        router={featureFlags.router}
      />
    )

    expect(
      await screen.findByRole("status", { name: "Loading feature flags" })
    ).toBeInTheDocument()
    unmount()

    mockApi({
      waitlistMode: true,
      session: sessionFor("admin"),
      deferUrl: "/api/admin/waitlist",
    })
    const waitlist = createTestRouter("/dashboard/waitlist")
    render(<App queryClient={waitlist.queryClient} router={waitlist.router} />)

    expect(
      await screen.findByRole("status", { name: "Loading waitlist" })
    ).toBeInTheDocument()
    expect(screen.queryByText("Loading waitlist…")).not.toBeInTheDocument()
  })
})
