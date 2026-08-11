import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
        name: "Your financial workspace is ready.",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("Waitlist approvals")).toBeInTheDocument()
    expect(screen.getByText("Feature flags")).toBeInTheDocument()
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
        name: "Your financial workspace is ready.",
      })
    ).toBeInTheDocument()
    expect(screen.queryByText("Waitlist approvals")).not.toBeInTheDocument()
    expect(screen.queryByText("Feature flags")).not.toBeInTheDocument()
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
})

function mockApi({
  featureFlags = false,
  invitation,
  session,
  waitlistEntries = false,
  waitlistMode,
}: {
  featureFlags?: boolean
  invitation?: { email: string; valid: true } | null
  session: null | { session: { id: string }; user: Record<string, string> }
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
      let body: unknown = {}
      let status = 200
      if (url.includes("/api/config")) body = { waitlistMode }
      else if (url.includes("/api/auth/get-session")) body = session
      else if (url.includes("/api/invitations/validate")) {
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
