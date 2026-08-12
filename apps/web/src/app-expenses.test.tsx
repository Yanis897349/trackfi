import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { expenseFixture, mockApi, sessionFor } from "./test/mock-api"
import "./routes/dashboard.expenses"

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

  it("renders spend-control metrics and the transaction ledger", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses: [
        expenseFixture(),
        {
          ...expenseFixture(),
          id: "coffee-id",
          merchant: "Acme Coffee",
          amountMinor: 1280,
          category: "food",
          status: "pending",
          receipt: {
            name: "coffee-receipt.pdf",
            contentType: "application/pdf",
            size: 1024,
            url: "/api/expenses/coffee-id/receipt",
          },
        },
      ],
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)
    expect(
      await screen.findByRole("heading", { name: "Expenses", level: 2 })
    ).toBeInTheDocument()
    expect(await screen.findByText("Spent this month")).toBeInTheDocument()
    expect(screen.getByText("Budget pace")).toBeInTheDocument()
    expect(screen.getByText("Category allocation")).toBeInTheDocument()
    expect(screen.getByText("Transactions")).toBeInTheDocument()
    const dateFilter = screen.getByRole("combobox", { name: "Date filter" })
    expect(dateFilter).toHaveTextContent("August")
    fireEvent.click(dateFilter)
    expect(
      (await screen.findAllByRole("option")).map((option) => option.textContent)
    ).toEqual([
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "All time",
    ])
    fireEvent.keyDown(document, { key: "Escape" })
    expect((await screen.findAllByText("Rent")).length).toBeGreaterThan(0)
    expect((await screen.findAllByText("Acme Coffee")).length).toBeGreaterThan(
      0
    )
    expect(
      screen
        .getAllByRole("link", { name: "Attached" })
        .some((link) => link.classList.contains("-ml-1.5"))
    ).toBe(true)
    expect(
      screen.getByPlaceholderText("Search merchant or description…")
    ).toBeInTheDocument()
  })

  it("opens the canonical manual expense form", async () => {
    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Add expense" }))[0]!
    )
    const dialog = await screen.findByRole("dialog", { name: "Add expense" })
    expect(dialog).toHaveTextContent("Merchant or expense name")
    expect(dialog).toHaveTextContent("Receipt")
    expect(screen.getByRole("radio", { name: "Pending" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Approved" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Declined" })).toBeInTheDocument()
    expect(
      screen.getByRole("switch", { name: "Reimbursable expense" })
    ).toBeInTheDocument()
  })

  it("opens persisted expense budget settings", async () => {
    mockApi({ waitlistMode: true, session: sessionFor("user") })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)
    fireEvent.click(
      await screen.findByRole("button", { name: "Budget settings" })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Expense settings",
    })
    expect(dialog).toHaveTextContent("Monthly budget")
    expect(dialog).toHaveTextContent("Daily spending target")
    expect(dialog).toHaveTextContent("Alert thresholds")
    expect(dialog).not.toHaveTextContent(
      "Trackfi uses the selected day of the month for every budget reset."
    )
    expect(screen.getByLabelText("Approaching budget")).toHaveClass(
      "border-orange-300",
      "bg-orange-50"
    )
    expect(
      screen.getByRole("switch", { name: "Roll over unused budget" })
    ).toHaveClass("data-checked:bg-[#F4510B]")
  })

  it("deletes a transaction through row actions", async () => {
    const requests = mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      expenses: [expenseFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/expenses")
    render(<App queryClient={queryClient} router={router} />)
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Actions for Rent" }))[0]!
    )
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }))
    expect(
      await screen.findByRole("heading", { name: "Delete Rent?" })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }))
    await waitFor(() =>
      expect(
        requests.some(
          ({ method, url }) =>
            method === "DELETE" && url.includes("/api/expenses/expense-id")
        )
      ).toBe(true)
    )
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
