import type { Hono } from "hono"

import { requireUser } from "../authorization"
import {
  addDateOnlyDays,
  isDateOnly,
  subtractUtcCalendarMonth,
  todayDateOnly,
} from "../date"
import {
  listSubscriptionRows,
  serializeSubscription,
} from "../subscription-database"
import {
  annualEquivalentMinor,
  monthlyEquivalentMinor,
  renewalDatesInRange,
} from "../subscriptions"
import type { AppEnv } from "../types"

export function registerSubscriptionSummaryRoute(app: Hono<AppEnv>) {
  app.get("/api/subscriptions/summary", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const requestedAsOf = context.req.query("asOf")
    if (requestedAsOf && !isDateOnly(requestedAsOf)) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const asOf = requestedAsOf ?? todayDateOnly()
    const [settings, result] = await Promise.all([
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
      listSubscriptionRows(context.env.DB, user.id),
    ])
    const allSubscriptions = result.results.map((subscription) =>
      serializeSubscription(subscription, asOf)
    )
    const subscriptions = allSubscriptions.filter(
      (subscription) => subscription.status === "active"
    )
    const annualMinor = annualEquivalentMinor(subscriptions)
    const monthlyMinor = monthlyEquivalentMinor(subscriptions)
    const through = addDateOnlyDays(asOf, 30)
    const upcoming = subscriptions
      .filter(
        (subscription) =>
          subscription.nextRenewalDate >= asOf &&
          subscription.nextRenewalDate <= through
      )
      .sort((left, right) =>
        left.nextRenewalDate.localeCompare(right.nextRenewalDate)
      )
    const upcomingTotalMinor = subscriptions.reduce(
      (total, subscription) =>
        total +
        renewalDatesInRange(
          subscription.billingAnchor,
          subscription.cadence,
          asOf,
          through
        ).length *
          subscription.amountMinor,
      0
    )
    const comparisonAt = subtractUtcCalendarMonth(new Date()).toISOString()
    let monthlyComparison: { previousMonthlyEquivalentMinor: number } | null =
      null
    if (settings?.currency) {
      const previous = await context.env.DB.prepare(
        `SELECT monthly_equivalent_minor, recorded_at
          FROM subscription_spend_snapshots
          WHERE user_id = ? AND currency = ? AND recorded_at <= ?
          ORDER BY recorded_at DESC LIMIT 1`
      )
        .bind(user.id, settings.currency, comparisonAt)
        .first<{
          monthly_equivalent_minor: number
          recorded_at: string
        }>()
      if (previous) {
        const currencyDiscontinuity = await context.env.DB.prepare(
          `SELECT 1 AS changed FROM subscription_spend_snapshots
            WHERE user_id = ? AND currency != ? AND recorded_at > ? LIMIT 1`
        )
          .bind(user.id, settings.currency, previous.recorded_at)
          .first<{ changed: number }>()
        if (!currencyDiscontinuity) {
          monthlyComparison = {
            previousMonthlyEquivalentMinor: previous.monthly_equivalent_minor,
          }
        }
      }
    }

    return context.json({
      summary: {
        currency: settings?.currency ?? null,
        activeCount: subscriptions.length,
        pausedCount: allSubscriptions.filter(
          (subscription) => subscription.status === "paused"
        ).length,
        activeCategoryCount: new Set(
          subscriptions.map((subscription) => subscription.category)
        ).size,
        monthlyEquivalentMinor: monthlyMinor,
        annualEquivalentMinor: annualMinor,
        upcomingCount: upcoming.length,
        upcomingTotalMinor,
        upcoming,
        monthlyComparison,
      },
    })
  })
}
