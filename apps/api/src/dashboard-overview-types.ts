import type { ExpenseRow } from "./expense-database"
import type { RevenueSourceRow } from "./revenue-database"
import type { SubscriptionRow } from "./subscription-database"

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

export interface DashboardRows {
  expenses: ExpenseRow[]
  revenueSources: RevenueSourceRow[]
  subscriptions: SubscriptionRow[]
}
