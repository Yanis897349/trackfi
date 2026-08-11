import type { Hono } from "hono"
import { z } from "zod"

import { requireUser, requireUserMutation } from "../authorization"
import { addDateOnlyDays, isDateOnly, todayDateOnly } from "../date"
import {
  createSubscriptionRow,
  deleteSubscriptionRow,
  findSubscriptionRow,
  listSubscriptionRows,
  serializeSubscription,
  updateSubscriptionRow,
} from "../subscription-database"
import { annualEquivalentMinor } from "../subscriptions"
import {
  subscriptionCategories,
  subscriptionCreateSchema,
  subscriptionFilters,
  subscriptionUpdateSchema,
} from "../subscription-validation"
import type { AppEnv } from "../types"

export function registerSubscriptionRoutes(app: Hono<AppEnv>) {
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
    const requestedAsOf = context.req.query("asOf")
    if (
      !filter.success ||
      (category && !category.success) ||
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
        const queryMatches =
          !query ||
          subscription.name.toLocaleLowerCase().includes(query) ||
          subscription.notes?.toLocaleLowerCase().includes(query)
        return statusMatches && categoryMatches && queryMatches
      })
      .map((subscription) => serializeSubscription(subscription, asOf))
      .sort((left, right) =>
        left.nextRenewalDate.localeCompare(right.nextRenewalDate)
      )

    return context.json({ subscriptions })
  })

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
      listSubscriptionRows(context.env.DB, user.id, true),
    ])
    const subscriptions = result.results.map((subscription) =>
      serializeSubscription(subscription, asOf)
    )
    const annualMinor = annualEquivalentMinor(subscriptions)
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

    return context.json({
      summary: {
        currency: settings?.currency ?? null,
        activeCount: subscriptions.length,
        monthlyEquivalentMinor: Math.round(annualMinor / 12),
        annualEquivalentMinor: annualMinor,
        upcomingCount: upcoming.length,
        upcoming,
      },
    })
  })

  app.post("/api/subscriptions", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const currency = await context.env.DB.prepare(
      "SELECT currency FROM user_settings WHERE user_id = ?"
    )
      .bind(user.id)
      .first<{ currency: string }>()
    if (!currency) return context.json({ error: "currency_required" }, 409)

    const parsed = subscriptionCreateSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const row = await createSubscriptionRow(
      context.env.DB,
      user.id,
      parsed.data
    )
    return context.json(
      { subscription: serializeSubscription(row, todayDateOnly()) },
      201
    )
  })

  app.patch("/api/subscriptions/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const existing = await findSubscriptionRow(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!existing) return context.json({ error: "not_found" }, 404)

    const parsed = subscriptionUpdateSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const row = await updateSubscriptionRow(
      context.env.DB,
      existing,
      parsed.data
    )
    return context.json({
      subscription: serializeSubscription(row, todayDateOnly()),
    })
  })

  app.delete("/api/subscriptions/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    if (context.req.query("confirm") !== "true") {
      return context.json({ error: "delete_confirmation_required" }, 400)
    }
    const result = await deleteSubscriptionRow(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!result.meta.changes) return context.json({ error: "not_found" }, 404)
    return context.body(null, 204)
  })
}
