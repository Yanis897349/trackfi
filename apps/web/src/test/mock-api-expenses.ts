import type { MockApiHandler } from "./mock-api-types"

export function createExpenseMock(
  expenses: Array<Record<string, unknown>>,
  currency: string | null
): MockApiHandler {
  const records = expenses.map((expense) => ({ ...expense }))

  return ({ init, method, url }) => {
    if (url.includes("/api/expenses/settings")) {
      return {
        body: {
          settings: {
            monthlyBudgetMinor: 500000,
            dailyTargetMinor: 8000,
            budgetPeriod: "monthly",
            resetDay: 1,
            rolloverEnabled: false,
            approachingThreshold: 80,
            limitThreshold: 100,
            updatedAt: null,
          },
        },
      }
    }

    if (url.includes("/api/expenses/summary")) {
      const included = records.filter(
        (expense) => expense.status !== "declined"
      )
      const spentMinor = included.reduce(
        (total, expense) => total + Number(expense.amountMinor ?? 0),
        0
      )
      const categoryTotals = new Map<string, number>()
      for (const item of included) {
        const category = String(item.category ?? "other")
        const value = Number(item.amountMinor ?? 0)
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + value
        )
      }
      return {
        body: {
          summary: {
            currency,
            settings: {
              monthlyBudgetMinor: 500000,
              dailyTargetMinor: 8000,
              budgetPeriod: "monthly",
              resetDay: 1,
              rolloverEnabled: false,
              approachingThreshold: 80,
              limitThreshold: 100,
              updatedAt: null,
            },
            period: {
              start: "2026-08-01",
              end: "2026-08-31",
              elapsedDays: 12,
              totalDays: 31,
              remainingDays: 19,
            },
            spentMinor,
            dailyPaceMinor: Math.round(spentMinor / 12),
            remainingMinor: 500000 - spentMinor,
            forecastMinor: Math.round((spentMinor / 12) * 31),
            rolloverMinor: 0,
            effectiveBudgetMinor: 500000,
            targetToDateMinor: 193548,
            recommendedDailyMinor: Math.max(
              0,
              Math.round((500000 - spentMinor) / 19)
            ),
            pace: spentMinor > 193548 ? "above" : "below",
            pendingCount: included.filter(
              (expense) => expense.status === "pending"
            ).length,
            missingReceiptCount: included.filter((expense) => !expense.receipt)
              .length,
            categoryBreakdown: Array.from(
              categoryTotals,
              ([category, totalMinor]) => ({ category, totalMinor })
            ),
          },
        },
      }
    }

    if (!url.includes("/api/expenses")) return undefined

    const requestUrl = new URL(url, "https://trackfi.test")
    if (method === "DELETE") {
      const id = requestUrl.pathname.split("/").at(-1)
      const index = records.findIndex((record) => record.id === id)
      if (index >= 0) records.splice(index, 1)
      return { body: {}, status: 204 }
    }
    if (method === "PATCH") {
      const id = requestUrl.pathname.split("/").at(-1)
      const expense = records.find((record) => record.id === id)
      const update = typeof init?.body === "string" ? JSON.parse(init.body) : {}
      if (expense) Object.assign(expense, update)
      return { body: { expense } }
    }
    if (method === "POST") {
      const input = typeof init?.body === "string" ? JSON.parse(init.body) : {}
      const expense = {
        id: `expense-${records.length + 1}`,
        ...input,
        receipt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      records.push(expense)
      return { body: { expense }, status: 201 }
    }

    const statusFilter = requestUrl.searchParams.get("status")
    const category = requestUrl.searchParams.get("category")
    const pending = requestUrl.searchParams.get("pending") === "true"
    const missingReceipt =
      requestUrl.searchParams.get("missingReceipt") === "true"
    const query = (requestUrl.searchParams.get("q") ?? "").toLowerCase()
    const page = Number(requestUrl.searchParams.get("page") ?? "1")
    const pageSize = Number(requestUrl.searchParams.get("pageSize") ?? "25")
    const filtered = records.filter((expense) => {
      return (
        (!statusFilter || expense.status === statusFilter) &&
        (!category || expense.category === category) &&
        (!pending || expense.status === "pending") &&
        (!missingReceipt ||
          (!expense.receipt && expense.status !== "declined")) &&
        (!query || String(expense.merchant).toLowerCase().includes(query))
      )
    })
    const offset = (page - 1) * pageSize
    return {
      body: {
        expenses: filtered.slice(offset, offset + pageSize),
        page,
        pageSize,
        total: filtered.length,
      },
    }
  }
}
