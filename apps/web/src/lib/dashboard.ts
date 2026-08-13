import { keepPreviousData } from "@tanstack/react-query"

import { apiFetch } from "./api"

export type DashboardModule = "expenses" | "subscriptions" | "revenue"
export type DashboardActivityStatus =
  "approved" | "estimated" | "pending" | "scheduled"

export interface DashboardActivity {
  id: string
  sourceId: string
  date: string
  label: string
  module: DashboardModule
  direction: "in" | "out"
  amountMinor: number
  status: DashboardActivityStatus
}

export interface DashboardSeriesEntry {
  from: string
  to: string
  amountMinor: number
}

export interface DashboardOverview {
  range: { from: string; to: string; days: number }
  currency: string | null
  totals: {
    expectedIncomeMinor: number
    subscriptionCommitmentMinor: number
    expenseMinor: number
    committedMinor: number
    netPositionMinor: number
    previousNetPositionMinor: number
    comparisonPercent: number | null
  }
  movement: Array<{
    from: string
    to: string
    incomeMinor: number
    outgoingMinor: number
    netMinor: number
  }>
  highlights: DashboardActivity[]
  modules: {
    subscriptions: {
      totalMinor: number
      activeCount: number
      occurrenceCount: number
      series: DashboardSeriesEntry[]
    }
    expenses: {
      totalMinor: number
      transactionCount: number
      pendingCount: number
      monthlyBudgetMinor: number | null
      series: DashboardSeriesEntry[]
    }
    revenue: {
      totalMinor: number
      activeCount: number
      scheduledPercent: number
      series: DashboardSeriesEntry[]
    }
  }
  activity: {
    items: DashboardActivity[]
    page: number
    pageSize: number
    total: number
  }
}

export function dashboardOverviewQueryOptions({
  from,
  to,
  page,
}: {
  from: string
  to: string
  page: number
}) {
  const params = new URLSearchParams({
    from,
    to,
    page: String(page),
    pageSize: "4",
  })
  return {
    queryKey: ["dashboard-overview", from, to, page],
    queryFn: () =>
      apiFetch<{ overview: DashboardOverview }>(
        `/api/dashboard/overview?${params.toString()}`
      ),
    placeholderData: keepPreviousData,
  }
}
