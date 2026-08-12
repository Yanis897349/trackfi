import type { Hono } from "hono"
import { z } from "zod"

import { requireUser } from "../authorization"
import { isDateOnly, todayDateOnly } from "../date"
import {
  listRevenueSourceRows,
  serializeRevenueSource,
} from "../revenue-database"
import {
  revenueCategories,
  revenueFilters,
  revenueScheduleTypes,
} from "../revenue-validation"
import type { AppEnv } from "../types"

export function registerRevenueSourceListRoute(app: Hono<AppEnv>) {
  app.get("/api/revenue-sources", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const status = z
      .enum(revenueFilters)
      .safeParse(context.req.query("status") ?? "active")
    const category = optionalEnum(
      context.req.query("category"),
      revenueCategories
    )
    const scheduleType = optionalEnum(
      context.req.query("scheduleType"),
      revenueScheduleTypes
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
    const result = await listRevenueSourceRows(context.env.DB, user.id)
    const sources = result.results
      .filter((source) => {
        const statusMatches =
          status.data === "all" ||
          (status.data === "current"
            ? source.status !== "archived"
            : source.status === status.data)
        return (
          statusMatches &&
          (!category || source.category === category.data) &&
          (!scheduleType || source.schedule_type === scheduleType.data) &&
          (!query ||
            source.name.toLocaleLowerCase().includes(query) ||
            source.notes?.toLocaleLowerCase().includes(query))
        )
      })
      .map((source) => serializeRevenueSource(source, asOf))
      .sort((left, right) => {
        if (left.nextPaymentDate && right.nextPaymentDate) {
          return left.nextPaymentDate.localeCompare(right.nextPaymentDate)
        }
        if (left.nextPaymentDate) return -1
        if (right.nextPaymentDate) return 1
        return left.name.localeCompare(right.name)
      })

    const total = sources.length
    const offset = (page.data - 1) * pageSize.data
    return context.json({
      revenueSources: sources.slice(offset, offset + pageSize.data),
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
