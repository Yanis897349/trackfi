import { keepPreviousData } from "@tanstack/react-query"

import { apiFetch } from "./api"
import { localDate } from "./date"
import { cadenceLabel, categoryLabel, statusLabel } from "./labels"
import { m } from "./i18n"

export const revenueCadences = [
  "once",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const
export const revenueCategories = [
  "salary",
  "freelance",
  "business",
  "rental",
  "investments",
  "benefits",
  "pension",
  "other",
] as const
export const revenueScheduleTypes = ["scheduled", "variable"] as const
export const revenueStatuses = ["active", "paused", "archived"] as const
export const revenueForecastMonths = [3, 6, 12] as const

export type RevenueCadence = (typeof revenueCadences)[number]
export type RevenueCategory = (typeof revenueCategories)[number]
export type RevenueScheduleType = (typeof revenueScheduleTypes)[number]
export type RevenueStatus = (typeof revenueStatuses)[number]
export type RevenueFilter = RevenueStatus | "current" | "all"
export type RevenueForecastMonths = (typeof revenueForecastMonths)[number]

export interface RevenueSource {
  id: string
  name: string
  amountMinor: number
  scheduleType: RevenueScheduleType
  cadence: RevenueCadence | null
  paymentAnchor: string | null
  nextPaymentDate: string | null
  category: RevenueCategory
  notes: string | null
  status: RevenueStatus
  monthlyEquivalentMinor: number
  annualEquivalentMinor: number
  createdAt: string
  updatedAt: string
}

export interface RevenueSourceInput {
  name: string
  amountMinor: number
  scheduleType: RevenueScheduleType
  cadence: RevenueCadence | null
  paymentAnchor: string | null
  category: RevenueCategory
  notes: string
}

export interface RevenueSummary {
  currency: string | null
  activeCount: number
  pausedCount: number
  variableCount: number
  activeCategoryCount: number
  monthlyEquivalentMinor: number
  annualEquivalentMinor: number
  upcomingCount: number
  upcomingTotalMinor: number
  sourceBreakdown: Array<{
    sourceId: string
    name: string
    category: RevenueCategory
    monthlyEquivalentMinor: number
  }>
  upcoming: Array<{
    id: string
    sourceId: string
    name: string
    category: RevenueCategory
    amountMinor: number
    paymentDate: string
  }>
  forecast: {
    months: RevenueForecastMonths
    totalMinor: number
    previousMonthMinor: number
    series: Array<{
      month: string
      amountMinor: number
    }>
  }
  upcomingIncome: Array<{
    id: string
    sourceId: string
    name: string
    category: RevenueCategory
    amountMinor: number
    scheduleType: RevenueScheduleType
    cadence: RevenueCadence | null
    expectedDate: string | null
  }>
}

export const revenueCadenceOptions = revenueCadences.map((value) => ({
  value,
  label: cadenceLabel(value),
}))
export const revenueCategoryOptions = revenueCategories.map((value) => ({
  value,
  label: categoryLabel(value),
}))
export const revenueCategoryFilterOptions = [
  { value: "all" as const, label: m.subscriptions_all_categories() },
  ...revenueCategoryOptions,
]
export const revenueScheduleOptions = [
  { value: "all" as const, label: m.revenue_all_income_types() },
  { value: "scheduled" as const, label: m.revenue_scheduled() },
  { value: "variable" as const, label: m.revenue_variable_estimate() },
]
export const revenueStatusOptions = (
  ["active", "paused", "archived", "all"] as const
).map((value) => ({ value, label: statusLabel(value) }))

export function revenueSourcesQueryOptions({
  status = "active",
  category,
  scheduleType,
  query = "",
  page = 1,
  pageSize = 3,
}: {
  status?: RevenueFilter
  category?: RevenueCategory
  scheduleType?: RevenueScheduleType
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
    queryKey: ["revenue-sources", queryString],
    queryFn: () =>
      apiFetch<{
        revenueSources: RevenueSource[]
        page: number
        pageSize: number
        total: number
      }>(`/api/revenue-sources?${queryString}`),
    placeholderData: keepPreviousData,
  }
}

export function revenueSummaryQueryOptions(months: RevenueForecastMonths = 6) {
  const asOf = localDate()
  return {
    queryKey: ["revenue-summary", asOf, months],
    queryFn: () =>
      apiFetch<{ summary: RevenueSummary }>(
        `/api/revenue-sources/summary?asOf=${asOf}&months=${months}`
      ),
  }
}

export function revenueAmountSuffix(source: RevenueSource) {
  if (source.scheduleType === "variable") return m.revenue_estimated_month()
  if (source.cadence === "once") return m.revenue_one_time_suffix()
  return cadenceSuffix(source.cadence!)
}

function cadenceSuffix(cadence: RevenueCadence) {
  const units: Record<RevenueCadence, string> = {
    once: m.revenue_one_time_suffix(),
    weekly: m.revenue_per_week(),
    biweekly: m.revenue_per_two_weeks(),
    monthly: m.revenue_per_month(),
    quarterly: m.revenue_per_quarter(),
    semiannual: m.revenue_per_six_months(),
    yearly: m.revenue_per_year(),
  }
  return units[cadence]
}
