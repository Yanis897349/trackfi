import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { dashboardOverview } from "../dashboard-overview"
import { dateOnlyDayDifference, isDateOnly } from "../date"
import { listExpenseRows, readExpenseSettings } from "../expense-database"
import { listRevenueSourceRows } from "../revenue-database"
import { listSubscriptionRows } from "../subscription-database"
import type { AppEnv } from "../types"

export function registerDashboardOverviewRoute(app: Hono<AppEnv>) {
  app.get("/api/dashboard/overview", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const from = context.req.query("from")
    const to = context.req.query("to")
    const page = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(context.req.query("page") ?? "1")
    const pageSize = z.coerce
      .number()
      .int()
      .min(1)
      .max(25)
      .safeParse(context.req.query("pageSize") ?? "4")
    if (
      !from ||
      !to ||
      !isDateOnly(from) ||
      !isDateOnly(to) ||
      from > to ||
      dateOnlyDayDifference(from, to) > 365 ||
      !page.success ||
      !pageSize.success
    ) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const [currency, expenses, expenseSettings, revenueSources, subscriptions] =
      await Promise.all([
        context.env.DB.prepare(
          "SELECT currency FROM user_settings WHERE user_id = ?"
        )
          .bind(user.id)
          .first<{ currency: string }>(),
        listExpenseRows(context.env.DB, user.id),
        readExpenseSettings(context.env.DB, user.id),
        listRevenueSourceRows(context.env.DB, user.id),
        listSubscriptionRows(context.env.DB, user.id),
      ])

    return context.json({
      overview: dashboardOverview({
        rows: {
          expenses: expenses.results,
          revenueSources: revenueSources.results,
          subscriptions: subscriptions.results,
        },
        currency: currency?.currency ?? null,
        monthlyBudgetMinor: expenseSettings?.monthly_budget_minor ?? null,
        from,
        to,
        page: page.data,
        pageSize: pageSize.data,
      }),
    })
  })
}
