import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import {
  expenseFixture,
  mockApi,
  sessionFor,
  subscriptionFixture,
} from "./test/mock-api"
import "./routes/dashboard.expenses"

vi.mock("./components/expense-forecast-chart", () => ({
  ExpenseForecastChart: () => (
    <div role="img" aria-label="Expense forecast chart" />
  ),
}))

describe("Trackfi expenses application", () => {
  it("requires currency setup before loading expenses", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      currency: null,
      deferUrl: "/api/expenses",
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByText("Choose an account currency first")
    ).toBeInTheDocument()
    expect(requests.some(({ url }) => url.includes("/api/expenses"))).toBe(
      false
    )
  })

  it("renders combined forecasts while keeping the list expense-only", async () => {
    const groceries = {
      ...expenseFixture(),
      id: "groceries-id",
      name: "Groceries",
      amountMinor: 50000,
      scheduleType: "variable",
      cadence: null,
      expenseAnchor: null,
      nextExpenseDate: null,
      category: "food",
      monthlyEquivalentMinor: 50000,
      annualEquivalentMinor: 600000,
    }
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses: [expenseFixture(), groceries],
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", { name: "Expenses", level: 2 })
    ).toBeInTheDocument()
    expect(await screen.findByText("Spending forecast")).toBeInTheDocument()
    expect(
      await screen.findByRole("img", { name: "Expense forecast chart" })
    ).toBeInTheDocument()
    expect(screen.getByText("Category mix")).toBeInTheDocument()
    expect(screen.getByText("Upcoming spending")).toBeInTheDocument()
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("button", { name: "Actions for Design software" })
    ).not.toBeInTheDocument()
    expect(screen.getAllByText("Subscription").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Rent").length).toBeGreaterThan(0)
    expect(
      screen.getByPlaceholderText("Search expenses...")
    ).toBeInTheDocument()
  })

  it("requests a new forecast when the range changes", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses: [expenseFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)

    const range = await screen.findByRole("combobox", {
      name: "Forecast range",
    })
    fireEvent.click(range)
    const option = await screen.findByRole("option", { name: "Next 3 months" })
    fireEvent.pointerDown(option, { pointerType: "mouse" })
    fireEvent.click(option)
    await waitFor(() =>
      expect(requests.some(({ url }) => url.includes("months=3"))).toBe(true)
    )
  })

  it("returns to the previous page when a status change empties the page", async () => {
    const expenses = Array.from({ length: 4 }, (_, index) => ({
      ...expenseFixture(),
      id: `expense-${index + 1}`,
      name: `Expense ${index + 1}`,
    }))
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses,
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)

    await screen.findAllByText("Expense 1")
    fireEvent.click(screen.getAllByRole("button", { name: "Next page" })[0]!)
    await screen.findAllByText("Expense 4")
    fireEvent.click(
      screen.getAllByRole("button", { name: "Actions for Expense 4" })[0]!
    )
    fireEvent.click(await screen.findByRole("menuitem", { name: "Archive" }))

    await waitFor(() =>
      expect(screen.queryByText("Expense 4")).not.toBeInTheDocument()
    )
    expect((await screen.findAllByText("Expense 1")).length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole("button", { name: "Previous page" })[0]
    ).toBeDisabled()
  })

  it("switches between scheduled and monthly-estimate fields", async () => {
    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Add expense" }))[0]!
    )
    const dialog = await screen.findByRole("dialog", { name: "Add expense" })
    expect(screen.getByRole("radio", { name: /Scheduled/ })).toBeChecked()
    expect(dialog).toHaveTextContent("Expected amount")
    expect(
      screen.getByRole("button", { name: "Next expected date" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("radio", { name: /Monthly estimate/ }))
    expect(dialog).toHaveTextContent("Estimated monthly spend")
    expect(
      screen.queryByRole("button", { name: "Next expected date" })
    ).not.toBeInTheDocument()
  })

  it("uses a contextual skeleton while expenses load", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      deferUrl: "/api/settings",
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)
    expect(
      await screen.findByRole("status", { name: "Loading expenses" })
    ).toBeInTheDocument()
  })
})
