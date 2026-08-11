import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, sessionFor } from "./test/mock-api"

describe("Trackfi settings application", () => {
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
