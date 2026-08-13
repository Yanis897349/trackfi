import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, sessionFor } from "./test/mock-api"

describe("Trackfi settings application", () => {
  it("uses a contextual skeleton while the selected settings panel loads", async () => {
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

  it("renders the redesigned general settings and discards draft changes", async () => {
    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const { queryClient, router } = createTestRouter("/dashboard/settings")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "General settings", level: 2 })
    ).toBeInTheDocument()
    expect(screen.getByText("All changes saved")).toBeInTheDocument()
    expect(screen.getByLabelText("Account currency")).toHaveTextContent(
      "Euro (EUR)"
    )
    expect(screen.getByText("Formatting preview")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()

    const language = screen.getByRole("combobox", { name: "Language" })
    fireEvent.click(language)
    const french = await screen.findByRole("option", { name: "Français" })
    fireEvent.pointerDown(french, { pointerType: "mouse" })
    fireEvent.click(french)

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Discard" }))
    expect(language).toHaveTextContent("English")
    expect(screen.getByText("All changes saved")).toBeInTheDocument()
  })

  it("deep-links to notification preferences and persists budget email opt-out", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard/settings?tab=notifications"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Email notifications",
        level: 2,
      })
    ).toBeInTheDocument()
    const budgetAlerts = screen.getByRole("switch", { name: "Budget alerts" })
    expect(budgetAlerts).toBeChecked()
    expect(
      screen.getByRole("switch", { name: "Security alerts" })
    ).toHaveAttribute("aria-disabled", "true")

    fireEvent.click(budgetAlerts)
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }))

    await waitFor(() =>
      expect(
        requests.some(
          (request) =>
            request.method === "PATCH" &&
            request.url.includes("/api/settings/notifications")
        )
      ).toBe(true)
    )
    expect(await screen.findByText("All changes saved")).toBeInTheDocument()
  })

  it("deep-links to security and validates password changes", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard/settings?tab=security"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole(
        "heading",
        { name: "Security", level: 2 },
        { timeout: 1_000 }
      )
    ).toBeInTheDocument()
    expect(router.state.location.search).toMatchObject({ tab: "security" })
    expect(screen.getByText("user@example.com")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "old-password" },
    })
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "too-short" },
    })
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "too-short" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Change password" }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use at least 12 characters with a number and symbol."
    )
  })
})
