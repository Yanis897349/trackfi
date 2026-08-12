import type { Hono } from "hono"

import { requireUserMutation } from "../authorization"
import { todayDateOnly } from "../date"
import {
  createExpenseRow,
  deleteExpenseRow,
  findExpenseRow,
  resolveExpenseUpdate,
  serializeExpense,
  updateExpenseRow,
} from "../expense-database"
import { expenseCreateSchema, expenseUpdateSchema } from "../expense-validation"
import type { AppEnv } from "../types"

export function registerExpenseMutationRoutes(app: Hono<AppEnv>) {
  app.post("/api/expenses", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const currency = await context.env.DB.prepare(
      "SELECT currency FROM user_settings WHERE user_id = ?"
    )
      .bind(user.id)
      .first<{ currency: string }>()
    if (!currency) return context.json({ error: "currency_required" }, 409)
    const parsed = expenseCreateSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)
    const row = await createExpenseRow(context.env.DB, user.id, parsed.data)
    return context.json(
      { expense: serializeExpense(row, todayDateOnly()) },
      201
    )
  })

  app.patch("/api/expenses/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const existing = await findExpenseRow(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!existing) return context.json({ error: "not_found" }, 404)
    const parsed = expenseUpdateSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)
    const resolved = resolveExpenseUpdate(existing, parsed.data)
    if (!resolved.success) {
      return context.json({ error: "invalid_request" }, 400)
    }
    const row = await updateExpenseRow(
      context.env.DB,
      existing,
      resolved.data,
      parsed.data.status ?? existing.status
    )
    return context.json({
      expense: serializeExpense(row, todayDateOnly()),
    })
  })

  app.delete("/api/expenses/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    if (context.req.query("confirm") !== "true") {
      return context.json({ error: "delete_confirmation_required" }, 400)
    }
    const result = await deleteExpenseRow(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!result.meta.changes) return context.json({ error: "not_found" }, 404)
    return context.body(null, 204)
  })
}
