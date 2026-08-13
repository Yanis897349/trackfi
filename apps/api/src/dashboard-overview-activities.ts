import { monthEndDatesInRange } from "./date"
import { revenuePaymentDatesInRange } from "./revenue"
import { renewalDatesInRange } from "./subscriptions"
import type {
  DashboardActivity,
  DashboardModule,
  DashboardRows,
} from "./dashboard-overview-types"

export function dashboardActivities(
  rows: DashboardRows,
  from: string,
  to: string
) {
  return [
    ...subscriptionActivities(rows, from, to),
    ...revenueActivities(rows, from, to),
    ...expenseActivities(rows, from, to),
  ].sort(compareActivities)
}

function subscriptionActivities(rows: DashboardRows, from: string, to: string) {
  return rows.subscriptions.flatMap((subscription): DashboardActivity[] => {
    if (subscription.status !== "active") return []
    return renewalDatesInRange(
      subscription.billing_anchor,
      subscription.cadence,
      from,
      to
    ).map((date) => ({
      id: `subscriptions:${subscription.id}:${date}`,
      sourceId: subscription.id,
      date,
      label: subscription.name,
      module: "subscriptions",
      direction: "out",
      amountMinor: subscription.amount_minor,
      status: "scheduled",
    }))
  })
}

function revenueActivities(rows: DashboardRows, from: string, to: string) {
  return rows.revenueSources.flatMap((source): DashboardActivity[] => {
    if (source.status !== "active") return []
    const dates =
      source.schedule_type === "variable"
        ? monthEndDatesInRange(from, to)
        : revenuePaymentDatesInRange(
            source.payment_anchor!,
            source.cadence!,
            from,
            to
          )
    return dates.map((date) => ({
      id: `revenue:${source.id}:${date}`,
      sourceId: source.id,
      date,
      label: source.name,
      module: "revenue",
      direction: "in",
      amountMinor: source.amount_minor,
      status: source.schedule_type === "variable" ? "estimated" : "scheduled",
    }))
  })
}

function expenseActivities(rows: DashboardRows, from: string, to: string) {
  return rows.expenses.flatMap((expense): DashboardActivity[] => {
    if (
      expense.status === "declined" ||
      expense.transaction_date < from ||
      expense.transaction_date > to
    ) {
      return []
    }
    return [
      {
        id: `expenses:${expense.id}`,
        sourceId: expense.id,
        date: expense.transaction_date,
        label: expense.merchant,
        module: "expenses",
        direction: "out",
        amountMinor: expense.amount_minor,
        status: expense.status,
      },
    ]
  })
}

function compareActivities(left: DashboardActivity, right: DashboardActivity) {
  const moduleOrder: Record<DashboardModule, number> = {
    revenue: 0,
    subscriptions: 1,
    expenses: 2,
  }
  return (
    left.date.localeCompare(right.date) ||
    moduleOrder[left.module] - moduleOrder[right.module] ||
    left.label.localeCompare(right.label) ||
    left.id.localeCompare(right.id)
  )
}
