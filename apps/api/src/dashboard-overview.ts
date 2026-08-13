import { addDateOnlyDays, dateOnlyDayDifference } from "./date"
import { dashboardActivities } from "./dashboard-overview-activities"
import {
  bucketActivities,
  bucketModuleActivities,
} from "./dashboard-overview-buckets"
import type {
  DashboardActivity,
  DashboardRows,
} from "./dashboard-overview-types"
import type { ExpenseSettingsRow } from "./expense-database-types"
import { expensePeriod } from "./expense-summary"
import { percentageChange, sumBy } from "./numbers"

export function dashboardOverview({
  rows,
  currency,
  expenseSettings,
  from,
  to,
  page,
  pageSize,
}: {
  rows: DashboardRows
  currency: string | null
  expenseSettings: ExpenseSettingsRow | null
  from: string
  to: string
  page: number
  pageSize: number
}) {
  const activities = dashboardActivities(rows, from, to)
  const totals = dashboardTotals(activities)
  const rangeDays = dateOnlyDayDifference(from, to) + 1
  const previousTo = addDateOnlyDays(from, -1)
  const previousFrom = addDateOnlyDays(previousTo, -(rangeDays - 1))
  const previous = dashboardTotals(
    dashboardActivities(rows, previousFrom, previousTo)
  )
  const totalPages = Math.max(1, Math.ceil(activities.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const offset = (currentPage - 1) * pageSize
  const subscriptions = activitiesForModule(activities, "subscriptions")
  const expenses = activitiesForModule(activities, "expenses")
  const revenue = activitiesForModule(activities, "revenue")
  const scheduledRevenueMinor = sumBy(
    revenue.filter((activity) => activity.status === "scheduled"),
    (activity) => activity.amountMinor
  )

  return {
    range: { from, to, days: rangeDays },
    currency,
    totals: {
      ...totals,
      previousNetPositionMinor: previous.netPositionMinor,
      comparisonPercent: percentageChange(
        totals.netPositionMinor,
        previous.netPositionMinor,
        1
      ),
    },
    movement: bucketActivities(activities, from, to),
    highlights: activities.slice(0, 4),
    modules: {
      subscriptions: {
        totalMinor: sumBy(subscriptions, (activity) => activity.amountMinor),
        activeCount: rows.subscriptions.filter(
          (subscription) => subscription.status === "active"
        ).length,
        occurrenceCount: subscriptions.length,
        series: bucketModuleActivities(subscriptions, from, to),
      },
      expenses: {
        totalMinor: sumBy(expenses, (activity) => activity.amountMinor),
        transactionCount: expenses.length,
        pendingCount: expenses.filter(
          (activity) => activity.status === "pending"
        ).length,
        budgetMinor: budgetForRange(expenseSettings, from, to),
        series: bucketModuleActivities(expenses, from, to),
      },
      revenue: {
        totalMinor: sumBy(revenue, (activity) => activity.amountMinor),
        activeCount: rows.revenueSources.filter(
          (source) => source.status === "active"
        ).length,
        scheduledPercent: totals.expectedIncomeMinor
          ? Math.round(
              (scheduledRevenueMinor / totals.expectedIncomeMinor) * 100
            )
          : 0,
        series: bucketModuleActivities(revenue, from, to),
      },
    },
    activity: {
      items: activities.slice(offset, offset + pageSize),
      page: currentPage,
      pageSize,
      total: activities.length,
    },
  }
}

function budgetForRange(
  settings: ExpenseSettingsRow | null,
  from: string,
  to: string
) {
  if (!settings || settings.monthly_budget_minor === null) return null
  const period = expensePeriod(to, settings.reset_day)
  return period.start === from && period.end === to
    ? settings.monthly_budget_minor
    : null
}

function dashboardTotals(activities: DashboardActivity[]) {
  const expectedIncomeMinor = sumBy(
    activities.filter((activity) => activity.direction === "in"),
    (activity) => activity.amountMinor
  )
  const subscriptionCommitmentMinor = sumBy(
    activitiesForModule(activities, "subscriptions"),
    (activity) => activity.amountMinor
  )
  const expenseMinor = sumBy(
    activitiesForModule(activities, "expenses"),
    (activity) => activity.amountMinor
  )
  const committedMinor = subscriptionCommitmentMinor + expenseMinor
  return {
    expectedIncomeMinor,
    subscriptionCommitmentMinor,
    expenseMinor,
    committedMinor,
    netPositionMinor: expectedIncomeMinor - committedMinor,
  }
}

function activitiesForModule(
  activities: DashboardActivity[],
  module: DashboardActivity["module"]
) {
  return activities.filter((activity) => activity.module === module)
}
