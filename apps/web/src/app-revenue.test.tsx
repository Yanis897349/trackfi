import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, revenueSourceFixture, sessionFor } from "./test/mock-api"
import "./routes/dashboard.revenue"

describe("Trackfi revenue application", () => {
  it("requires currency setup before adding revenue", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      currency: null,
    })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByText("Choose an account currency first")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open settings" })).toHaveAttribute(
      "href",
      "/dashboard/settings"
    )
  })

  it("renders forecasts, source mix, and tracked revenue sources", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      revenueSources: [revenueSourceFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Revenue", level: 2 })
    ).toBeInTheDocument()
    expect(await screen.findByText("Expected monthly")).toBeInTheDocument()
    expect(screen.getByText("Revenue by source")).toBeInTheDocument()
    expect(screen.getAllByText("Primary job").length).toBeGreaterThan(0)
    expect(
      screen.getByPlaceholderText("Search revenue sources...")
    ).toBeInTheDocument()
  })

  it("opens a scheduled revenue form with payment fields", async () => {
    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    const addButtons = await screen.findAllByRole("button", {
      name: "Add revenue source",
    })
    fireEvent.click(addButtons[0]!)
    const dialog = await screen.findByRole("dialog", {
      name: "Add revenue source",
    })
    expect(dialog).toHaveTextContent("Take-home per payment (EUR)")
    expect(
      screen.getByRole("button", { name: "Next payment date" })
    ).toBeInTheDocument()
  })

  it("uses a contextual skeleton while revenue loads", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      deferUrl: "/api/settings",
    })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("status", { name: "Loading revenue" })
    ).toBeInTheDocument()
  })
})
