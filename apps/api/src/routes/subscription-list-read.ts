import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { isDateOnly, todayDateOnly } from "../date"
import {
  listSubscriptionRows,
  serializeSubscription,
} from "../subscription-database"
import { subscriptionCadences } from "../subscriptions"
import {
  subscriptionCategories,
  subscriptionFilters,
} from "../subscription-validation"
import type { AppEnv } from "../types"

export function registerSubscriptionListRoute(app: Hono<AppEnv>) {
  app.get("/api/subscriptions", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const filter = z
      .enum(subscriptionFilters)
      .safeParse(context.req.query("status") ?? "current")
    const requestedCategory = context.req.query("category")
    const category = requestedCategory
      ? z.enum(subscriptionCategories).safeParse(requestedCategory)
      : null
    const requestedCadence = context.req.query("cadence")
    const cadence = requestedCadence
      ? z.enum(subscriptionCadences).safeParse(requestedCadence)
      : null
    const page = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(context.req.query("page") ?? "1")
    const pageSize = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .safeParse(context.req.query("pageSize") ?? "25")
    const requestedAsOf = context.req.query("asOf")
    if (
      !filter.success ||
      (category && !category.success) ||
      (cadence && !cadence.success) ||
      !page.success ||
      !pageSize.success ||
      (requestedAsOf && !isDateOnly(requestedAsOf))
    ) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const query = (context.req.query("q") ?? "").trim().toLocaleLowerCase()
    const asOf = requestedAsOf ?? todayDateOnly()
    const result = await listSubscriptionRows(context.env.DB, user.id)
    const subscriptions = result.results
      .filter((subscription) => {
        const statusMatches =
          filter.data === "all" ||
          (filter.data === "current"
            ? subscription.status !== "archived"
            : subscription.status === filter.data)
        const categoryMatches =
          !category || subscription.category === category.data
        const cadenceMatches = !cadence || subscription.cadence === cadence.data
        const queryMatches =
          !query ||
          subscription.name.toLocaleLowerCase().includes(query) ||
          subscription.notes?.toLocaleLowerCase().includes(query)
        return (
          statusMatches && categoryMatches && cadenceMatches && queryMatches
        )
      })
      .map((subscription) => serializeSubscription(subscription, asOf))
      .sort((left, right) =>
        left.nextRenewalDate.localeCompare(right.nextRenewalDate)
      )

    const total = subscriptions.length
    const offset = (page.data - 1) * pageSize.data
    return context.json({
      subscriptions: subscriptions.slice(offset, offset + pageSize.data),
      page: page.data,
      pageSize: pageSize.data,
      total,
    })
  })
}
