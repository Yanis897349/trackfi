import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { App } from "./app"
import { createTestRouter } from "./router"
import { mockApi, sessionFor, subscriptionFixture } from "./test/mock-api"
import "./routes/dashboard.subscriptions"
import "./routes/dashboard.subscriptions_.calendar"

describe("Trackfi subscription application", () => {
  it("requires currency setup before adding subscriptions", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      currency: null,
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByText("Choose an account currency first")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open settings" })).toHaveAttribute(
      "href",
      "/en/dashboard/settings"
    )
  })

  it("renders subscription insights and tracked services", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Subscriptions",
        level: 2,
      })
    ).toBeInTheDocument()
    expect(await screen.findByText("Monthly spend")).toBeInTheDocument()
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    expect(
      screen.getByPlaceholderText("Search subscriptions…")
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Add subscription" }))
    const dialog = await screen.findByRole("dialog", {
      name: "Add subscription",
    })
    expect(dialog).toHaveClass("top-1/2", "left-1/2")
    expect(dialog.querySelector('[data-slot="dialog-footer"]')).toHaveClass(
      "sm:h-[72px]"
    )
    expect(dialog.querySelector('[data-slot="dialog-footer"]')).not.toHaveClass(
      "h-[72px]"
    )
  })

  it("uses a contextual skeleton while subscriptions load", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      deferUrl: "/api/settings",
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    const loading = await screen.findByRole("status", {
      name: "Loading subscriptions",
    })
    expect(loading.querySelectorAll('[data-slot="skeleton"]')).not.toHaveLength(
      0
    )
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument()
  })

  it("does not expose a skeleton for fast subscription requests", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      (await screen.findAllByText("Design software")).length
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole("status", { name: "Loading subscriptions" })
    ).not.toBeInTheDocument()
  })

  it("retains subscription rows while a changed filter is fetching", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    const search = await screen.findByPlaceholderText("Search subscriptions…")
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise<Response>(() => undefined)
    )

    fireEvent.change(search, { target: { value: "design" } })

    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("status", { name: "Loading subscriptions" })
    ).not.toBeInTheDocument()
  })

  it("keeps cached subscription rows during a background refetch", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter("/dashboard/subscriptions")

    render(<App queryClient={queryClient} router={router} />)

    expect(
      (await screen.findAllByText("Design software")).length
    ).toBeGreaterThan(0)
    const fetchMock = vi.mocked(fetch)
    const requestCount = fetchMock.mock.calls.length
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>(() => undefined)
    )

    void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThan(requestCount)
    )

    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("status", { name: "Loading subscriptions" })
    ).not.toBeInTheDocument()
  })

  it("renders the renewal calendar and its adjacent-range agenda", async () => {
    mockApi({
      waitlistMode: true,
      session: sessionFor("user"),
      subscriptions: [subscriptionFixture()],
    })
    const { queryClient, router } = createTestRouter(
      "/dashboard/subscriptions/calendar"
    )

    render(<App queryClient={queryClient} router={router} />)

    expect(
      await screen.findByRole("heading", {
        name: "Renewal calendar",
        level: 2,
      })
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("link", { name: "Back to subscriptions" })
    ).toHaveAttribute("href", "/en/dashboard/subscriptions")
    expect(
      within(screen.getByRole("grid")).getByRole("button", {
        name: "Preview Design software",
      })
    ).toBeInTheDocument()
    expect(screen.getAllByText("Design software").length).toBeGreaterThan(0)
  })
})
