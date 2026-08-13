import { addCalendarMonths, monthEndDateOnly } from "./date"
import { sumBy } from "./numbers"
import { nextOccurrenceDate, occurrenceDatesInRange } from "./subscriptions"

export const expenseCadences = [
  "once",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const

export type ExpenseCadence = (typeof expenseCadences)[number]
export type ExpenseForecastMonths = 3 | 6 | 12

export interface SpendingForecastInput {
  amountMinor: number
  scheduleType: "scheduled" | "variable"
  cadence: ExpenseCadence | null
  expenseAnchor: string | null
}

export interface ExpenseForecast {
  months: ExpenseForecastMonths
  totalMinor: number
  previousMonthMinor: number
  averageMonthlyMinor: number
  series: Array<{ month: string; amountMinor: number }>
}

const annualMultipliers: Record<ExpenseCadence, number> = {
  once: 1,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  yearly: 1,
}

export function expenseAnnualEquivalentMinor(
  expense: Pick<
    SpendingForecastInput,
    "amountMinor" | "scheduleType" | "cadence"
  >
) {
  return expense.scheduleType === "variable"
    ? expense.amountMinor * 12
    : expense.amountMinor * annualMultipliers[expense.cadence!]
}

export function expenseMonthlyEquivalentMinor(
  expense: Pick<
    SpendingForecastInput,
    "amountMinor" | "scheduleType" | "cadence"
  >
) {
  return Math.round(expenseAnnualEquivalentMinor(expense) / 12)
}

export function nextExpenseDate(
  expenseAnchor: string,
  cadence: ExpenseCadence,
  asOf: string
) {
  if (cadence === "once") return expenseAnchor >= asOf ? expenseAnchor : null
  return nextOccurrenceDate(expenseAnchor, cadence, asOf)
}

export function expenseDatesInRange(
  expenseAnchor: string,
  cadence: ExpenseCadence,
  from: string,
  through: string
) {
  if (cadence === "once") {
    return expenseAnchor >= from && expenseAnchor <= through
      ? [expenseAnchor]
      : []
  }
  return occurrenceDatesInRange(expenseAnchor, cadence, from, through)
}

export function expenseForecast(
  expenses: SpendingForecastInput[],
  asOf: string,
  months: ExpenseForecastMonths
): ExpenseForecast {
  const currentMonth = asOf.slice(0, 7)
  const series = Array.from({ length: months }, (_, index) => {
    const month = addCalendarMonths(currentMonth, index)
    return { month, amountMinor: spendingForMonth(expenses, month) }
  })
  const totalMinor = sumBy(series, (entry) => entry.amountMinor)
  return {
    months,
    totalMinor,
    previousMonthMinor: spendingForMonth(
      expenses,
      addCalendarMonths(currentMonth, -1)
    ),
    averageMonthlyMinor: Math.round(totalMinor / months),
    series,
  }
}

export function spendingForMonth(
  expenses: SpendingForecastInput[],
  month: string
) {
  const from = `${month}-01`
  const through = monthEndDateOnly(from)
  return expenses.reduce((total, expense) => {
    if (expense.scheduleType === "variable") return total + expense.amountMinor
    return (
      total +
      expenseDatesInRange(
        expense.expenseAnchor!,
        expense.cadence!,
        from,
        through
      ).length *
        expense.amountMinor
    )
  }, 0)
}
