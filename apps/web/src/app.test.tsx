import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi } from "./test/mock-api"

describe("Trackfi public application", () => {
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
})
