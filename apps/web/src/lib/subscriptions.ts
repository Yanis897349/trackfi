import { apiFetch } from "./api"

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
  monthlyEquivalentMinor: number
  annualEquivalentMinor: number
  upcomingCount: number
  upcoming: Subscription[]
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

export function localDate() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function subscriptionsQueryOptions({
  status = "current",
  category,
  query = "",
}: {
  status?: SubscriptionFilter
  category?: SubscriptionCategory
  query?: string
} = {}) {
  const params = new URLSearchParams({ status, asOf: localDate() })
  if (category) params.set("category", category)
  if (query.trim()) params.set("q", query.trim())
  const queryString = params.toString()
  return {
    queryKey: ["subscriptions", queryString],
    queryFn: () =>
      apiFetch<{ subscriptions: Subscription[] }>(
        `/api/subscriptions?${queryString}`
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

export function displayLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
