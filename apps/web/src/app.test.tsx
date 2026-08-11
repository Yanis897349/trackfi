import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("Trackfi web application", () => {
  it("shows the waitlist while waitlist mode is enabled", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter()

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "See the future of your money, clearly.",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Join the waitlist" })
    ).toBeInTheDocument()
  })

  it("renders the login route", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter("/login")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
  })

  it("routes public users to registration when registration is open", async () => {
    mockApi({ waitlistMode: false, session: null })
    const { queryClient, router } = createTestRouter()

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Create your account" })
    ).toBeInTheDocument()
  })

  it("explains when a password-reset link is invalid", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter(
      "/reset-password?error=INVALID_TOKEN"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByText("This reset link is invalid or has expired.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Update password" })
    ).toBeDisabled()
  })

  it("redirects unauthenticated dashboard visits to login", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter("/dashboard")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument()
  })

  it("shows an invited registration form with a read-only email", async () => {
    mockApi({
      waitlistMode: true,
      session: null,
      invitation: { valid: true, email: "invited@example.com" },
    })
    const { queryClient, router } = createTestRouter(
      "/register?invite=valid-token"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Create your account" })
    ).toBeInTheDocument()
    const email = screen.getByLabelText("Email address")
    expect(email).toHaveValue("invited@example.com")
    expect(email).toHaveAttribute("readonly")
  })

  it("keeps registration public and editable when waitlist mode is off", async () => {
    mockApi({ waitlistMode: false, session: null })
    const { queryClient, router } = createTestRouter("/register")

    render(<App queryClient={queryClient} router={router} />)

    const email = await screen.findByLabelText("Email address")
    expect(email).not.toHaveAttribute("readonly")
  })

  it("shows the waitlist for an invalid invitation", async () => {
    mockApi({ waitlistMode: true, session: null, invitation: null })
    const { queryClient, router } = createTestRouter(
      "/register?invite=expired-token"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "See the future of your money, clearly.",
      })
    ).toBeInTheDocument()
  })

  it("validates matching registration passwords", async () => {
    mockApi({ waitlistMode: false, session: null })
    const { queryClient, router } = createTestRouter("/register")

    render(<App queryClient={queryClient} router={router} />)

    fireEvent.change(await screen.findByLabelText("Full name"), {
      target: { value: "Test User" },
    })
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(await screen.findByLabelText("Password"), {
      target: { value: "password-one" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password-two" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Passwords must match.")).toBeInTheDocument()
  })

  it("shows admin navigation to admin users", async () => {
    mockApi({
      waitlistMode: true,
      session: {
        session: { id: "session-id" },
        user: {
          id: "admin-id",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
      },
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

  it("requires currency setup before adding subscriptions", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      currency: null,
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByText("Choose an account currency first")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open settings" })).toHaveAttribute(
      "href",
      "/dashboard/settings"
    )
  })

  it("renders subscription insights and tracked services", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Subscriptions",
        level: 2,
      })
    ).toBeInTheDocument()
    expect(await screen.findByText("Monthly spend")).toBeInTheDocument()
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    expect(
      screen.getByPlaceholderText("Search subscriptions...")
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Add subscription" }))
    expect(
      await screen.findByRole("dialog", { name: "Add subscription" })
    ).toHaveClass("top-1/2", "left-1/2")
  })

  it("uses a contextual skeleton while subscriptions load", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      deferUrl: "/api/settings",
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    const loading = await screen.findByRole("status", {
      name: "Loading subscriptions",
    })
    expect(loading.querySelectorAll('[data-slot="skeleton"]')).not.toHaveLength(
      0
    )
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument()
  })

  it("renders the renewal calendar and its adjacent-range agenda", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard/subscriptions/calendar"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Renewal calendar",
        level: 2,
      })
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("link", { name: "Back to subscriptions" })
    ).toHaveAttribute("href", "/dashboard/subscriptions")
    expect(
      within(screen.getByRole("grid")).getByRole("button", {
        name: "Preview Design software",
      })
    ).toBeInTheDocument()
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
  })

  it("uses a contextual skeleton while settings load", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      deferUrl: "/api/settings",
    })
    const { queryClient, router } = createTestRouter("/dashboard/settings")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("status", { name: "Loading settings" })
    ).toContainElement(document.querySelector('[data-slot="skeleton"]'))
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

  it("renders account currency settings", async () => {
    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const { queryClient, router } = createTestRouter("/dashboard/settings")

    render(<App queryClient={queryClient} router={router} />)

    const saveButton = await screen.findByRole("button", {
      name: "Save currency",
    })
    expect(
      screen.getByRole("heading", { name: "Settings", level: 2 })
    ).toBeInTheDocument()
    expect(screen.getByText("Account currency")).toBeInTheDocument()
    expect(screen.getByLabelText("Account currency")).toHaveTextContent(
      "Euro (EUR)"
    )
    expect(saveButton).toBeDisabled()
  })
})

