import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, notificationFixture, sessionFor } from "./test/mock-api"

async function openUserMenu() {
  const trigger = await screen.findByRole("button", {
    name: /Open user menu/,
  })
  fireEvent.click(trigger)
  return trigger
}

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
    expect(screen.getAllByText("Expenses").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Revenue").length).toBeGreaterThan(0)
    await openUserMenu()
    expect(
      await screen.findByRole("menuitem", { name: "Settings" })
    ).toBeInTheDocument()
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
    expect(screen.getAllByText("Expenses").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Revenue").length).toBeGreaterThan(0)
    const userMenu = await openUserMenu()
    expect(
      userMenu.querySelector('[data-slot="unread-count-badge"]')
    ).toBeNull()
    expect(
      await screen.findByRole("menuitem", { name: "Settings" })
    ).toBeInTheDocument()
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

  it("offers sign-out from the current-user menu", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    await openUserMenu()
    expect(screen.getAllByText("Regular User")).toHaveLength(2)
    expect(screen.getByText("user@example.com")).toBeInTheDocument()
    expect(
      await screen.findByRole("menuitem", { name: "Sign out" })
    ).toBeInTheDocument()
  })

  it("routes from the user menu and shows unread notifications", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      notifications: [
        notificationFixture(),
        notificationFixture({ id: "notification-id-2" }),
      ],
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    const userMenu = await screen.findByRole("button", {
      name: /Open user menu/,
    })
    await waitFor(() =>
      expect(
        userMenu.querySelector('[data-slot="unread-count-badge"]')
      ).toHaveTextContent("2")
    )

    fireEvent.click(userMenu)
    const notificationsItem = await screen.findByRole("menuitem", {
      name: /Notifications/,
    })
    expect(
      notificationsItem.querySelector('[data-slot="unread-count-badge"]')
    ).toHaveTextContent("2")
    fireEvent.click(notificationsItem)
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dashboard/notifications")
    )

    await openUserMenu()
    fireEvent.click(await screen.findByRole("menuitem", { name: "Settings" }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dashboard/settings")
    )
  })

  it("caps the unread pill and retains it when the sidebar collapses", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      notifications: Array.from({ length: 100 }, (_, index) =>
        notificationFixture({ id: `notification-id-${index}` })
      ),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    const userMenu = await screen.findByRole("button", {
      name: /Open user menu/,
    })
    await waitFor(() =>
      expect(
        userMenu.querySelector('[data-slot="unread-count-badge"]')
      ).toHaveTextContent("99+")
    )

    const sidebarTrigger = screen
      .getAllByRole("button", { name: "Toggle sidebar" })
      .find((button) => button.dataset.slot === "sidebar-trigger")
    expect(sidebarTrigger).toBeDefined()
    fireEvent.click(sidebarTrigger!)
    expect(
      userMenu.querySelector('[data-slot="unread-count-badge"]')
    ).toHaveTextContent("99+")
  })

  it("marks the current module and closes the mobile sheet after navigation", async () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")

    render(<App queryClient={queryClient} router={router} />)

    fireEvent.click(
      await screen.findByRole("button", { name: "Toggle sidebar" })
    )
    expect(
      await screen.findByRole("link", { name: "Expenses" })
    ).toHaveAttribute("data-active")

    await openUserMenu()
    fireEvent.click(await screen.findByRole("menuitem", { name: "Settings" }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dashboard/settings")
    )
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="sheet-content"]')
      ).not.toBeInTheDocument()
    )
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
