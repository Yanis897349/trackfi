import { nextOccurrenceDate, occurrenceDatesInRange } from "./subscriptions"
import { addDateOnlyMonths, daysInUtcMonth } from "./date"

export const revenueCadences = [
  "once",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const

export type RevenueCadence = (typeof revenueCadences)[number]

export interface RevenueCalculationInput {
  amountMinor: number
  scheduleType: "scheduled" | "variable"
  cadence: RevenueCadence | null
}

export interface RevenueForecastInput extends RevenueCalculationInput {
  paymentAnchor: string | null
}

export type RevenueForecastMonths = 3 | 6 | 12

export interface RevenueForecast {
  months: RevenueForecastMonths
  totalMinor: number
  previousMonthMinor: number
  series: Array<{ month: string; amountMinor: number }>
}

const annualMultipliers: Record<RevenueCadence, number> = {
  once: 1,
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
  if (cadence === "once") return paymentAnchor >= asOf ? paymentAnchor : null
  return nextOccurrenceDate(paymentAnchor, cadence, asOf)
}

export function revenuePaymentDatesInRange(
  paymentAnchor: string,
  cadence: RevenueCadence,
  from: string,
  through: string
) {
  if (cadence === "once") {
    return paymentAnchor >= from && paymentAnchor <= through
      ? [paymentAnchor]
      : []
  }
  return occurrenceDatesInRange(paymentAnchor, cadence, from, through)
}

export function revenueForecast(
  sources: RevenueForecastInput[],
  asOf: string,
  months: RevenueForecastMonths
): RevenueForecast {
  const currentMonth = asOf.slice(0, 7)
  const series = Array.from({ length: months }, (_, index) => {
    const month = addCalendarMonths(currentMonth, index)
    return { month, amountMinor: revenueForecastForMonth(sources, month) }
  })

  return {
    months,
    totalMinor: series.reduce((total, entry) => total + entry.amountMinor, 0),
    previousMonthMinor: revenueForecastForMonth(
      sources,
      addCalendarMonths(currentMonth, -1)
    ),
    series,
  }
}

function revenueForecastForMonth(
  sources: RevenueForecastInput[],
  month: string
) {
  const [year, monthNumber] = month.split("-").map(Number)
  const through = `${month}-${daysInUtcMonth(year!, monthNumber! - 1)
    .toString()
    .padStart(2, "0")}`
  const from = `${month}-01`

  return sources.reduce((total, source) => {
    if (source.scheduleType === "variable") {
      return total + source.amountMinor
    }
    const occurrences = revenuePaymentDatesInRange(
      source.paymentAnchor!,
      source.cadence!,
      from,
      through
    )
    return total + occurrences.length * source.amountMinor
  }, 0)
}

function addCalendarMonths(month: string, offset: number) {
  return addDateOnlyMonths(`${month}-01`, offset).slice(0, 7)
}
