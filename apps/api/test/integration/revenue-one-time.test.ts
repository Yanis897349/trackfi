import { describe, expect, it } from "vitest"

import { revenueBody } from "../support/fixtures"
import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("one-time revenue", () => {
  it("forecasts one-time revenue exactly once", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })

    const created = await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody({
        name: "Signing bonus",
        amountMinor: 120_000,
        cadence: "once",
        paymentAnchor: "2099-02-10",
      }),
    })
    expect(created.status).toBe(201)
    await expect(created.json()).resolves.toMatchObject({
      revenueSource: {
        cadence: "once",
        nextPaymentDate: "2099-02-10",
        annualEquivalentMinor: 120_000,
        monthlyEquivalentMinor: 10_000,
      },
    })

    await expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2099-01-20&months=3",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      summary: {
        activeCount: 1,
        upcomingCount: 1,
        upcomingTotalMinor: 120_000,
        forecast: {
          totalMinor: 120_000,
          previousMonthMinor: 0,
          series: [
            { month: "2099-01", amountMinor: 0 },
            { month: "2099-02", amountMinor: 120_000 },
            { month: "2099-03", amountMinor: 0 },
          ],
        },
        upcomingIncome: [
          {
            name: "Signing bonus",
            cadence: "once",
            expectedDate: "2099-02-10",
          },
        ],
      },
    })

    await expect(
      (
        await userApi(
          "/api/revenue-sources?status=active&asOf=2099-03-01",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      revenueSources: [
        {
          name: "Signing bonus",
          nextPaymentDate: null,
          annualEquivalentMinor: 0,
          monthlyEquivalentMinor: 0,
        },
      ],
    })
    await expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2099-03-01&months=3",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      summary: {
        activeCount: 1,
        annualEquivalentMinor: 0,
        sourceBreakdown: [],
        upcomingIncome: [],
        forecast: { totalMinor: 0 },
      },
    })
  })
})
