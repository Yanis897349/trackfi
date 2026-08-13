import type { Hono } from "hono"

import { requireUser } from "../authorization"
import { dashboardCalendar } from "../dashboard-calendar"
import { readDashboardData } from "../dashboard-data"
import type { AppEnv } from "../types"

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

export function registerDashboardCalendarRoute(app: Hono<AppEnv>) {
  app.get("/api/dashboard/calendar", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const month = context.req.query("month")
    if (!month || !monthPattern.test(month)) {
      return context.json({ error: "invalid_request" }, 400)
    }

    const data = await readDashboardData(context.env.DB, user.id)
    return context.json({
      calendar: dashboardCalendar({
        rows: data.rows,
        currency: data.currency,
        month,
      }),
    })
  })
}
