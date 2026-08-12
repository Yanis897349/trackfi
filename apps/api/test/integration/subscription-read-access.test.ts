import { env, exports } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { subscriptionBody } from "../support/fixtures"
import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("subscription reads, access, and validation", () => {
  it("keeps subscription records isolated between users", async () => {
    const ownerCookie = await createUserSession()
    const otherCookie = await createUserSession()
    await userApi("/api/settings", ownerCookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const created = await userApi("/api/subscriptions", ownerCookie, {
      method: "POST",
      body: subscriptionBody({ name: "Private service" }),
    })
    const id = (await created.json<{ subscription: { id: string } }>())
      .subscription.id

    const otherList = await userApi("/api/subscriptions", otherCookie)
    await expect(otherList.json()).resolves.toEqual({
      subscriptions: [],
      page: 1,
      pageSize: 25,
      total: 0,
    })
    expect(
      (
        await userApi(`/api/subscriptions/${id}`, otherCookie, {
          method: "PATCH",
          body: { status: "archived" },
        })
      ).status
    ).toBe(404)
  })

  it("validates subscription inputs and protects regular-user mutations", async () => {
    expect(
      (
        await exports.default.fetch(
          new Request("https://trackfi.test/api/settings")
        )
      ).status
    ).toBe(401)

    const cookie = await createUserSession()
    expect(
      (
        await userApi("/api/settings", cookie, {
          method: "PATCH",
          body: { currency: "ZZZ" },
        })
      ).status
    ).toBe(400)
    const untrusted = await exports.default.fetch(
      new Request("https://trackfi.test/api/settings", {
        method: "PATCH",
        headers: {
          Cookie: cookie,
          Origin: "https://malicious.example",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency: "EUR" }),
      })
    )
    expect(untrusted.status).toBe(403)

    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    expect(
      (
        await userApi("/api/subscriptions", cookie, {
          method: "POST",
          body: subscriptionBody({ websiteUrl: "javascript:alert(1)" }),
        })
      ).status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions/summary?asOf=not-a-date", cookie))
        .status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions?status=unknown", cookie)).status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions?cadence=daily", cookie)).status
    ).toBe(400)
    expect((await userApi("/api/subscriptions?page=0", cookie)).status).toBe(
      400
    )
    expect(
      (await userApi("/api/subscriptions/calendar?month=2024-13", cookie))
        .status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions/calendar?month=0000-01", cookie))
        .status
    ).toBe(400)
  })

  it("paginates subscriptions and returns every renewal in a calendar grid", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody({
        name: "Weekly service",
        amountMinor: 500,
        cadence: "weekly",
        billingAnchor: "2024-08-31",
      }),
    })
    await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody({
        name: "Outside-month service",
        amountMinor: 1000,
        cadence: "monthly",
        billingAnchor: "2024-10-02",
        category: "finance",
      }),
    })

    await expect(
      (
        await userApi(
          "/api/subscriptions?status=active&cadence=weekly&page=1&pageSize=1&asOf=2024-09-01",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      page: 1,
      pageSize: 1,
      total: 1,
      subscriptions: [{ name: "Weekly service" }],
    })

    await expect(
      (
        await userApi("/api/subscriptions/summary?asOf=2024-09-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      summary: {
        upcomingCount: 1,
        upcomingTotalMinor: 2000,
      },
    })

    const response = await userApi(
      "/api/subscriptions/calendar?month=2024-09",
      cookie
    )
    const calendarBody = await response.json<{
      calendar: {
        renewals: Array<{ name: string; renewalDate: string }>
      }
    }>()
    expect(calendarBody).toMatchObject({
      calendar: {
        month: "2024-09",
        rangeStart: "2024-08-26",
        rangeEnd: "2024-10-06",
        renewalCount: 7,
        totalMinor: 4000,
        monthTotalMinor: 2000,
        categoryCount: 2,
      },
    })
    expect(calendarBody.calendar.renewals[0]).toMatchObject({
      name: "Weekly service",
      renewalDate: "2024-08-31",
    })
    expect(calendarBody.calendar.renewals).toContainEqual(
      expect.objectContaining({
        name: "Outside-month service",
        renewalDate: "2024-10-02",
      })
    )
  })

  it("compares commitment snapshots and resets history across currencies", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const created = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    const createdBody = await created.json<{
      subscription: { id: string }
    }>()
    const user = await env.DB.prepare(
      "SELECT user_id FROM subscriptions WHERE id = ?"
    )
      .bind(createdBody.subscription.id)
      .first<{ user_id: string }>()
    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 86_400_000).toISOString()
    await env.DB.prepare(
      `UPDATE subscription_spend_snapshots SET recorded_at = ?
      WHERE user_id = ?`
    )
      .bind(daysAgo(60), user!.user_id)
      .run()
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO subscription_spend_snapshots
        (id, user_id, currency, monthly_equivalent_minor, recorded_at)
      VALUES (?, ?, 'EUR', 500, ?)`
      ).bind(crypto.randomUUID(), user!.user_id, daysAgo(45)),
      env.DB.prepare(
        `INSERT INTO subscription_spend_snapshots
        (id, user_id, currency, monthly_equivalent_minor, recorded_at)
      VALUES (?, ?, 'JPY', 50, ?)`
      ).bind(crypto.randomUUID(), user!.user_id, daysAgo(90)),
    ])

    await expect(
      (await userApi("/api/subscriptions/summary", cookie)).json()
    ).resolves.toMatchObject({
      summary: {
        monthlyEquivalentMinor: 1000,
        monthlyComparison: { previousMonthlyEquivalentMinor: 500 },
      },
    })

    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY", confirmRelabel: true },
    })
    await expect(
      (await userApi("/api/subscriptions/summary", cookie)).json()
    ).resolves.toMatchObject({
      summary: { monthlyComparison: null },
    })
  })
})
