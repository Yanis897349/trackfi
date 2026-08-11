export const subscriptionCadences = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
] as const

export type SubscriptionCadence = (typeof subscriptionCadences)[number]

export interface SubscriptionCalculationInput {
  amountMinor: number
  billingAnchor: string
  cadence: SubscriptionCadence
}

const dayMilliseconds = 86_400_000
const cadenceMonths: Partial<Record<SubscriptionCadence, number>> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  )
}

export function addDays(date: string, days: number) {
  const result = new Date(parseDate(date) + days * dayMilliseconds)
  return formatDate(result)
}

export function nextRenewalDate(
  billingAnchor: string,
  cadence: SubscriptionCadence,
  asOf: string
) {
  if (billingAnchor >= asOf) return billingAnchor

  if (cadence === "weekly") {
    const elapsedDays = Math.floor(
      (parseDate(asOf) - parseDate(billingAnchor)) / dayMilliseconds
    )
    return addDays(billingAnchor, Math.ceil(elapsedDays / 7) * 7)
  }

  const interval = cadenceMonths[cadence]!
  const anchor = parts(billingAnchor)
  const current = parts(asOf)
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

function addCalendarMonths(anchorValue: string, months: number) {
  const anchor = parts(anchorValue)
  const absoluteMonth = anchor.year * 12 + anchor.month + months
  const year = Math.floor(absoluteMonth / 12)
  const month = absoluteMonth % 12
  const anchorLastDay = daysInMonth(anchor.year, anchor.month)
  const targetLastDay = daysInMonth(year, month)
  const day =
    anchor.day === anchorLastDay
      ? targetLastDay
      : Math.min(anchor.day, targetLastDay)
  return `${year.toString().padStart(4, "0")}-${(month + 1)
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function parts(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return { year: year!, month: month! - 1, day: day! }
}

function parseDate(value: string) {
  const valueParts = parts(value)
  return Date.UTC(valueParts.year, valueParts.month, valueParts.day)
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}
