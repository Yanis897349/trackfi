import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { isDateOnly, todayDateOnly } from "../date"
import { listExpenseRows, serializeExpense } from "../expense-database"
import {
  expenseCategories,
  expenseFilters,
  expenseScheduleTypes,
} from "../expense-validation"
import type { AppEnv } from "../types"

export function registerExpenseListRoute(app: Hono<AppEnv>) {
  app.get("/api/expenses", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const status = z
      .enum(expenseFilters)
      .safeParse(context.req.query("status") ?? "active")
    const category = optionalEnum(
      context.req.query("category"),
      expenseCategories
    )
    const scheduleType = optionalEnum(
      context.req.query("scheduleType"),
      expenseScheduleTypes
    )
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
      .safeParse(context.req.query("pageSize") ?? "25")
    const requestedAsOf = context.req.query("asOf")
    if (
      !status.success ||
      (category && !category.success) ||
      (scheduleType && !scheduleType.success) ||
      !page.success ||
      !pageSize.success ||
      (requestedAsOf && !isDateOnly(requestedAsOf))
    ) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const asOf = requestedAsOf ?? todayDateOnly()
    const query = (context.req.query("q") ?? "").trim().toLocaleLowerCase()
    const result = await listExpenseRows(context.env.DB, user.id)
    const expenses = result.results
      .filter((expense) => {
        const statusMatches =
          status.data === "all" ||
          (status.data === "current"
            ? expense.status !== "archived"
            : expense.status === status.data)
        return (
          statusMatches &&
          (!category || expense.category === category.data) &&
          (!scheduleType || expense.schedule_type === scheduleType.data) &&
          (!query ||
            expense.name.toLocaleLowerCase().includes(query) ||
            expense.notes?.toLocaleLowerCase().includes(query))
        )
      })
      .map((expense) => serializeExpense(expense, asOf))
      .sort((left, right) => {
        if (left.nextExpenseDate && right.nextExpenseDate) {
          return left.nextExpenseDate.localeCompare(right.nextExpenseDate)
        }
        if (left.nextExpenseDate) return -1
        if (right.nextExpenseDate) return 1
        return left.name.localeCompare(right.name)
      })

    const total = expenses.length
    const offset = (page.data - 1) * pageSize.data
    return context.json({
      expenses: expenses.slice(offset, offset + pageSize.data),
      page: page.data,
      pageSize: pageSize.data,
      total,
    })
  })
}

function optionalEnum<const Values extends readonly [string, ...string[]]>(
  value: string | undefined,
  values: Values
) {
  return value ? z.enum(values).safeParse(value) : null
}
