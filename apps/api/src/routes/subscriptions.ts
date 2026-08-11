import type { Hono } from "hono"
import { z } from "zod"

import { requireUser, requireUserMutation } from "../authorization"
import {
  addDays,
  annualEquivalentMinor,
  isDateOnly,
  nextRenewalDate,
  subscriptionCadences,
  type SubscriptionCadence,
} from "../subscriptions"
import type { AppEnv } from "../types"

const categories = [
  "software",
  "entertainment",
  "utilities",
  "finance",
  "health",
  "education",
  "shopping",
  "other",
] as const
const statuses = ["active", "paused", "archived"] as const
const filters = ["current", ...statuses, "all"] as const

const websiteSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true
    try {
      const url = new URL(value)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  })

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  cadence: z.enum(subscriptionCadences),
  billingAnchor: z.string().refine(isDateOnly),
  category: z.enum(categories),
  websiteUrl: websiteSchema.optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
})
const updateSchema = createSchema
  .partial()
  .extend({ status: z.enum(statuses).optional() })
  .refine((value) => Object.keys(value).length > 0)

interface SubscriptionRow {
  id: string
  user_id: string
  name: string
  amount_minor: number
  cadence: SubscriptionCadence
  billing_anchor: string
  category: (typeof categories)[number]
  website_url: string | null
  notes: string | null
  status: (typeof statuses)[number]
  created_at: string
  updated_at: string
}

export function registerSubscriptionRoutes(app: Hono<AppEnv>) {
  app.get("/api/subscriptions", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const filter = z
      .enum(filters)
      .safeParse(context.req.query("status") ?? "current")
    if (!filter.success) return context.json({ error: "invalid_request" }, 400)
    const requestedCategory = context.req.query("category")
    const category = requestedCategory
      ? z.enum(categories).safeParse(requestedCategory)
      : null
    if (category && !category.success)
      return context.json({ error: "invalid_request" }, 400)
    const query = (context.req.query("q") ?? "").trim().toLocaleLowerCase()
    const requestedAsOf = context.req.query("asOf")
    if (requestedAsOf && !isDateOnly(requestedAsOf))
      return context.json({ error: "invalid_request" }, 400)
    const asOf = requestedAsOf ?? today()
    const result = await context.env.DB.prepare(
      `SELECT id, user_id, name, amount_minor, cadence, billing_anchor,
        category, website_url, notes, status, created_at, updated_at
      FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC`
    )
      .bind(user.id)
      .all<SubscriptionRow>()

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
    if (requestedAsOf && !isDateOnly(requestedAsOf))
      return context.json({ error: "invalid_request" }, 400)
    const asOf = requestedAsOf ?? today()
    const [settings, result] = await Promise.all([
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
      context.env.DB.prepare(
        `SELECT id, user_id, name, amount_minor, cadence, billing_anchor,
          category, website_url, notes, status, created_at, updated_at
        FROM subscriptions WHERE user_id = ? AND status = 'active'`
      )
        .bind(user.id)
        .all<SubscriptionRow>(),
    ])
    const subscriptions = result.results.map((subscription) =>
      serializeSubscription(subscription, asOf)
    )
    const annualMinor = annualEquivalentMinor(subscriptions)
    const through = addDays(asOf, 30)
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

    const parsed = createSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const data = parsed.data
    await context.env.DB.prepare(
      `INSERT INTO subscriptions
        (id, user_id, name, amount_minor, cadence, billing_anchor, category,
          website_url, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(
        id,
        user.id,
        data.name,
        data.amountMinor,
        data.cadence,
        data.billingAnchor,
        data.category,
        data.websiteUrl || null,
        data.notes || null,
        now,
        now
      )
      .run()
    const row = await findOwnedSubscription(context.env.DB, user.id, id)
    return context.json(
      { subscription: serializeSubscription(row!, today()) },
      201
    )
  })

  app.patch("/api/subscriptions/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const id = context.req.param("id")
    const existing = await findOwnedSubscription(context.env.DB, user.id, id)
    if (!existing) return context.json({ error: "not_found" }, 404)

    const parsed = updateSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)
    const data = parsed.data
    const next = {
      name: data.name ?? existing.name,
      amountMinor: data.amountMinor ?? existing.amount_minor,
      cadence: data.cadence ?? existing.cadence,
      billingAnchor: data.billingAnchor ?? existing.billing_anchor,
      category: data.category ?? existing.category,
      websiteUrl:
        data.websiteUrl === undefined
          ? existing.website_url
          : data.websiteUrl || null,
      notes: data.notes === undefined ? existing.notes : data.notes || null,
      status: data.status ?? existing.status,
    }
    const updatedAt = new Date().toISOString()
    await context.env.DB.prepare(
      `UPDATE subscriptions SET name = ?, amount_minor = ?, cadence = ?,
        billing_anchor = ?, category = ?, website_url = ?, notes = ?,
        status = ?, updated_at = ?
      WHERE id = ? AND user_id = ?`
    )
      .bind(
        next.name,
        next.amountMinor,
        next.cadence,
        next.billingAnchor,
        next.category,
        next.websiteUrl,
        next.notes,
        next.status,
        updatedAt,
        id,
        user.id
      )
      .run()
    const row = await findOwnedSubscription(context.env.DB, user.id, id)
    return context.json({ subscription: serializeSubscription(row!, today()) })
  })

  app.delete("/api/subscriptions/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    if (context.req.query("confirm") !== "true") {
      return context.json({ error: "delete_confirmation_required" }, 400)
    }
    const result = await context.env.DB.prepare(
      "DELETE FROM subscriptions WHERE id = ? AND user_id = ?"
    )
      .bind(context.req.param("id"), user.id)
      .run()
    if (!result.meta.changes) return context.json({ error: "not_found" }, 404)
    return context.body(null, 204)
  })
}

async function findOwnedSubscription(
  database: D1Database,
  userId: string,
  id: string
) {
  return database
    .prepare(
      `SELECT id, user_id, name, amount_minor, cadence, billing_anchor,
        category, website_url, notes, status, created_at, updated_at
      FROM subscriptions WHERE id = ? AND user_id = ?`
    )
    .bind(id, userId)
    .first<SubscriptionRow>()
}

function serializeSubscription(row: SubscriptionRow, asOf: string) {
  return {
    id: row.id,
    name: row.name,
    amountMinor: row.amount_minor,
    cadence: row.cadence,
    billingAnchor: row.billing_anchor,
    nextRenewalDate: nextRenewalDate(row.billing_anchor, row.cadence, asOf),
    category: row.category,
    websiteUrl: row.website_url,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
