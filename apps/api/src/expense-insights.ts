import { serializeExpense, type ExpenseRow } from "./expense-database"
import {
  expenseDatesInRange,
  spendingForMonth,
  type ExpenseCadence,
  type ExpenseForecast,
  type SpendingForecastInput,
} from "./expenses"
import type { SubscriptionRow } from "./subscription-database"
import { nextRenewalDate, renewalDatesInRange } from "./subscriptions"

export interface SpendingItem extends SpendingForecastInput {
  category: string
}

export function buildSpendingItems(
  expenses: ExpenseRow[],
  subscriptions: SubscriptionRow[]
): SpendingItem[] {
  return [
    ...expenses.map((expense) => ({
      amountMinor: expense.amount_minor,
      scheduleType: expense.schedule_type,
      cadence: expense.cadence,
      expenseAnchor: expense.expense_anchor,
      category: expense.category,
    })),
    ...subscriptions.map((subscription) => ({
      amountMinor: subscription.amount_minor,
      scheduleType: "scheduled" as const,
      cadence: subscription.cadence,
      expenseAnchor: subscription.billing_anchor,
      category: subscription.category,
    })),
  ]
}

export function buildCategoryBreakdown(
  items: SpendingItem[],
  forecast: ExpenseForecast
) {
  return Array.from(new Set(items.map((item) => item.category)))
    .map((category) => ({
      category,
      totalMinor: forecast.series.reduce(
        (total, entry) =>
          total +
          spendingForMonth(
            items.filter((item) => item.category === category),
            entry.month
          ),
        0
      ),
    }))
    .filter((entry) => entry.totalMinor > 0)
    .sort((left, right) => right.totalMinor - left.totalMinor)
}

export function buildUpcomingSpending(
  expenses: ExpenseRow[],
  subscriptions: SubscriptionRow[],
  asOf: string,
  through: string
) {
  const expenseOccurrences = expenses.flatMap((expense) =>
    scheduledExpenseDates(expense, asOf, through)
  )
  const subscriptionOccurrences = subscriptions.flatMap((subscription) =>
    renewalDatesInRange(
      subscription.billing_anchor,
      subscription.cadence,
      asOf,
      through
    )
  )
  const items = [
    ...expenses
      .map((expense) => serializeExpense(expense, asOf))
      .filter(
        (expense) =>
          expense.scheduleType === "variable" ||
          expense.nextExpenseDate !== null
      )
      .map((expense) => ({
        id:
          expense.scheduleType === "scheduled"
            ? `expense:${expense.id}:${expense.nextExpenseDate}`
            : `expense:${expense.id}:estimate:${asOf.slice(0, 7)}`,
        sourceId: expense.id,
        origin: "expense" as const,
        name: expense.name,
        category: expense.category,
        amountMinor: expense.amountMinor,
        scheduleType: expense.scheduleType,
        cadence: expense.cadence,
        expectedDate: expense.nextExpenseDate,
      })),
    ...subscriptions.map((subscription) => {
      const expectedDate = nextRenewalDate(
        subscription.billing_anchor,
        subscription.cadence,
        asOf
      )
      return {
        id: `subscription:${subscription.id}:${expectedDate}`,
        sourceId: subscription.id,
        origin: "subscription" as const,
        name: subscription.name,
        category: subscription.category,
        amountMinor: subscription.amount_minor,
        scheduleType: "scheduled" as const,
        cadence: subscription.cadence as ExpenseCadence,
        expectedDate,
      }
    }),
  ].sort(compareUpcoming)

  const scheduledTotalMinor =
    expenses.reduce(
      (total, expense) =>
        total +
        scheduledExpenseDates(expense, asOf, through).length *
          expense.amount_minor,
      0
    ) +
    subscriptions.reduce(
      (total, subscription) =>
        total +
        renewalDatesInRange(
          subscription.billing_anchor,
          subscription.cadence,
          asOf,
          through
        ).length *
          subscription.amount_minor,
      0
    )

  return {
    items,
    scheduledCount: expenseOccurrences.length + subscriptionOccurrences.length,
    scheduledTotalMinor,
  }
}

function scheduledExpenseDates(
  expense: ExpenseRow,
  from: string,
  through: string
) {
  return expense.schedule_type === "scheduled"
    ? expenseDatesInRange(
        expense.expense_anchor!,
        expense.cadence!,
        from,
        through
      )
    : []
}

function compareUpcoming<
  Item extends { expectedDate: string | null; name: string },
>(left: Item, right: Item) {
  if (left.expectedDate && right.expectedDate) {
    return (
      left.expectedDate.localeCompare(right.expectedDate) ||
      left.name.localeCompare(right.name)
    )
  }
  if (left.expectedDate) return -1
  if (right.expectedDate) return 1
  return left.name.localeCompare(right.name)
}
