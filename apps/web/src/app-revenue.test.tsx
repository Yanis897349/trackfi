import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
    const variable = {
      ...revenueSourceFixture(),
      id: "variable-revenue-source",
      name: "Design clients",
      amountMinor: 50_000,
      scheduleType: "variable",
      cadence: null,
      paymentAnchor: null,
      nextPaymentDate: null,
      category: "freelance",
      monthlyEquivalentMinor: 50_000,
      annualEquivalentMinor: 600_000,
    }
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      revenueSources: [revenueSourceFixture(), variable],
    })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Revenue", level: 2 })
    ).toBeInTheDocument()
    expect(await screen.findByText("Expected monthly")).toBeInTheDocument()
    expect(screen.getByText("Cash-flow forecast")).toBeInTheDocument()
    expect(screen.getByText("Source contribution")).toBeInTheDocument()
    expect(screen.getByText("Upcoming income")).toBeInTheDocument()
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument()
    expect(screen.queryByText("Confirmed")).not.toBeInTheDocument()
    expect(screen.queryByText("Estimate")).not.toBeInTheDocument()
    expect(screen.getAllByText("Scheduled").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Estimated").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Primary job").length).toBeGreaterThan(0)
    expect(
      screen.getByPlaceholderText("Search revenue sources...")
    ).toBeInTheDocument()
  })

  it("requests a new forecast when the range changes", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      revenueSources: [revenueSourceFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    const range = await screen.findByRole("combobox", {
      name: "Forecast range",
    })
    expect(range).toHaveTextContent("Next 6 months")
    expect(requests.some(({ url }) => url.includes("months=6"))).toBe(true)

    fireEvent.click(range)
    const threeMonths = await screen.findByRole("option", {
      name: "Next 3 months",
    })
    fireEvent.pointerDown(threeMonths, { pointerType: "mouse" })
    fireEvent.click(threeMonths)

    await waitFor(() =>
      expect(requests.some(({ url }) => url.includes("months=3"))).toBe(true)
    )
    expect(range).toHaveTextContent("Next 3 months")
  })

  it("groups smaller source contributions into Other", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      revenueSources: [
        revenueSourceFixture(),
        ...["Consulting", "Investments", "Rental"].map((name, index) => ({
          ...revenueSourceFixture(),
          id: `source-${index}`,
          name,
          monthlyEquivalentMinor: 20_000 - index * 5_000,
        })),
      ],
    })
    const { queryClient, router } = createTestRouter("/dashboard/revenue")
    render(<App queryClient={queryClient} router={router} />)

    expect(await screen.findByText("Other")).toBeInTheDocument()
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
