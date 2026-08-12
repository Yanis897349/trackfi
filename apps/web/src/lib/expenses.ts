import { apiFetch } from "./api"
import { localDate } from "./date"
import { displayLabel } from "./subscriptions"

export const expenseCadences = [
  "once",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const
export const expenseCategories = [
  "housing",
  "food",
  "transport",
  "utilities",
  "health",
  "entertainment",
  "shopping",
  "software",
  "finance",
  "education",
  "travel",
  "other",
] as const
export const expenseScheduleTypes = ["scheduled", "variable"] as const
export const expenseStatuses = ["active", "paused", "archived"] as const
export const expenseForecastMonths = [3, 6, 12] as const

export type ExpenseCadence = (typeof expenseCadences)[number]
export type ExpenseCategory = (typeof expenseCategories)[number]
export type ExpenseScheduleType = (typeof expenseScheduleTypes)[number]
export type ExpenseStatus = (typeof expenseStatuses)[number]
export type ExpenseFilter = ExpenseStatus | "current" | "all"
export type ExpenseForecastMonths = (typeof expenseForecastMonths)[number]

export interface Expense {
  id: string
  name: string
  amountMinor: number
  scheduleType: ExpenseScheduleType
  cadence: ExpenseCadence | null
  expenseAnchor: string | null
  nextExpenseDate: string | null
  category: ExpenseCategory
  notes: string | null
  status: ExpenseStatus
  monthlyEquivalentMinor: number
  annualEquivalentMinor: number
  createdAt: string
  updatedAt: string
}

export interface ExpenseInput {
  name: string
  amountMinor: number
  scheduleType: ExpenseScheduleType
  cadence: ExpenseCadence | null
  expenseAnchor: string | null
  category: ExpenseCategory
  notes: string
}

export interface ExpenseSummary {
  currency: string | null
  activeExpenseCount: number
  activeSubscriptionCount: number
  pausedExpenseCount: number
  variableExpenseCount: number
  forecast: {
    months: ExpenseForecastMonths
    totalMinor: number
    previousMonthMinor: number
    averageMonthlyMinor: number
    series: Array<{ month: string; amountMinor: number }>
  }
  categoryBreakdown: Array<{
    category: ExpenseCategory
    totalMinor: number
  }>
  upcomingScheduledCount: number
  upcomingScheduledTotalMinor: number
  upcomingSpending: Array<{
    id: string
    sourceId: string
    origin: "expense" | "subscription"
    name: string
    category: ExpenseCategory
    amountMinor: number
    scheduleType: ExpenseScheduleType
    cadence: ExpenseCadence | null
    expectedDate: string | null
  }>
}

export const expenseCadenceOptions = expenseCadences.map((value) => ({
  value,
  label: value === "once" ? "Doesn’t repeat" : displayLabel(value),
}))
export const expenseCategoryOptions = expenseCategories.map((value) => ({
  value,
  label: displayLabel(value),
}))
export const expenseCategoryFilterOptions = [
  { value: "all" as const, label: "All categories" },
  ...expenseCategoryOptions,
]
export const expenseScheduleOptions = [
  { value: "all" as const, label: "All expense types" },
  { value: "scheduled" as const, label: "Scheduled" },
  { value: "variable" as const, label: "Monthly estimate" },
]
export const expenseStatusOptions = (
  ["active", "paused", "archived", "all"] as const
).map((value) => ({ value, label: displayLabel(value) }))

export function expensesQueryOptions({
  status = "active",
  category,
  scheduleType,
  query = "",
  page = 1,
  pageSize = 3,
}: {
  status?: ExpenseFilter
  category?: ExpenseCategory
  scheduleType?: ExpenseScheduleType
  query?: string
  page?: number
  pageSize?: number
} = {}) {
  const params = new URLSearchParams({
    status,
    asOf: localDate(),
    page: String(page),
    pageSize: String(pageSize),
  })
  if (category) params.set("category", category)
  if (scheduleType) params.set("scheduleType", scheduleType)
  if (query.trim()) params.set("q", query.trim())
  const queryString = params.toString()
  return {
    queryKey: ["expenses", queryString],
    queryFn: () =>
      apiFetch<{
        expenses: Expense[]
        page: number
        pageSize: number
        total: number
      }>(`/api/expenses?${queryString}`),
  }
}

export function expenseSummaryQueryOptions(months: ExpenseForecastMonths = 6) {
  const asOf = localDate()
  return {
    queryKey: ["expense-summary", asOf, months],
    queryFn: () =>
      apiFetch<{ summary: ExpenseSummary }>(
        `/api/expenses/summary?asOf=${asOf}&months=${months}`
      ),
  }
}

export function expenseAmountSuffix(expense: Expense) {
  if (expense.scheduleType === "variable") return "estimated / month"
  if (expense.cadence === "once") return "one time"
  const units: Record<ExpenseCadence, string> = {
    once: "one time",
    weekly: "week",
    biweekly: "2 weeks",
    monthly: "month",
    quarterly: "quarter",
    semiannual: "6 months",
    yearly: "year",
  }
  return `/ ${units[expense.cadence!]}`
}
