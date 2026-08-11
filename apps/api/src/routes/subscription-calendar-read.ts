import type { Hono } from "hono"

import { requireUser } from "../authorization"
import { isDateOnly, todayDateOnly } from "../date"
import { subscriptionCalendarRange } from "../subscription-calendar"
import { listSubscriptionRows } from "../subscription-database"
import { renewalDatesInRange } from "../subscriptions"
import type { AppEnv } from "../types"

export function registerSubscriptionCalendarRoute(app: Hono<AppEnv>) {
  app.get("/api/subscriptions/calendar", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const month = context.req.query("month") ?? todayDateOnly().slice(0, 7)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !isDateOnly(`${month}-01`)) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const { monthStart, monthEnd, rangeStart, rangeEnd } =
      subscriptionCalendarRange(month)
    const [settings, result] = await Promise.all([
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
      listSubscriptionRows(context.env.DB, user.id, true),
    ])
    const renewals = result.results
      .flatMap((subscription) =>
        renewalDatesInRange(
          subscription.billing_anchor,
          subscription.cadence,
          rangeStart,
          rangeEnd
        ).map((renewalDate) => ({
          id: `${subscription.id}:${renewalDate}`,
          subscriptionId: subscription.id,
          name: subscription.name,
          amountMinor: subscription.amount_minor,
          cadence: subscription.cadence,
          category: subscription.category,
          websiteUrl: subscription.website_url,
          renewalDate,
        }))
      )
      .sort(
        (left, right) =>
          left.renewalDate.localeCompare(right.renewalDate) ||
          left.name.localeCompare(right.name)
      )
    const monthRenewals = renewals.filter(
      (renewal) =>
        renewal.renewalDate >= monthStart && renewal.renewalDate <= monthEnd
    )

    return context.json({
      calendar: {
        month,
        rangeStart,
        rangeEnd,
        currency: settings?.currency ?? null,
        renewalCount: renewals.length,
        totalMinor: renewals.reduce(
          (total, renewal) => total + renewal.amountMinor,
          0
        ),
        categoryCount: new Set(renewals.map((renewal) => renewal.category))
          .size,
        monthTotalMinor: monthRenewals.reduce(
          (total, renewal) => total + renewal.amountMinor,
          0
        ),
        renewals,
      },
    })
  })
}
