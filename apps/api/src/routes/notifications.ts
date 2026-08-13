import type { Hono } from "hono"
import { z } from "zod"

import { requireUser, requireUserMutation } from "../authorization"
import {
  listNotificationRows,
  markAllNotificationsRead,
  markNotificationRead,
  serializeNotification,
  unreadNotificationCount,
} from "../notification-database"
import { notificationTypes } from "../notification-types"
import type { AppEnv } from "../types"

const statuses = ["all", "unread", "read"] as const
const ranges = ["7d", "30d", "90d", "all"] as const

export function registerNotificationRoutes(app: Hono<AppEnv>) {
  app.get("/api/notifications/unread-count", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const result = await unreadNotificationCount(context.env.DB, user.id)
    return context.json({ unreadCount: result?.count ?? 0 })
  })

  app.get("/api/notifications", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const parsed = z
      .object({
        q: z.string().trim().max(100).default(""),
        status: z.enum(statuses).default("all"),
        type: z.enum(["all", ...notificationTypes] as const).default("all"),
        range: z.enum(ranges).default("30d"),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(6),
      })
      .safeParse({
        q: context.req.query("q"),
        status: context.req.query("status"),
        type: context.req.query("type"),
        range: context.req.query("range"),
        page: context.req.query("page"),
        pageSize: context.req.query("pageSize"),
      })
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const result = await listNotificationRows(context.env.DB, user.id)
    const serialized = result.results.map((row) => ({
      row,
      value: serializeNotification(row, user.locale),
    }))
    const query = parsed.data.q.toLocaleLowerCase(
      user.locale === "fr" ? "fr-FR" : "en-US"
    )
    const cutoff = rangeCutoff(parsed.data.range)
    const filtered = serialized.filter(({ row, value }) => {
      const statusMatches =
        parsed.data.status === "all" ||
        (parsed.data.status === "unread" && !row.read_at) ||
        (parsed.data.status === "read" && Boolean(row.read_at))
      const typeMatches =
        parsed.data.type === "all" || row.type === parsed.data.type
      const rangeMatches = !cutoff || row.created_at >= cutoff
      const queryMatches =
        !query ||
        value.title.toLocaleLowerCase().includes(query) ||
        value.description.toLocaleLowerCase().includes(query)
      return statusMatches && typeMatches && rangeMatches && queryMatches
    })
    const total = filtered.length
    const offset = (parsed.data.page - 1) * parsed.data.pageSize
    const weekStart = isoWeekStart()
    return context.json({
      notifications: filtered
        .slice(offset, offset + parsed.data.pageSize)
        .map(({ value }) => value),
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      total,
      summary: {
        total: result.results.length,
        unread: result.results.filter((row) => !row.read_at).length,
        thisWeek: result.results.filter((row) => row.created_at >= weekStart)
          .length,
      },
    })
  })

  app.patch("/api/notifications/read-all", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const updatedCount = await markAllNotificationsRead(context.env.DB, user.id)
    return context.json({ updatedCount, unreadCount: 0 })
  })

  app.patch("/api/notifications/:id/read", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const notification = await markNotificationRead(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!notification) return context.json({ error: "not_found" }, 404)
    return context.json({
      notification: serializeNotification(notification, user.locale),
    })
  })
}

function rangeCutoff(range: (typeof ranges)[number]) {
  if (range === "all") return null
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function isoWeekStart() {
  const now = new Date()
  const day = now.getUTCDay() || 7
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - day + 1
    )
  ).toISOString()
}
