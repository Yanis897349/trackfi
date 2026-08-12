import { addDateOnlyDays } from "./date"
import { listExpenseRows } from "./expense-database"
import {
  buildCategoryBreakdown,
  buildSpendingItems,
  buildUpcomingSpending,
} from "./expense-insights"
import { expenseForecast, type ExpenseForecastMonths } from "./expenses"
import { listSubscriptionRows } from "./subscription-database"

export async function readExpenseSummary(
  database: D1Database,
  userId: string,
  asOf: string,
  months: ExpenseForecastMonths
) {
  const [settings, expenseResult, subscriptionResult] = await Promise.all([
    database
      .prepare("SELECT currency FROM user_settings WHERE user_id = ?")
      .bind(userId)
      .first<{ currency: string }>(),
    listExpenseRows(database, userId),
    listSubscriptionRows(database, userId, true),
  ])
  const activeExpenses = expenseResult.results.filter(
    (expense) => expense.status === "active"
  )
  const activeSubscriptions = subscriptionResult.results
  const spendingItems = buildSpendingItems(activeExpenses, activeSubscriptions)
  const forecast = expenseForecast(spendingItems, asOf, months)
  const upcoming = buildUpcomingSpending(
    activeExpenses,
    activeSubscriptions,
    asOf,
    addDateOnlyDays(asOf, 30)
  )

  return {
    currency: settings?.currency ?? null,
    activeExpenseCount: activeExpenses.length,
    activeSubscriptionCount: activeSubscriptions.length,
    pausedExpenseCount: expenseResult.results.filter(
      (expense) => expense.status === "paused"
    ).length,
    variableExpenseCount: activeExpenses.filter(
      (expense) => expense.schedule_type === "variable"
    ).length,
    forecast,
    categoryBreakdown: buildCategoryBreakdown(spendingItems, forecast),
    upcomingScheduledCount: upcoming.scheduledCount,
    upcomingScheduledTotalMinor: upcoming.scheduledTotalMinor,
    upcomingSpending: upcoming.items,
  }
}
