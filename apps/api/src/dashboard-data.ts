import { listExpenseRows, readExpenseSettings } from "./expense-database"
import { listRevenueSourceRows } from "./revenue-database"
import { listSubscriptionRows } from "./subscription-database"

export async function readDashboardData(database: D1Database, userId: string) {
  const [currency, expenses, expenseSettings, revenueSources, subscriptions] =
    await Promise.all([
      database
        .prepare("SELECT currency FROM user_settings WHERE user_id = ?")
        .bind(userId)
        .first<{ currency: string }>(),
      listExpenseRows(database, userId),
      readExpenseSettings(database, userId),
      listRevenueSourceRows(database, userId),
      listSubscriptionRows(database, userId),
    ])

  return {
    currency: currency?.currency ?? null,
    monthlyBudgetMinor: expenseSettings?.monthly_budget_minor ?? null,
    rows: {
      expenses: expenses.results,
      revenueSources: revenueSources.results,
      subscriptions: subscriptions.results,
    },
  }
}
