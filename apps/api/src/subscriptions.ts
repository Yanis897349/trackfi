export const subscriptionCadences = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const

export type SubscriptionCadence = (typeof subscriptionCadences)[number]
export type RecurrenceCadence = SubscriptionCadence | "biweekly"

export interface SubscriptionCalculationInput {
  amountMinor: number
  billingAnchor: string
  cadence: SubscriptionCadence
}

const cadenceMonths: Partial<Record<RecurrenceCadence, number>> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
}

export function nextRenewalDate(
  billingAnchor: string,
  cadence: SubscriptionCadence,
  asOf: string
) {
  return nextOccurrenceDate(billingAnchor, cadence, asOf)
}

export function nextOccurrenceDate(
  billingAnchor: string,
  cadence: RecurrenceCadence,
  asOf: string
) {
  if (billingAnchor >= asOf) return billingAnchor

  if (cadence === "weekly" || cadence === "biweekly") {
    const intervalDays = cadence === "weekly" ? 7 : 14
    const elapsedDays = dateOnlyDayDifference(billingAnchor, asOf)
    return addDateOnlyDays(
      billingAnchor,
      Math.ceil(elapsedDays / intervalDays) * intervalDays
    )
  }

  const interval = cadenceMonths[cadence]!
  const anchor = dateOnlyParts(billingAnchor)
  const current = dateOnlyParts(asOf)
  const elapsedMonths =
    (current.year - anchor.year) * 12 + current.month - anchor.month
  let periods = Math.max(0, Math.floor(elapsedMonths / interval))
  let candidate = addCalendarMonths(billingAnchor, periods * interval)
  while (candidate < asOf) {
    periods += 1
    candidate = addCalendarMonths(billingAnchor, periods * interval)
  }
  return candidate
}

export function annualEquivalentMinor(
  subscriptions: Array<
    Pick<SubscriptionCalculationInput, "amountMinor" | "cadence">
  >
) {
  const multipliers: Record<SubscriptionCadence, number> = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    semiannual: 2,
    yearly: 1,
  }
  return subscriptions.reduce(
    (total, subscription) =>
      total + subscription.amountMinor * multipliers[subscription.cadence],
    0
  )
}

export function monthlyEquivalentMinor(
  subscriptions: Array<
    Pick<SubscriptionCalculationInput, "amountMinor" | "cadence">
  >
) {
  return Math.round(annualEquivalentMinor(subscriptions) / 12)
}

export function renewalDatesInRange(
  billingAnchor: string,
  cadence: SubscriptionCadence,
  from: string,
  through: string
) {
  return occurrenceDatesInRange(billingAnchor, cadence, from, through)
}

export function occurrenceDatesInRange(
  billingAnchor: string,
  cadence: RecurrenceCadence,
  from: string,
  through: string
) {
  const dates: string[] = []
  let candidate = nextOccurrenceDate(billingAnchor, cadence, from)
  while (candidate <= through) {
    dates.push(candidate)
    candidate = nextOccurrenceDate(
      billingAnchor,
      cadence,
      addDateOnlyDays(candidate, 1)
    )
  }
  return dates
}

function addCalendarMonths(anchorValue: string, months: number) {
  const anchor = dateOnlyParts(anchorValue)
  const absoluteMonth = anchor.year * 12 + anchor.month + months
  const year = Math.floor(absoluteMonth / 12)
  const month = absoluteMonth % 12
  const anchorLastDay = daysInUtcMonth(anchor.year, anchor.month)
  const targetLastDay = daysInUtcMonth(year, month)
  const day =
    anchor.day === anchorLastDay
      ? targetLastDay
      : Math.min(anchor.day, targetLastDay)
  return `${year.toString().padStart(4, "0")}-${(month + 1)
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
}
import {
  dateOnlyDayDifference,
  dateOnlyParts,
  daysInUtcMonth,
  addDateOnlyDays,
} from "./date"
