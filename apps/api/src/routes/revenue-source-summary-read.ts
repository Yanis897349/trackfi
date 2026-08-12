import type { Hono } from "hono"

import { requireUser } from "../authorization"
import { addDateOnlyDays, isDateOnly, todayDateOnly } from "../date"
import {
  listRevenueSourceRows,
  serializeRevenueSource,
} from "../revenue-database"
import { revenuePaymentDatesInRange, type RevenueCadence } from "../revenue"
import type { AppEnv } from "../types"

export function registerRevenueSourceSummaryRoute(app: Hono<AppEnv>) {
  app.get("/api/revenue-sources/summary", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const requestedAsOf = context.req.query("asOf")
    if (requestedAsOf && !isDateOnly(requestedAsOf)) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const asOf = requestedAsOf ?? todayDateOnly()
    const through = addDateOnlyDays(asOf, 30)
    const [settings, result] = await Promise.all([
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
      listRevenueSourceRows(context.env.DB, user.id),
    ])
    const allSources = result.results.map((source) =>
      serializeRevenueSource(source, asOf)
    )
    const active = allSources.filter((source) => source.status === "active")
    const annualEquivalentMinor = active.reduce(
      (total, source) => total + source.annualEquivalentMinor,
      0
    )
    const upcoming = active
      .flatMap((source) =>
        source.scheduleType === "scheduled"
          ? revenuePaymentDatesInRange(
              source.paymentAnchor!,
              source.cadence as RevenueCadence,
              asOf,
              through
            ).map((paymentDate) => ({
              id: `${source.id}:${paymentDate}`,
              sourceId: source.id,
              name: source.name,
              category: source.category,
              amountMinor: source.amountMinor,
              paymentDate,
            }))
          : []
      )
      .sort((left, right) => left.paymentDate.localeCompare(right.paymentDate))
    const sourceBreakdown = active
      .map((source) => ({
        sourceId: source.id,
        name: source.name,
        category: source.category,
        monthlyEquivalentMinor: source.monthlyEquivalentMinor,
      }))
      .sort(
        (left, right) =>
          right.monthlyEquivalentMinor - left.monthlyEquivalentMinor
      )

    return context.json({
      summary: {
        currency: settings?.currency ?? null,
        activeCount: active.length,
        pausedCount: allSources.filter((source) => source.status === "paused")
          .length,
        variableCount: active.filter(
          (source) => source.scheduleType === "variable"
        ).length,
        activeCategoryCount: new Set(active.map((source) => source.category))
          .size,
        monthlyEquivalentMinor: Math.round(annualEquivalentMinor / 12),
        annualEquivalentMinor,
        upcomingCount: upcoming.length,
        upcomingTotalMinor: upcoming.reduce(
          (total, occurrence) => total + occurrence.amountMinor,
          0
        ),
        sourceBreakdown,
        upcoming,
      },
    })
  })
}
