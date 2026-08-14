import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { App } from "./app"
import { WaitlistPage } from "./components/waitlist-page"
import { createTestRouter } from "./router"
import { mockApi } from "./test/mock-api"
import { overwriteGetLocale } from "./paraglide/runtime.js"

afterEach(() => overwriteGetLocale(() => "en"))

describe("Trackfi public application", () => {
  it("renders the localized waitlist without a router provider", () => {
    render(<WaitlistPage />)

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/login"
    )
  })

  it("shows the waitlist while waitlist mode is enabled", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter()

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Money, seen clearly.",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Join the waitlist" })
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe("en")
    expect(screen.getByRole("link", { name: "Join waitlist" })).toHaveAttribute(
      "href",
      "#waitlist-conversion"
    )
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/en/login"
    )
    expect(
      screen.getByRole("img", {
        name: "Trackfi dashboard preview with financial metrics, a growth chart, and upcoming payments.",
      })
    ).toBeInTheDocument()
    expect(document.title).toBe("Money, seen clearly. · Trackfi")
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index,follow"
    )
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "http://localhost:3000/en"
    )
    expect(
      document.querySelector('link[hreflang="x-default"]')
    ).toHaveAttribute("href", "http://localhost:3000/en")
  })

  it("renders the public experience and metadata in French", async () => {
    overwriteGetLocale(() => "fr")
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter()

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "L’argent, en toute clarté.",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Rejoindre la liste d’attente" })
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe("fr")
    expect(document.title).toBe("L’argent, en toute clarté. · Trackfi")
  })

  it("renders the login route", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter("/login")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Sign in to Trackfi" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
  })

  it("renders unsupported routes in the active locale", async () => {
    overwriteGetLocale(() => "fr")
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter("/missing")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Page introuvable" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Revenir à Trackfi" })
    ).toBeInTheDocument()
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow"
    )
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
      await screen.findByRole("heading", { name: "Sign in to Trackfi" })
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
        name: "Money, seen clearly.",
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

  it("confirms a successful waitlist submission", async () => {
    mockApi({ waitlistMode: true, session: null })
    const { queryClient, router } = createTestRouter()

    render(<App queryClient={queryClient} router={router} />)

    fireEvent.change(await screen.findByLabelText("Get early access"), {
      target: { value: "future@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Join the waitlist" }))

    expect(await screen.findByText("You’re on the list.")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Check your inbox for a confirmation. We’ll be in touch when your access is ready."
      )
    ).toBeInTheDocument()
  })
})
