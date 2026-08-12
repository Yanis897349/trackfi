import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { isDateOnly } from "../date"
import { listExpenseRows, serializeExpense } from "../expense-database"
import { expenseCategories, expenseStatuses } from "../expense-validation"
import { optionalBoolean, optionalEnum } from "../request-query"
import type { AppEnv } from "../types"

export function registerExpenseListRoute(app: Hono<AppEnv>) {
  app.get("/api/expenses", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const from = context.req.query("from")
    const to = context.req.query("to")
    const category = optionalEnum(
      context.req.query("category"),
      expenseCategories
    )
    const status = optionalEnum(context.req.query("status"), expenseStatuses)
    const pending = optionalBoolean(context.req.query("pending"))
    const missingReceipt = optionalBoolean(context.req.query("missingReceipt"))
    const page = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(context.req.query("page") ?? "1")
    const pageSize = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .safeParse(context.req.query("pageSize") ?? "5")
    if (
      (from && !isDateOnly(from)) ||
      (to && !isDateOnly(to)) ||
      (from && to && from > to) ||
      (category && !category.success) ||
      (status && !status.success) ||
      pending === "invalid" ||
      missingReceipt === "invalid" ||
      !page.success ||
      !pageSize.success
    ) {
      return context.json({ error: "invalid_request" }, 400)
    }
    const query = (context.req.query("q") ?? "").trim().toLocaleLowerCase()
    const result = await listExpenseRows(context.env.DB, user.id)
    const expenses = result.results.filter((expense) => {
      const pendingMatches = pending !== true || expense.status === "pending"
      const receiptMatches =
        missingReceipt !== true ||
        (expense.receipt_key === null && expense.status !== "declined")
      return (
        (!from || expense.transaction_date >= from) &&
        (!to || expense.transaction_date <= to) &&
        (!category || expense.category === category.data) &&
        (!status || expense.status === status.data) &&
        pendingMatches &&
        receiptMatches &&
        (!query ||
          expense.merchant.toLocaleLowerCase().includes(query) ||
          expense.notes?.toLocaleLowerCase().includes(query))
      )
    })
    const total = expenses.length
    const offset = (page.data - 1) * pageSize.data
    return context.json({
      expenses: expenses
        .slice(offset, offset + pageSize.data)
        .map(serializeExpense),
      page: page.data,
      pageSize: pageSize.data,
      total,
    })
  })
}
