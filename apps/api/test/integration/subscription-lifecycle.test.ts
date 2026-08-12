import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { subscriptionBody } from "../support/fixtures"
import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("subscription lifecycle", () => {
  it("manages user-scoped subscriptions and calculates recurring insights", async () => {
    const cookie = await createUserSession()
    const missingCurrency = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    expect(missingCurrency.status).toBe(409)
    await expect(missingCurrency.json()).resolves.toEqual({
      error: "currency_required",
    })

    const savedSettings = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    expect(savedSettings.status).toBe(200)

    const created = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    expect(created.status).toBe(201)
    const createdBody = await created.json<{
      subscription: { id: string; status: string }
    }>()
    expect(createdBody.subscription.status).toBe("active")
    const subscriptionOwner = await env.DB.prepare(
      "SELECT user_id FROM subscriptions WHERE id = ?"
    )
      .bind(createdBody.subscription.id)
      .first<{ user_id: string }>()

    const summary = await userApi(
      "/api/subscriptions/summary?asOf=2024-02-01",
      cookie
    )
    await expect(summary.json()).resolves.toMatchObject({
      summary: {
        currency: "EUR",
        activeCount: 1,
        monthlyEquivalentMinor: 1000,
        annualEquivalentMinor: 12000,
        upcomingCount: 1,
        upcoming: [{ nextRenewalDate: "2024-02-29" }],
        monthlyComparison: null,
      },
    })

    const snapshots = await env.DB.prepare(
      `SELECT monthly_equivalent_minor FROM subscription_spend_snapshots
      WHERE user_id = (SELECT user_id FROM subscriptions WHERE id = ?)
      ORDER BY recorded_at`
    )
      .bind(createdBody.subscription.id)
      .all<{ monthly_equivalent_minor: number }>()
    expect(
      snapshots.results.map((snapshot) => snapshot.monthly_equivalent_minor)
    ).toEqual([0, 1000])

    const paused = await userApi(
      `/api/subscriptions/${createdBody.subscription.id}`,
      cookie,
      { method: "PATCH", body: { status: "paused" } }
    )
    expect(paused.status).toBe(200)
    const pausedSummary = await userApi(
      "/api/subscriptions/summary?asOf=2024-02-01",
      cookie
    )
    await expect(pausedSummary.json()).resolves.toMatchObject({
      summary: { activeCount: 0, annualEquivalentMinor: 0 },
    })

    const currencyConflict = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "USD" },
    })
    expect(currencyConflict.status).toBe(409)
    await expect(currencyConflict.json()).resolves.toMatchObject({
      error: "currency_change_requires_confirmation",
      subscriptionCount: 1,
    })
    expect(
      (
        await userApi("/api/settings", cookie, {
          method: "PATCH",
          body: { currency: "JPY", confirmRelabel: true },
        })
      ).status
    ).toBe(200)
    await expect(
      (
        await userApi("/api/subscriptions?status=all&asOf=2024-02-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      subscriptions: [{ amountMinor: 10 }],
    })

    expect(
      (
        await userApi(
          `/api/subscriptions/${createdBody.subscription.id}`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          `/api/subscriptions/${createdBody.subscription.id}?confirm=true`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(204)

    const mutationSnapshots = await env.DB.prepare(
      `SELECT currency, monthly_equivalent_minor
      FROM subscription_spend_snapshots
      WHERE user_id = ?
      ORDER BY rowid`
    )
      .bind(subscriptionOwner!.user_id)
      .all<{ currency: string; monthly_equivalent_minor: number }>()
    expect(mutationSnapshots.results).toEqual([
      { currency: "EUR", monthly_equivalent_minor: 0 },
      { currency: "EUR", monthly_equivalent_minor: 1000 },
      { currency: "EUR", monthly_equivalent_minor: 0 },
      { currency: "JPY", monthly_equivalent_minor: 0 },
      { currency: "JPY", monthly_equivalent_minor: 0 },
    ])
  })

  it("preserves subscription metadata when archiving and restoring", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const created = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    const id = (await created.json<{ subscription: { id: string } }>())
      .subscription.id

    const archived = await userApi(`/api/subscriptions/${id}`, cookie, {
      method: "PATCH",
      body: { status: "archived" },
    })
    await expect(archived.json()).resolves.toMatchObject({
      subscription: {
        status: "archived",
        websiteUrl: "https://example.com",
        notes: "Team plan",
      },
    })
    await expect(
      (await userApi("/api/subscriptions?status=archived", cookie)).json()
    ).resolves.toMatchObject({
      subscriptions: [
        {
          id,
          websiteUrl: "https://example.com",
          notes: "Team plan",
        },
      ],
    })

    const restored = await userApi(`/api/subscriptions/${id}`, cookie, {
      method: "PATCH",
      body: { status: "active" },
    })
    await expect(restored.json()).resolves.toMatchObject({
      subscription: {
        status: "active",
        websiteUrl: "https://example.com",
        notes: "Team plan",
      },
    })
  })
})
