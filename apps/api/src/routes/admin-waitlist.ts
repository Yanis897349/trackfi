import type { Hono } from "hono"

import { requireAdmin, requireAdminMutation } from "../authorization"
import { sendInvitationResponse } from "../invitations"
import type { AppEnv, WaitlistEntryRow } from "../types"

export function registerAdminWaitlistRoutes(app: Hono<AppEnv>) {
  app.get("/api/admin/waitlist", async (context) => {
    const user = await requireAdmin(context)
    if (user instanceof Response) return user

    const page = Math.max(1, Number(context.req.query("page") ?? "1") || 1)
    const pageSize = 25
    const requestedStatus = context.req.query("status") ?? "all"
    const status = ["pending", "approved", "registered"].includes(
      requestedStatus
    )
      ? requestedStatus
      : null
    const where = status ? "WHERE status = ?" : ""
    const countStatement = context.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM waitlist_entries ${where}`
    )
    const entriesStatement = context.env.DB.prepare(
      `SELECT id, email, status, created_at, approved_at, invite_expires_at,
        invite_sent_at, invite_delivery_status, registered_at
      FROM waitlist_entries ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    const countQuery = status ? countStatement.bind(status) : countStatement
    const entriesQuery = status
      ? entriesStatement.bind(status, pageSize, (page - 1) * pageSize)
      : entriesStatement.bind(pageSize, (page - 1) * pageSize)
    const [count, entries] = await Promise.all([
      countQuery.first<{ total: number }>(),
      entriesQuery.all<WaitlistEntryRow>(),
    ])

    return context.json({
      entries: entries.results,
      page,
      pageSize,
      total: count?.total ?? 0,
    })
  })

  app.post("/api/admin/waitlist/:id/approve", async (context) => {
    const user = await requireAdminMutation(context)
    if (user instanceof Response) return user

    const entry = await findEntry(context.env.DB, context.req.param("id"))
    if (!entry) return context.json({ error: "not_found" }, 404)
    if (entry.status === "registered") {
      return context.json({ error: "already_registered" }, 409)
    }

    const approval = await context.env.DB.prepare(
      `UPDATE waitlist_entries
      SET status = 'approved', approved_at = COALESCE(approved_at, ?),
        approved_by_user_id = COALESCE(approved_by_user_id, ?)
      WHERE id = ? AND status = 'pending'`
    )
      .bind(new Date().toISOString(), user.id, entry.id)
      .run()

    if (approval.meta.changes === 0) {
      return context.json({ sent: true, alreadyApproved: true })
    }

    return sendInvitationResponse(context, entry.id)
  })

  app.post("/api/admin/waitlist/:id/resend-invite", async (context) => {
    const user = await requireAdminMutation(context)
    if (user instanceof Response) return user

    const entry = await findEntry(context.env.DB, context.req.param("id"))
    if (!entry) return context.json({ error: "not_found" }, 404)
    if (entry.status !== "approved") {
      return context.json({ error: "not_approved" }, 409)
    }

    return sendInvitationResponse(context, entry.id)
  })
}

function findEntry(database: D1Database, id: string) {
  return database
    .prepare("SELECT id, status FROM waitlist_entries WHERE id = ?")
    .bind(id)
    .first<{ id: string; status: string }>()
}
