const dayMilliseconds = 86_400_000

export interface DateOnlyParts {
  day: number
  month: number
  year: number
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const expected = dateOnlyParts(value)
  const date = new Date(Date.UTC(expected.year, expected.month, expected.day))
  return (
    date.getUTCFullYear() === expected.year &&
    date.getUTCMonth() === expected.month &&
    date.getUTCDate() === expected.day
  )
}

export function dateOnlyParts(value: string): DateOnlyParts {
  const [year, month, day] = value.split("-").map(Number)
  return { year: year!, month: month! - 1, day: day! }
}

export function parseDateOnly(value: string) {
  const date = dateOnlyParts(value)
  return Date.UTC(date.year, date.month, date.day)
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

export function addDateOnlyDays(value: string, days: number) {
  return formatDateOnly(new Date(parseDateOnly(value) + days * dayMilliseconds))
}

export function dateOnlyDayDifference(from: string, to: string) {
  return Math.floor((parseDateOnly(to) - parseDateOnly(from)) / dayMilliseconds)
}

export function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

export function todayDateOnly() {
  return formatDateOnly(new Date())
}
