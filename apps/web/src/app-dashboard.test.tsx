import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import {
  expenseFixture,
  mockApi,
  notificationFixture,
  revenueSourceFixture,
  sessionFor,
  subscriptionFixture,
} from "./test/mock-api"

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
        name: "Your money, in one view.",
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
        name: "Your money, in one view.",
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

  it("previews money module chart buckets on hover", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    const chart = await screen.findByRole("img", {
      name: /Subscriptions: Aug 1 – Aug 1, 2026: €0.00/,
    })
    const firstBar = chart.querySelector<SVGElement>(".recharts-rectangle")
    expect(firstBar).not.toBeNull()
    fireEvent.mouseEnter(firstBar!, { clientX: 12, clientY: 12 })
    fireEvent.mouseMove(firstBar!, { clientX: 12, clientY: 12 })

    expect(await screen.findByText("Aug 1 – Aug 1, 2026")).toBeInTheDocument()
  })

  it("keeps a separated pagination footer on upcoming activity", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    const summary = await screen.findByText("Showing 0–0 of 0 items")
    const footer = summary.closest("footer")
    expect(footer).toHaveAttribute("data-slot", "dashboard-activity-footer")
    expect(footer).toHaveClass("border-t")
    expect(
      within(footer!).getByRole("button", { name: "Previous page" })
    ).toBeDisabled()
    expect(
      within(footer!).getByRole("button", { name: "Next page" })
    ).toBeDisabled()
    expect(within(footer!).getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "View calendar" })).toHaveAttribute(
      "href",
      "/en/dashboard/calendar"
    )
  })

  it("clamps an out-of-range activity page to the final page", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses: Array.from({ length: 6 }, (_, index) => ({
        ...expenseFixture(),
        id: `expense-${index + 1}`,
        merchant: `Merchant ${index + 1}`,
      })),
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard?from=2026-08-01&to=2026-08-31&page=99"
    )

    render(<App queryClient={queryClient} router={router} />)

    const summary = await screen.findByText("Showing 5–6 of 6 items")
    const footer = summary.closest("footer")
    expect(
      within(footer!).getByRole("button", { name: "Next page" })
    ).toBeDisabled()
    expect(within(footer!).getByRole("button", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("opens the dashboard activity calendar across every money module", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses: [expenseFixture()],
      revenueSources: [revenueSourceFixture()],
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard/calendar?month=2026-08"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Upcoming activity calendar",
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "August 2026" })).toBeVisible()
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Primary job").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Rent").length).toBeGreaterThan(0)
    expect(screen.getByText("Module key")).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Back to dashboard" })
    ).toHaveAttribute("href", "/en/dashboard")

    fireEvent.click(screen.getByRole("button", { name: "Next month" }))
    expect(
      await screen.findByRole("heading", { name: "September 2026" })
    ).toBeVisible()
    expect(
      requests.some((request) =>
        request.url.includes("/api/dashboard/calendar?month=2026-09")
      )
    ).toBe(true)
  })

  it("opens the Pencil quick-add menu and each module dialog", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")
    render(<App queryClient={queryClient} router={router} />)

    const quickAdd = await screen.findByRole("button", { name: "Quick add" })
    fireEvent.click(quickAdd)
    expect(await screen.findByText("Add new")).toBeInTheDocument()
    expect(screen.getByText("Record a payment or purchase")).toBeInTheDocument()
    expect(screen.getByText("Add a recurring commitment")).toBeInTheDocument()
    expect(screen.getByText("Add an income source")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Record a payment or purchase"))
    expect(
      await screen.findByRole("heading", { name: "Add expense" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    fireEvent.click(quickAdd)
    fireEvent.click(await screen.findByText("Add a recurring commitment"))
    expect(
      await screen.findByRole("heading", { name: "Add subscription" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    fireEvent.click(quickAdd)
    fireEvent.click(await screen.findByText("Add an income source"))
    expect(
      await screen.findByRole("heading", { name: "Add revenue source" })
    ).toBeInTheDocument()
  })

  it("creates an expense from quick add and refreshes the overview", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter("/dashboard")
    render(<App queryClient={queryClient} router={router} />)

    fireEvent.click(await screen.findByRole("button", { name: "Quick add" }))
    fireEvent.click(await screen.findByText("Record a payment or purchase"))
    fireEvent.change(
      await screen.findByRole("textbox", {
        name: "Merchant or expense name",
      }),
      { target: { value: "Studio rent" } }
    )
    fireEvent.change(screen.getByRole("spinbutton", { name: "Amount" }), {
      target: { value: "950" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }))

    await waitFor(() =>
      expect(
        requests.some(
          ({ method, url }) =>
            method === "POST" && url.endsWith("/api/expenses")
        )
      ).toBe(true)
    )
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Add expense" })
      ).not.toBeInTheDocument()
    )
    expect(
      requests.filter(({ url }) => url.includes("/api/dashboard/overview"))
        .length
    ).toBeGreaterThan(1)
  })

  it("loads and preserves an explicit dashboard date range", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard?from=2026-08-01&to=2026-08-15&page=1"
    )
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("button", {
        name: "Choose dashboard date range",
      })
    ).toHaveTextContent("Aug 1 – Aug 15, 2026")
    expect(
      requests.some(
        ({ url }) =>
          url.includes("/api/dashboard/overview") &&
          url.includes("from=2026-08-01") &&
          url.includes("to=2026-08-15")
      )
    ).toBe(true)
    expect(screen.getByText("0 transactions · 0 pending")).toBeInTheDocument()
    expect(screen.queryByText(/monthly budget/)).not.toBeInTheDocument()
  })

  it("previews a draft dashboard range inside the picker before applying it", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard?from=2026-08-01&to=2026-08-15&page=1"
    )
    render(<App queryClient={queryClient} router={router} />)

    const trigger = await screen.findByRole("button", {
      name: "Choose dashboard date range",
    })
    fireEvent.click(trigger)
    const initialRequests = requests.filter(({ url }) =>
      url.includes("/api/dashboard/overview")
    ).length

    const august5 = screen.getByRole("button", { name: /August 5th, 2026/ })
    const august10 = screen.getByRole("button", { name: /August 10th, 2026/ })
    fireEvent.click(august5)
    expect(august5.closest("td")).toHaveClass("bg-accent")
    expect(august10.closest("td")).not.toHaveClass("bg-accent")
    expect(trigger).toHaveTextContent("Aug 1 – Aug 15, 2026")

    fireEvent.click(screen.getByRole("button", { name: /August 20th, 2026/ }))
    expect(august10.closest("td")).toHaveClass("bg-accent")
    expect(trigger).toHaveTextContent("Aug 1 – Aug 15, 2026")
    expect(
      requests.filter(({ url }) => url.includes("/api/dashboard/overview"))
    ).toHaveLength(initialRequests)

    fireEvent.click(screen.getByRole("button", { name: "Apply range" }))
    await waitFor(() =>
      expect(
        requests.some(
          ({ url }) =>
            url.includes("/api/dashboard/overview") &&
            url.includes("from=2026-08-01") &&
            url.includes("to=2026-08-20")
        )
      ).toBe(true)
    )
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
    expect(userMenu).toHaveAttribute("aria-expanded", "true")
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
    const expensesLink = await screen.findByRole("link", { name: "Expenses" })
    expect(
      document.querySelector<HTMLElement>('[data-mobile="true"]')?.style.width
    ).toBe("18.25rem")
    expect(expensesLink).toHaveAttribute("data-active")
    expect(
      document.querySelector('[data-slot="sidebar-active-indicator"]')
    ).toBeInTheDocument()

    await openUserMenu()
    fireEvent.click(await screen.findByRole("menuitem", { name: "Settings" }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dashboard/settings")
    )
    await waitFor(() =>
      expect(
        document.querySelector('[data-mobile="true"]')
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
