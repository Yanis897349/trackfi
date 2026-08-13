import type { Hono } from "hono"
import { z } from "zod"

import { requireUser, requireUserMutation } from "../authorization"
import type { AppEnv } from "../types"

const notificationSettingsSchema = z.object({
  budgetAlertsEnabled: z.boolean(),
})

export function registerNotificationSettingsRoutes(app: Hono<AppEnv>) {
  app.get("/api/settings/notifications", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const preferences = await context.env.DB.prepare(
      `SELECT budget_alerts_enabled, updated_at FROM notification_preferences
      WHERE user_id = ?`
    )
      .bind(user.id)
      .first<{ budget_alerts_enabled: number; updated_at: string }>()

    return context.json({
      preferences: {
        budgetAlertsEnabled: preferences?.budget_alerts_enabled !== 0,
        updatedAt: preferences?.updated_at ?? null,
      },
    })
  })

  app.patch("/api/settings/notifications", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user

    const parsed = notificationSettingsSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const now = new Date().toISOString()
    const savePreferences = context.env.DB.prepare(
      `INSERT INTO notification_preferences
      (user_id, budget_alerts_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        budget_alerts_enabled = excluded.budget_alerts_enabled,
        updated_at = excluded.updated_at`
    ).bind(user.id, parsed.data.budgetAlertsEnabled ? 1 : 0, now, now)

    if (parsed.data.budgetAlertsEnabled) {
      await savePreferences.run()
    } else {
      const deleteUnsentDeliveries = context.env.DB.prepare(
        `DELETE FROM notification_deliveries
        WHERE status != 'sent' AND notification_id IN (
          SELECT id FROM notifications WHERE user_id = ? AND type IN (
            'expense_budget_approaching', 'expense_budget_limit'
          )
        )`
      ).bind(user.id)
      await context.env.DB.batch([savePreferences, deleteUnsentDeliveries])
    }

    return context.json({
      preferences: {
        budgetAlertsEnabled: parsed.data.budgetAlertsEnabled,
        updatedAt: now,
      },
    })
  })
}
