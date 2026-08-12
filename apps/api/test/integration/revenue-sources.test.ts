import { describe, expect, it } from "vitest"

import { revenueBody } from "../support/fixtures"
import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("revenue sources", () => {
  it("manages revenue forecasts, variable estimates, and user isolation", async () => {
    const cookie = await createUserSession()
    expect(
      (
        await userApi("/api/revenue-sources", cookie, {
          method: "POST",
          body: revenueBody(),
        })
      ).status
    ).toBe(409)
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })

    const scheduled = await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody(),
    })
    expect(scheduled.status).toBe(201)
    const scheduledBody = await scheduled.json<{
      revenueSource: { id: string; nextPaymentDate: string }
    }>()
    expect(scheduledBody.revenueSource.nextPaymentDate).toBeTruthy()

    const variable = await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody({
        name: "Design clients",
        amountMinor: 50_000,
        scheduleType: "variable",
        cadence: null,
        paymentAnchor: null,
        category: "freelance",
      }),
    })
    expect(variable.status).toBe(201)
    expect(
      (
        await userApi("/api/revenue-sources", cookie, {
          method: "POST",
          body: revenueBody({ scheduleType: "variable" }),
        })
      ).status
    ).toBe(400)

    await expect(
      (
        await userApi("/api/revenue-sources/summary?asOf=2024-01-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      summary: {
        currency: "EUR",
        activeCount: 2,
        variableCount: 1,
        monthlyEquivalentMinor: 266_667,
        annualEquivalentMinor: 3_200_000,
        upcomingCount: 3,
        upcomingTotalMinor: 300_000,
        forecast: {
          months: 6,
          totalMinor: 1_600_000,
          previousMonthMinor: 50_000,
          series: [
            { month: "2024-01", amountMinor: 350_000 },
            { month: "2024-02", amountMinor: 250_000 },
            { month: "2024-03", amountMinor: 250_000 },
            { month: "2024-04", amountMinor: 250_000 },
            { month: "2024-05", amountMinor: 250_000 },
            { month: "2024-06", amountMinor: 250_000 },
          ],
        },
        sourceBreakdown: [
          { name: "Primary job", monthlyEquivalentMinor: 216_667 },
          { name: "Design clients", monthlyEquivalentMinor: 50_000 },
        ],
        upcomingIncome: [
          {
            name: "Primary job",
            scheduleType: "scheduled",
            expectedDate: "2024-01-01",
          },
          {
            name: "Design clients",
            scheduleType: "variable",
            expectedDate: null,
          },
        ],
      },
    })
    expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2024-01-01&months=5",
          cookie
        )
      ).status
    ).toBe(400)
    await expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2024-01-01&months=3",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      summary: {
        forecast: {
          months: 3,
          totalMinor: 850_000,
          series: [
            { month: "2024-01", amountMinor: 350_000 },
            { month: "2024-02", amountMinor: 250_000 },
            { month: "2024-03", amountMinor: 250_000 },
          ],
        },
      },
    })
    await expect(
      (
        await userApi(
          "/api/revenue-sources?scheduleType=variable&category=freelance&asOf=2024-01-01",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      total: 1,
      revenueSources: [
        {
          name: "Design clients",
          cadence: null,
          paymentAnchor: null,
          nextPaymentDate: null,
        },
      ],
    })

    const otherCookie = await createUserSession()
    await expect(
      (await userApi("/api/revenue-sources", otherCookie)).json()
    ).resolves.toMatchObject({ total: 0, revenueSources: [] })
    expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}`,
          otherCookie,
          { method: "PATCH", body: { status: "archived" } }
        )
      ).status
    ).toBe(404)

    await expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}`,
          cookie,
          { method: "PATCH", body: { status: "paused" } }
        )
      ).json()
    ).resolves.toMatchObject({ revenueSource: { status: "paused" } })
    const conflict = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY" },
    })
    await expect(conflict.json()).resolves.toMatchObject({
      error: "currency_change_requires_confirmation",
      revenueSourceCount: 2,
    })
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY", confirmRelabel: true },
    })
    await expect(
      (
        await userApi("/api/revenue-sources?status=all&asOf=2024-01-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      revenueSources: expect.arrayContaining([
        expect.objectContaining({ name: "Primary job", amountMinor: 1000 }),
        expect.objectContaining({ name: "Design clients", amountMinor: 500 }),
      ]),
    })
    expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}?confirm=true`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(204)
  })
})
