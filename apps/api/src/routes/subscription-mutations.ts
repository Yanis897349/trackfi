import type { Hono } from "hono"

import { requireUserMutation } from "../authorization"
import { todayDateOnly } from "../date"
import {
  createSubscriptionRow,
  deleteSubscriptionRow,
  findSubscriptionRow,
  serializeSubscription,
  updateSubscriptionRow,
} from "../subscription-database"
import {
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
} from "../subscription-validation"
import type { AppEnv } from "../types"

export function registerSubscriptionMutationRoutes(app: Hono<AppEnv>) {
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
      parsed.data,
      currency.currency
    )
    return context.json(
      { subscription: serializeSubscription(row, todayDateOnly()) },
      201
    )
  })

  app.patch("/api/subscriptions/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const [existing, currency] = await Promise.all([
      findSubscriptionRow(context.env.DB, user.id, context.req.param("id")),
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
    ])
    if (!existing) return context.json({ error: "not_found" }, 404)
    if (!currency) return context.json({ error: "currency_required" }, 409)

    const parsed = subscriptionUpdateSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const row = await updateSubscriptionRow(
      context.env.DB,
      existing,
      parsed.data,
      currency.currency
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
    const [existing, currency] = await Promise.all([
      findSubscriptionRow(context.env.DB, user.id, context.req.param("id")),
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
    ])
    if (!existing) return context.json({ error: "not_found" }, 404)
    if (!currency) return context.json({ error: "currency_required" }, 409)
    const [result] = await deleteSubscriptionRow(
      context.env.DB,
      user.id,
      context.req.param("id"),
      currency.currency
    )
    if (!result?.meta.changes) return context.json({ error: "not_found" }, 404)
    return context.body(null, 204)
  })
}
