import {
  nextOccurrenceDate,
  occurrenceDatesInRange,
  type RecurrenceCadence,
} from "./subscriptions"

export const revenueCadences = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const satisfies readonly RecurrenceCadence[]

export type RevenueCadence = (typeof revenueCadences)[number]

export interface RevenueCalculationInput {
  amountMinor: number
  scheduleType: "scheduled" | "variable"
  cadence: RevenueCadence | null
}

const annualMultipliers: Record<RevenueCadence, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  yearly: 1,
}

export function revenueAnnualEquivalentMinor(source: RevenueCalculationInput) {
  return source.scheduleType === "variable"
    ? source.amountMinor * 12
    : source.amountMinor * annualMultipliers[source.cadence!]
}

export function revenueMonthlyEquivalentMinor(source: RevenueCalculationInput) {
  return Math.round(revenueAnnualEquivalentMinor(source) / 12)
}

export function nextRevenuePaymentDate(
  paymentAnchor: string,
  cadence: RevenueCadence,
  asOf: string
) {
  return nextOccurrenceDate(paymentAnchor, cadence, asOf)
}

export function revenuePaymentDatesInRange(
  paymentAnchor: string,
  cadence: RevenueCadence,
  from: string,
  through: string
) {
  return occurrenceDatesInRange(paymentAnchor, cadence, from, through)
}
