import type { Hono } from "hono"

import { requireUser, requireUserMutation } from "../authorization"
import {
  createExpenseRow,
  deleteExpenseRow,
  findExpenseRow,
  serializeExpense,
  updateExpenseRow,
} from "../expense-database"
import {
  parseExpenseRequest,
  storeReceipt,
  validateReceipt,
} from "../expense-receipts"
import { expenseCreateSchema, expenseUpdateSchema } from "../expense-validation"
import { safeContentDispositionFilename } from "../http"
import type { AppEnv } from "../types"

export function registerExpenseMutationRoutes(app: Hono<AppEnv>) {
  app.get("/api/expenses/:id/receipt", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const expense = await findExpenseRow(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!expense?.receipt_key) return context.json({ error: "not_found" }, 404)
    const receipt = await context.env.EXPENSE_RECEIPTS.get(expense.receipt_key)
    if (!receipt) return context.json({ error: "not_found" }, 404)
    const headers = new Headers()
    receipt.writeHttpMetadata(headers)
    headers.set("Content-Length", String(expense.receipt_size))
    headers.set(
      "Content-Disposition",
      `inline; filename="${safeContentDispositionFilename(expense.receipt_name!)}"`
    )
    headers.set("Cache-Control", "private, no-store")
    return new Response(receipt.body, { headers })
  })

  app.post("/api/expenses", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    const currency = await context.env.DB.prepare(
      "SELECT currency FROM user_settings WHERE user_id = ?"
    )
      .bind(user.id)
      .first<{ currency: string }>()
    if (!currency) return context.json({ error: "currency_required" }, 409)
    const request = await parseExpenseRequest(context)
    const parsed = expenseCreateSchema.safeParse(request.payload)
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)
    if (request.receipt && !(await validateReceipt(request.receipt))) {
      return context.json({ error: "invalid_receipt" }, 400)
    }
    const stored = request.receipt
      ? await storeReceipt(
          context.env.EXPENSE_RECEIPTS,
          user.id,
          request.receipt
        )
      : null
    try {
      const row = await createExpenseRow(
        context.env.DB,
        user.id,
        parsed.data,
        stored
      )
      return context.json({ expense: serializeExpense(row) }, 201)
    } catch (error) {
      if (stored) await context.env.EXPENSE_RECEIPTS.delete(stored.key)
      throw error
    }
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
    const request = await parseExpenseRequest(context)
    const parsed = expenseUpdateSchema.safeParse(request.payload)
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)
    if (request.receipt && !(await validateReceipt(request.receipt))) {
      return context.json({ error: "invalid_receipt" }, 400)
    }
    const stored = request.receipt
      ? await storeReceipt(
          context.env.EXPENSE_RECEIPTS,
          user.id,
          request.receipt
        )
      : parsed.data.removeReceipt
        ? null
        : undefined
    try {
      const row = await updateExpenseRow(
        context.env.DB,
        existing,
        parsed.data,
        stored
      )
      if (
        existing.receipt_key &&
        (request.receipt || parsed.data.removeReceipt)
      ) {
        await context.env.EXPENSE_RECEIPTS.delete(existing.receipt_key)
      }
      return context.json({ expense: serializeExpense(row) })
    } catch (error) {
      if (stored) await context.env.EXPENSE_RECEIPTS.delete(stored.key)
      throw error
    }
  })

  app.delete("/api/expenses/:id", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user
    if (context.req.query("confirm") !== "true") {
      return context.json({ error: "delete_confirmation_required" }, 400)
    }
    const existing = await findExpenseRow(
      context.env.DB,
      user.id,
      context.req.param("id")
    )
    if (!existing) return context.json({ error: "not_found" }, 404)
    await deleteExpenseRow(context.env.DB, user.id, existing.id)
    if (existing.receipt_key) {
      await context.env.EXPENSE_RECEIPTS.delete(existing.receipt_key)
    }
    return context.body(null, 204)
  })
}
