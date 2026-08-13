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
import { percentageChange, sumBy } from "./numbers"

export function dashboardOverview({
  rows,
  currency,
  monthlyBudgetMinor,
  from,
  to,
  page,
  pageSize,
}: {
  rows: DashboardRows
  currency: string | null
  monthlyBudgetMinor: number | null
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
  const offset = (page - 1) * pageSize
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
        monthlyBudgetMinor,
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
      page,
      pageSize,
      total: activities.length,
    },
  }
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
