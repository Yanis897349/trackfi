import {
  addDateOnlyDays,
  addDateOnlyMonths,
  dateOnlyDayDifference,
  dateOnlyParts,
} from "./date"
import {
  listExpenseRows,
  readExpenseSettings,
  serializeExpenseSettings,
} from "./expense-database"

export function expensePeriod(asOf: string, resetDay: number) {
  const parts = dateOnlyParts(asOf)
  const month = `${parts.year.toString().padStart(4, "0")}-${(parts.month + 1)
    .toString()
    .padStart(2, "0")}-${resetDay.toString().padStart(2, "0")}`
  const start = parts.day >= resetDay ? month : addDateOnlyMonths(month, -1)
  const nextStart = addDateOnlyMonths(start, 1)
  return {
    start,
    end: addDateOnlyDays(nextStart, -1),
    nextStart,
  }
}

export async function readExpenseSummary(
  database: D1Database,
  userId: string,
  asOf: string
) {
  const [settingsRow, expenseResult, currency] = await Promise.all([
    readExpenseSettings(database, userId),
    listExpenseRows(database, userId),
    database
      .prepare("SELECT currency FROM user_settings WHERE user_id = ?")
      .bind(userId)
      .first<{ currency: string }>(),
  ])
  const settings = serializeExpenseSettings(settingsRow)
  const period = expensePeriod(asOf, settings.resetDay)
  const previous = expensePeriod(
    addDateOnlyDays(period.start, -1),
    settings.resetDay
  )
  const included = expenseResult.results.filter(
    (expense) => expense.status !== "declined"
  )
  const current = included.filter(
    (expense) =>
      expense.transaction_date >= period.start &&
      expense.transaction_date <= period.end
  )
  const previousSpentMinor = sumAmount(
    included.filter(
      (expense) =>
        expense.transaction_date >= previous.start &&
        expense.transaction_date <= previous.end
    )
  )
  const spentMinor = sumAmount(current)
  const rolloverMinor =
    settings.rolloverEnabled && settings.monthlyBudgetMinor
      ? Math.max(0, settings.monthlyBudgetMinor - previousSpentMinor)
      : 0
  const effectiveBudgetMinor = settings.monthlyBudgetMinor
    ? settings.monthlyBudgetMinor + rolloverMinor
    : null
  const totalDays = dateOnlyDayDifference(period.start, period.nextStart)
  const elapsedDays = Math.min(
    totalDays,
    Math.max(1, dateOnlyDayDifference(period.start, asOf) + 1)
  )
  const remainingDays = Math.max(0, totalDays - elapsedDays)
  const dailyPaceMinor = Math.round(spentMinor / elapsedDays)
  const forecastMinor = Math.round(dailyPaceMinor * totalDays)
  const remainingMinor =
    effectiveBudgetMinor === null ? null : effectiveBudgetMinor - spentMinor
  const targetToDateMinor =
    effectiveBudgetMinor === null
      ? null
      : Math.round((effectiveBudgetMinor * elapsedDays) / totalDays)
  const recommendedDailyMinor =
    remainingMinor === null
      ? null
      : Math.max(0, Math.round(remainingMinor / Math.max(1, remainingDays)))
  const categoryTotals = new Map<string, number>()
  for (const expense of current) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + expense.amount_minor
    )
  }
  const categoryBreakdown = [...categoryTotals]
    .map(([category, totalMinor]) => ({ category, totalMinor }))
    .sort((left, right) => right.totalMinor - left.totalMinor)

  return {
    currency: currency?.currency ?? null,
    settings,
    period: {
      start: period.start,
      end: period.end,
      elapsedDays,
      totalDays,
      remainingDays,
    },
    spentMinor,
    dailyPaceMinor,
    remainingMinor,
    forecastMinor,
    rolloverMinor,
    effectiveBudgetMinor,
    targetToDateMinor,
    recommendedDailyMinor,
    pace:
      targetToDateMinor === null
        ? null
        : spentMinor > targetToDateMinor
          ? "above"
          : spentMinor < targetToDateMinor
            ? "below"
            : "on",
    pendingCount: current.filter((expense) => expense.status === "pending")
      .length,
    missingReceiptCount: current.filter((expense) => !expense.receipt_key)
      .length,
    categoryBreakdown,
  }
}

function sumAmount(expenses: Array<{ amount_minor: number }>) {
  return expenses.reduce((total, expense) => total + expense.amount_minor, 0)
}
