import { apiFetch } from "./api"
import { localDate } from "./date"
import { categoryLabel, statusLabel } from "./labels"
import { m } from "./i18n"

export const expenseCategories = [
  "housing",
  "food",
  "transport",
  "utilities",
  "health",
  "entertainment",
  "shopping",
  "software",
  "infrastructure",
  "finance",
  "education",
  "travel",
  "other",
] as const
export const expenseStatuses = ["pending", "approved", "declined"] as const

export type ExpenseCategory = (typeof expenseCategories)[number]
export type ExpenseStatus = (typeof expenseStatuses)[number]

export interface ExpenseReceipt {
  name: string
  contentType: string
  size: number
  url: string
}

export interface Expense {
  id: string
  merchant: string
  amountMinor: number
  transactionDate: string
  category: ExpenseCategory
  status: ExpenseStatus
  reimbursable: boolean
  notes: string | null
  receipt: ExpenseReceipt | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseInput {
  merchant: string
  amountMinor: number
  transactionDate: string
  category: ExpenseCategory
  status: ExpenseStatus
  reimbursable: boolean
  notes: string
  removeReceipt?: boolean
}

export interface ExpenseSettings {
  monthlyBudgetMinor: number | null
  dailyTargetMinor: number | null
  budgetPeriod: "monthly"
  resetDay: number
  rolloverEnabled: boolean
  approachingThreshold: number
  limitThreshold: number
  updatedAt: string | null
}

export interface ExpenseSummary {
  currency: string | null
  settings: ExpenseSettings
  period: {
    start: string
    end: string
    elapsedDays: number
    totalDays: number
    remainingDays: number
  }
  spentMinor: number
  dailyPaceMinor: number
  remainingMinor: number | null
  forecastMinor: number
  rolloverMinor: number
  effectiveBudgetMinor: number | null
  targetToDateMinor: number | null
  recommendedDailyMinor: number | null
  pace: "above" | "below" | "on" | null
  pendingCount: number
  missingReceiptCount: number
  categoryBreakdown: Array<{ category: ExpenseCategory; totalMinor: number }>
}

export const expenseCategoryOptions = expenseCategories.map((value) => ({
  value,
  label:
    value === "entertainment"
      ? m.category_meals_entertainment()
      : categoryLabel(value),
}))
export const expenseStatusOptions = expenseStatuses.map((value) => ({
  value,
  label: statusLabel(value),
}))

export function expenseSummaryQueryOptions() {
  const asOf = localDate()
  return {
    queryKey: ["expense-summary", asOf],
    queryFn: () =>
      apiFetch<{ summary: ExpenseSummary }>(
        `/api/expenses/summary?asOf=${asOf}`
      ),
  }
}

export function expenseSettingsQueryOptions() {
  return {
    queryKey: ["expense-settings"],
    queryFn: () =>
      apiFetch<{ settings: ExpenseSettings }>("/api/expenses/settings"),
  }
}

export function expensesQueryOptions({
  from,
  to,
  query = "",
  category,
  status,
  pending = false,
  missingReceipt = false,
  page = 1,
  pageSize = 5,
}: {
  from?: string
  to?: string
  query?: string
  category?: ExpenseCategory
  status?: ExpenseStatus
  pending?: boolean
  missingReceipt?: boolean
  page?: number
  pageSize?: number
}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  if (query.trim()) params.set("q", query.trim())
  if (category) params.set("category", category)
  if (status) params.set("status", status)
  if (pending) params.set("pending", "true")
  if (missingReceipt) params.set("missingReceipt", "true")
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

export function expenseRequestBody(input: ExpenseInput, receipt: File | null) {
  if (!receipt) return JSON.stringify(input)
  const form = new FormData()
  form.set("payload", JSON.stringify(input))
  form.set("receipt", receipt)
  return form
}

export function expenseCategoryAllocationEntries(summary: ExpenseSummary) {
  if (summary.categoryBreakdown.length <= 4) return summary.categoryBreakdown
  const leading = summary.categoryBreakdown.slice(0, 3)
  const remainingTotal = summary.categoryBreakdown
    .slice(3)
    .reduce((total, entry) => total + entry.totalMinor, 0)
  const existingOther = leading.findIndex((entry) => entry.category === "other")
  if (existingOther >= 0) {
    return leading.map((entry, index) =>
      index === existingOther
        ? { ...entry, totalMinor: entry.totalMinor + remainingTotal }
        : entry
    )
  }
  return [
    ...leading,
    { category: "other" as const, totalMinor: remainingTotal },
  ]
}
