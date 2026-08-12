import type { Hono } from "hono"

import { requireUser } from "../authorization"
import { isDateOnly, todayDateOnly } from "../date"
import { readExpenseSummary } from "../expense-summary"
import type { ExpenseForecastMonths } from "../expenses"
import type { AppEnv } from "../types"

export function registerExpenseSummaryRoute(app: Hono<AppEnv>) {
  app.get("/api/expenses/summary", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const requestedAsOf = context.req.query("asOf")
    const requestedMonths = context.req.query("months") ?? "6"
    if (
      (requestedAsOf && !isDateOnly(requestedAsOf)) ||
      !["3", "6", "12"].includes(requestedMonths)
    ) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const summary = await readExpenseSummary(
      context.env.DB,
      user.id,
      requestedAsOf ?? todayDateOnly(),
      Number(requestedMonths) as ExpenseForecastMonths
    )
    return context.json({ summary })
  })
}
