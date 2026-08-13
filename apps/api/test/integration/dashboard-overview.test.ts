import { exports } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { expenseBody, revenueBody, subscriptionBody } from "../support/fixtures"
import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("dashboard overview", () => {
  it("aggregates and paginates activity across financial modules", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    await userApi("/api/expenses/settings", cookie, {
      method: "PATCH",
      body: {
        monthlyBudgetMinor: 190_000,
        dailyTargetMinor: null,
        budgetPeriod: "monthly",
        resetDay: 1,
        rolloverEnabled: false,
        approachingThreshold: 80,
        limitThreshold: 100,
      },
    })
    await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody({
        name: "Weekly service",
        amountMinor: 1_000,
        cadence: "weekly",
        billingAnchor: "2024-08-01",
      }),
    })
    await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody({
        name: "Rent received",
        amountMinor: 24_000,
        cadence: "once",
        paymentAnchor: "2024-08-19",
      }),
    })
    await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody({
        name: "Client estimate",
        amountMinor: 5_000,
        scheduleType: "variable",
        cadence: null,
        paymentAnchor: null,
        category: "freelance",
      }),
    })
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        merchant: "Apartment rent",
        amountMinor: 95_000,
        transactionDate: "2024-08-10",
      }),
    })
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        merchant: "Pending purchase",
        amountMinor: 10_000,
        transactionDate: "2024-08-22",
        status: "pending",
      }),
    })
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        merchant: "Declined purchase",
        amountMinor: 99_000,
        transactionDate: "2024-08-12",
        status: "declined",
      }),
    })

    const response = await userApi(
      "/api/dashboard/overview?from=2024-08-01&to=2024-08-31&page=2&pageSize=4",
      cookie
    )
    const body = await response.json<{
      overview: {
        totals: Record<string, number | null>
        highlights: Array<{ label: string }>
        movement: Array<{ netMinor: number }>
        modules: {
          expenses: Record<string, number | null>
          revenue: Record<string, number>
          subscriptions: Record<string, number>
        }
        activity: {
          items: Array<{
            label: string
            date: string
            status: string
          }>
          total: number
        }
      }
    }>()

    expect(response.status).toBe(200)
    expect(body.overview).toMatchObject({
      totals: {
        expectedIncomeMinor: 29_000,
        subscriptionCommitmentMinor: 5_000,
        expenseMinor: 105_000,
        committedMinor: 110_000,
        netPositionMinor: -81_000,
      },
      modules: {
        subscriptions: {
          totalMinor: 5_000,
          activeCount: 1,
          occurrenceCount: 5,
        },
        expenses: {
          totalMinor: 105_000,
          transactionCount: 2,
          pendingCount: 1,
          monthlyBudgetMinor: 190_000,
        },
        revenue: {
          totalMinor: 29_000,
          activeCount: 2,
          scheduledPercent: 83,
        },
      },
      activity: { total: 9 },
    })
    expect(body.overview.highlights).toHaveLength(4)
    expect(body.overview.movement).toHaveLength(7)
    expect(body.overview.activity.items).toHaveLength(4)
    const finalPage = await userApi(
      "/api/dashboard/overview?from=2024-08-01&to=2024-08-31&page=3&pageSize=4",
      cookie
    )
    const finalBody = await finalPage.json<{
      overview: { activity: { items: Array<Record<string, unknown>> } }
    }>()
    expect(finalBody.overview.activity.items).toContainEqual(
      expect.objectContaining({
        label: "Client estimate",
        date: "2024-08-31",
        status: "estimated",
      })
    )
    expect(
      body.overview.activity.items.some(
        (item) => item.label === "Declined purchase"
      )
    ).toBe(false)
  })

  it("validates ranges, requires authentication, and isolates users", async () => {
    const unauthorized = await exports.default.fetch(
      new Request(
        "https://trackfi.test/api/dashboard/overview?from=2024-01-01&to=2024-01-31"
      )
    )
    expect(unauthorized.status).toBe(401)

    const cookie = await createUserSession()
    expect(
      (
        await userApi(
          "/api/dashboard/overview?from=2024-01-01&to=2025-01-01",
          cookie
        )
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          "/api/dashboard/overview?from=2024-02-01&to=2024-01-01",
          cookie
        )
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          "/api/dashboard/overview?from=2024-01-01&to=2024-01-31&page=0",
          cookie
        )
      ).status
    ).toBe(400)

    const isolated = await userApi(
      "/api/dashboard/overview?from=2024-01-01&to=2024-01-31",
      cookie
    )
    await expect(isolated.json()).resolves.toMatchObject({
      overview: {
        totals: { expectedIncomeMinor: 0, committedMinor: 0 },
        activity: { total: 0, items: [] },
      },
    })
  })
})
