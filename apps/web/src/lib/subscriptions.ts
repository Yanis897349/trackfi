import { apiFetch } from "./api"
import { localDate } from "./date"

export const subscriptionCadences = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const
export const subscriptionCategories = [
  "software",
  "entertainment",
  "utilities",
  "finance",
  "health",
  "education",
  "shopping",
  "other",
] as const
export const subscriptionStatuses = ["active", "paused", "archived"] as const

export const subscriptionCadenceOptions = subscriptionCadences.map((value) => ({
  value,
  label: displayLabel(value),
}))
export const subscriptionCadenceFilterOptions = [
  { value: "all" as const, label: "All cycles" },
  ...subscriptionCadenceOptions,
]
export const subscriptionCategoryOptions = subscriptionCategories.map(
  (value) => ({ value, label: displayLabel(value) })
)
export const subscriptionCategoryFilterOptions = [
  { value: "all" as const, label: "All categories" },
  ...subscriptionCategoryOptions,
]
export const subscriptionFilterOptions = (
  ["active", "paused", "archived", "all"] as const
).map((value) => ({ value, label: displayLabel(value) }))

export type SubscriptionCadence = (typeof subscriptionCadences)[number]
export type SubscriptionCategory = (typeof subscriptionCategories)[number]
export type SubscriptionStatus = (typeof subscriptionStatuses)[number]
export type SubscriptionFilter = SubscriptionStatus | "current" | "all"

export interface Subscription {
  id: string
  name: string
  amountMinor: number
  cadence: SubscriptionCadence
  billingAnchor: string
  nextRenewalDate: string
  category: SubscriptionCategory
  websiteUrl: string | null
  notes: string | null
  status: SubscriptionStatus
  createdAt: string
  updatedAt: string
}

export interface SubscriptionSummary {
  currency: string | null
  activeCount: number
  pausedCount: number
  activeCategoryCount: number
  monthlyEquivalentMinor: number
  annualEquivalentMinor: number
  upcomingCount: number
  upcomingTotalMinor: number
  upcoming: Subscription[]
  monthlyComparison: { previousMonthlyEquivalentMinor: number } | null
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[]
  page: number
  pageSize: number
  total: number
}

export interface RenewalOccurrence {
  id: string
  subscriptionId: string
  name: string
  amountMinor: number
  cadence: SubscriptionCadence
  category: SubscriptionCategory
  websiteUrl: string | null
  renewalDate: string
}

export interface RenewalCalendar {
  month: string
  rangeStart: string
  rangeEnd: string
  currency: string | null
  renewalCount: number
  totalMinor: number
  categoryCount: number
  monthTotalMinor: number
  renewals: RenewalOccurrence[]
}

export interface SubscriptionInput {
  name: string
  amountMinor: number
  cadence: SubscriptionCadence
  billingAnchor: string
  category: SubscriptionCategory
  websiteUrl?: string
  notes?: string
}

export function subscriptionsQueryOptions({
  status = "active",
  category,
  cadence,
  query = "",
  page = 1,
  pageSize = 3,
}: {
  status?: SubscriptionFilter
  category?: SubscriptionCategory
  cadence?: SubscriptionCadence
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
  if (cadence) params.set("cadence", cadence)
  if (query.trim()) params.set("q", query.trim())
  const queryString = params.toString()
  return {
    queryKey: ["subscriptions", queryString],
    queryFn: () =>
      apiFetch<SubscriptionListResponse>(`/api/subscriptions?${queryString}`),
  }
}

export function renewalCalendarQueryOptions(month: string) {
  return {
    queryKey: ["subscription-calendar", month],
    queryFn: () =>
      apiFetch<{ calendar: RenewalCalendar }>(
        `/api/subscriptions/calendar?month=${encodeURIComponent(month)}`
      ),
  }
}

export function subscriptionSummaryQueryOptions() {
  return {
    queryKey: ["subscription-summary", localDate()],
    queryFn: () =>
      apiFetch<{ summary: SubscriptionSummary }>(
        `/api/subscriptions/summary?asOf=${localDate()}`
      ),
  }
}

export function formatMoney(amountMinor: number, currency: string) {
  const fractionDigits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amountMinor / 10 ** fractionDigits)
}

export function monthlyComparisonLabel(summary: SubscriptionSummary) {
  const previous = summary.monthlyComparison?.previousMonthlyEquivalentMinor
  if (previous === undefined) return "Tracking changes"
  if (previous === 0) {
    return summary.monthlyEquivalentMinor > 0
      ? "New since last month"
      : "No change vs last month"
  }
  const change = Math.round(
    ((summary.monthlyEquivalentMinor - previous) / previous) * 100
  )
  if (change === 0) return "No change vs last month"
  return `${change > 0 ? "+" : "−"}${Math.abs(change)}% vs last month`
}

export function displayLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
