import type { MockApiHandler } from "./mock-api-types"

export function createDashboardMock({
  currency,
  expenses,
  revenueSources,
  subscriptions,
}: {
  currency: string | null
  expenses: Array<Record<string, unknown>>
  revenueSources: Array<Record<string, unknown>>
  subscriptions: Array<Record<string, unknown>>
}): MockApiHandler {
  return ({ url }) => {
    const isCalendar = url.includes("/api/dashboard/calendar")
    if (!isCalendar && !url.includes("/api/dashboard/overview")) {
      return undefined
    }
    const requestUrl = new URL(url, "https://trackfi.test")
    const month = requestUrl.searchParams.get("month") ?? "2026-08"
    const from = isCalendar
      ? `${month}-01`
      : (requestUrl.searchParams.get("from") ?? "2026-08-01")
    const to = isCalendar
      ? monthEnd(from)
      : (requestUrl.searchParams.get("to") ?? "2026-08-31")
    const page = Number(requestUrl.searchParams.get("page") ?? 1)
    const pageSize = Number(requestUrl.searchParams.get("pageSize") ?? 4)
    const activities = [
      ...subscriptions.flatMap((subscription) => {
        const date = String(subscription.nextRenewalDate ?? "")
        return date >= from && date <= to
          ? [
              {
                id: `subscriptions:${subscription.id}:${date}`,
                sourceId: subscription.id,
                date,
                label: subscription.name,
                module: "subscriptions",
                direction: "out",
                amountMinor: subscription.amountMinor,
                status: "scheduled",
              },
            ]
          : []
      }),
      ...revenueSources.flatMap((source) => {
        const date = String(source.nextPaymentDate ?? "")
        return date >= from && date <= to
          ? [
              {
                id: `revenue:${source.id}:${date}`,
                sourceId: source.id,
                date,
                label: source.name,
                module: "revenue",
                direction: "in",
                amountMinor: source.amountMinor,
                status: "scheduled",
              },
            ]
          : []
      }),
      ...expenses.flatMap((expense) => {
        const date = String(expense.transactionDate ?? "")
        return expense.status !== "declined" && date >= from && date <= to
          ? [
              {
                id: `expenses:${expense.id}`,
                sourceId: expense.id,
                date,
                label: expense.merchant,
                module: "expenses",
                direction: "out",
                amountMinor: expense.amountMinor,
                status: expense.status,
              },
            ]
          : []
      }),
    ].sort((left, right) => left.date.localeCompare(right.date))
    const income = sum(activities.filter((item) => item.direction === "in"))
    const subscriptionTotal = sum(
      activities.filter((item) => item.module === "subscriptions")
    )
    const expenseTotal = sum(
      activities.filter((item) => item.module === "expenses")
    )
    const revenueTotal = sum(
      activities.filter((item) => item.module === "revenue")
    )
    const series = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(from, index)
      return { from: date, to: date, amountMinor: 0 }
    })
    const offset = (page - 1) * pageSize

    if (isCalendar) {
      return {
        body: {
          calendar: {
            month,
            currency,
            range: { from, to },
            activities,
            activityCount: activities.length,
            inflowMinor: income,
            outflowMinor: subscriptionTotal + expenseTotal,
            netMinor: income - subscriptionTotal - expenseTotal,
            nextMonth: { month: addMonth(month), firstActivity: null },
          },
        },
      }
    }

    return {
      body: {
        overview: {
          range: { from, to, days: 31 },
          currency,
          totals: {
            expectedIncomeMinor: income,
            subscriptionCommitmentMinor: subscriptionTotal,
            expenseMinor: expenseTotal,
            committedMinor: subscriptionTotal + expenseTotal,
            netPositionMinor: income - subscriptionTotal - expenseTotal,
            previousNetPositionMinor: 0,
            comparisonPercent: null,
          },
          movement: series.map((entry) => ({
            ...entry,
            incomeMinor: 0,
            outgoingMinor: 0,
            netMinor: 0,
          })),
          highlights: activities.slice(0, 4),
          modules: {
            subscriptions: {
              totalMinor: subscriptionTotal,
              activeCount: subscriptions.length,
              occurrenceCount: activities.filter(
                (item) => item.module === "subscriptions"
              ).length,
              series,
            },
            expenses: {
              totalMinor: expenseTotal,
              transactionCount: expenses.length,
              pendingCount: expenses.filter(
                (expense) => expense.status === "pending"
              ).length,
              monthlyBudgetMinor: 500_000,
              series,
            },
            revenue: {
              totalMinor: revenueTotal,
              activeCount: revenueSources.length,
              scheduledPercent: revenueTotal ? 100 : 0,
              series,
            },
          },
          activity: {
            items: activities.slice(offset, offset + pageSize),
            page,
            pageSize,
            total: activities.length,
          },
        },
      },
    }
  }
}

function sum(items: Array<{ amountMinor: unknown }>) {
  return items.reduce((total, item) => total + Number(item.amountMinor), 0)
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function monthEnd(value: string) {
  const [year, month] = value.split("-").map(Number)
  return new Date(Date.UTC(year!, month!, 0)).toISOString().slice(0, 10)
}

function addMonth(value: string) {
  const [year, month] = value.split("-").map(Number)
  return new Date(Date.UTC(year!, month!, 1)).toISOString().slice(0, 7)
}
