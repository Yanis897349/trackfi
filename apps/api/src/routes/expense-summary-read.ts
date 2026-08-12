import type { Hono } from "hono"

import { requireUser } from "../authorization"
import { isDateOnly, todayDateOnly } from "../date"
import { readExpenseSummary } from "../expense-summary"
import type { AppEnv } from "../types"

export function registerExpenseSummaryRoute(app: Hono<AppEnv>) {
  app.get("/api/expenses/summary", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user
    const asOf = context.req.query("asOf") ?? todayDateOnly()
    if (!isDateOnly(asOf))
      return context.json({ error: "invalid_request" }, 400)
    return context.json({
      summary: await readExpenseSummary(context.env.DB, user.id, asOf),
    })
  })
}