function mockApi({
  deferUrl,
  featureFlags = false,
  invitation,
  session,
  currency = "EUR",
  subscriptions = [],
  waitlistEntries = false,
  waitlistMode,
}: {
  deferUrl?: string
  featureFlags?: boolean
  invitation?: { email: string; valid: true } | null
  session: null | { session: { id: string }; user: Record<string, string> }
  currency?: string | null
  subscriptions?: Array<Record<string, unknown>>
  waitlistEntries?: boolean
  waitlistMode: boolean
}) {
  const requests: Array<{ method: string; url: string }> = []
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input)
      const method =
        (input instanceof Request ? input.method : init?.method) ?? "GET"
      requests.push({ method, url })
      if (deferUrl && url.includes(deferUrl)) {
        return new Promise<Response>(() => {})
      }
      let body: unknown = {}
      let status = 200
      if (url.includes("/api/config")) body = { waitlistMode }
      else if (url.includes("/api/auth/get-session")) body = session
      else if (url.includes("/api/settings")) {
        body = { settings: { currency, updatedAt: null } }
      } else if (url.includes("/api/subscriptions/calendar")) {
        body = {
          calendar: {
            month: "2026-08",
            rangeStart: "2026-07-27",
            rangeEnd: "2026-09-06",
            currency,
            renewalCount: subscriptions.length,
            totalMinor: subscriptions.length ? 1000 : 0,
            categoryCount: subscriptions.length ? 1 : 0,
            monthTotalMinor: subscriptions.length ? 1000 : 0,
            renewals: subscriptions.map((subscription) => ({
              id: `${subscription.id}:${subscription.nextRenewalDate}`,
              subscriptionId: subscription.id,
              name: subscription.name,
              amountMinor: subscription.amountMinor,
              cadence: subscription.cadence,
              category: subscription.category,
              websiteUrl: subscription.websiteUrl,
              renewalDate: subscription.nextRenewalDate,
            })),
          },
        }
      } else if (url.includes("/api/subscriptions/summary")) {
        body = {
          summary: {
            currency,
            activeCount: subscriptions.length,
            pausedCount: 0,
            activeCategoryCount: subscriptions.length ? 1 : 0,
            monthlyEquivalentMinor: subscriptions.length ? 1000 : 0,
            annualEquivalentMinor: subscriptions.length ? 12000 : 0,
            upcomingCount: subscriptions.length,
            upcomingTotalMinor: subscriptions.length ? 1000 : 0,
            upcoming: subscriptions,
            monthlyComparison: null,
          },
        }
      } else if (url.includes("/api/subscriptions")) {
        body = {
          subscriptions,
          page: 1,
          pageSize: 3,
          total: subscriptions.length,
        }
      } else if (url.includes("/api/invitations/validate")) {
        if (invitation) body = invitation
        else {
          body = { valid: false }
          status = 404
        }
      } else if (url.includes("/api/admin/feature-flags")) {
        body =
          method === "GET" && featureFlags
            ? {
                flags: [
                  {
                    key: "waitlist_mode",
                    enabled: true,
                    description: "Restrict registration to invitations.",
                    updatedAt: new Date().toISOString(),
                  },
                ],
              }
            : { flag: { key: "waitlist_mode", enabled: false } }
      } else if (url.includes("/api/admin/waitlist") && waitlistEntries) {
        body =
          method === "GET"
            ? {
                entries: [
                  {
                    id: "entry-id",
                    email: "pending@example.com",
                    status: "pending",
                    created_at: new Date().toISOString(),
                    approved_at: null,
                    invite_expires_at: null,
                    invite_sent_at: null,
                    invite_delivery_status: "not_sent",
                    registered_at: null,
                  },
                ],
                page: 1,
                pageSize: 25,
                total: 1,
              }
            : { sent: true }
      } else if (url.includes("/api/auth/sign-out")) {
        body = { success: true }
      }
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      )
    })
  )
  return requests
}

function sessionFor(role: "admin" | "user") {
  return {
    session: { id: "session-id" },
    user: {
      id: `${role}-id`,
      email: `${role}@example.com`,
      name: role === "admin" ? "Admin User" : "Regular User",
      role,
    },
  }
}

function subscriptionFixture() {
  return {
    id: "subscription-id",
    name: "Design software",
    amountMinor: 1000,
    cadence: "monthly",
    billingAnchor: "2026-08-20",
    nextRenewalDate: "2026-08-20",
    category: "software",
    websiteUrl: "https://example.com",
    notes: null,
    status: "active",
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}
