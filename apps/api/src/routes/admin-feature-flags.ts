import type { Hono } from "hono"
import { z } from "zod"

import { requireAdmin, requireAdminMutation } from "../authorization"
import { WAITLIST_FLAG } from "../database"
import type { AppEnv } from "../types"

const flagSchema = z.object({ enabled: z.boolean() })

export function registerAdminFeatureFlagRoutes(app: Hono<AppEnv>) {
  app.get("/api/admin/feature-flags", async (context) => {
    const user = await requireAdmin(context)
    if (user instanceof Response) return user

    const flags = await context.env.DB.prepare(
      `SELECT key, enabled, description, updated_at
      FROM feature_flags ORDER BY key`
    ).all<{
      key: string
      enabled: number
      description: string
      updated_at: string
    }>()

    return context.json({
      flags: flags.results.map((flag) => ({
        key: flag.key,
        enabled: Boolean(flag.enabled),
        description: flag.description,
        updatedAt: flag.updated_at,
      })),
    })
  })

  app.patch("/api/admin/feature-flags/:key", async (context) => {
    const user = await requireAdminMutation(context)
    if (user instanceof Response) return user
    if (context.req.param("key") !== WAITLIST_FLAG) {
      return context.json({ error: "unknown_flag" }, 404)
    }

    const parsed = flagSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const updatedAt = new Date().toISOString()
    await context.env.DB.prepare(
      `UPDATE feature_flags SET enabled = ?, updated_at = ?,
        updated_by_user_id = ? WHERE key = ?`
    )
      .bind(parsed.data.enabled ? 1 : 0, updatedAt, user.id, WAITLIST_FLAG)
      .run()

    return context.json({
      flag: { key: WAITLIST_FLAG, enabled: parsed.data.enabled, updatedAt },
    })
  })
}
