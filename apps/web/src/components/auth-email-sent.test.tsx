import { fireEvent, render, screen } from "@testing-library/react"
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { overwriteGetLocale } from "../paraglide/runtime.js"
import { AuthEmailSent } from "./auth-email-sent"

afterEach(() => overwriteGetLocale(() => "en"))

describe("AuthEmailSent", () => {
  it("shows the delivery destination and exposes the follow-up actions", async () => {
    const onChangeEmail = vi.fn()
    const onSecondaryAction = vi.fn()

    const rootRoute = createRootRoute()
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => (
        <AuthEmailSent
          email="test@example.com"
          description="We sent a verification link."
          statusTitle="Verification email sent"
          secondaryActionLabel="Resend verification email"
          onSecondaryAction={onSecondaryAction}
          onChangeEmail={onChangeEmail}
        />
      ),
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    })

    await router.load()
    render(<RouterProvider router={router} />)

    expect(
      screen.getByRole("heading", { name: "Check your inbox" })
    ).toBeInTheDocument()
    expect(screen.getByText("Verification email sent")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(
      screen.getByText("The link expires in 30 minutes.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Return to sign in" })
    ).toHaveAttribute("href", "/login")

    fireEvent.click(
      screen.getByRole("button", { name: "Resend verification email" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Change it" }))

    expect(onSecondaryAction).toHaveBeenCalledOnce()
    expect(onChangeEmail).toHaveBeenCalledOnce()
  })
})
