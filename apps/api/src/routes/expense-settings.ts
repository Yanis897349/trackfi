import type { Hono } from "hono"

import { requireUser, requireUserMutation } from "../authorization"
import {
  readExpenseSettings,
  saveExpenseSettings,
  serializeExpenseSettings,
} from "../expense-database"
import { expenseSettingsSchema } from "../expense-validation"
import type { AppEnv } from "../types"

export function registerExpenseSettingsRoutes(app: Hono<AppEnv>) {
  app.get("/api/expenses/settings", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const settings = await readExpenseSettings(context.env.DB, user.id)
    return context.json({ settings: serializeExpenseSettings(settings) })
  })

  app.patch("/api/expenses/settings", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const parsed = expenseSettingsSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)
    const settings = await saveExpenseSettings(
      context.env.DB,
      user.id,
      parsed.data
    )
    return context.json({ settings: serializeExpenseSettings(settings) })
  })
}
