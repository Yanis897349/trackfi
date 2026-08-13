import { intlLocale } from "./i18n"

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: "medium",
  }).format(typeof value === "string" ? new Date(value) : value)
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}

export function formatShortDateOnly(value: string) {
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}

export function formatShortMonth(value: string) {
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`))
}

export function localDate() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function parseLocalDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year!, month! - 1, day!)
}

export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = parseLocalDateOnly(value)
  return (
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() === Number(value.slice(5, 7)) - 1 &&
    date.getDate() === Number(value.slice(8, 10))
  )
}

export function dateOnlyDayDifference(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T00:00:00Z`)
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000)
}

export function isDateOnlyRange(
  from: string | undefined,
  to: string | undefined,
  maximumDifference = Number.POSITIVE_INFINITY
) {
  return Boolean(
    from &&
    to &&
    isDateOnly(from) &&
    isDateOnly(to) &&
    from <= to &&
    dateOnlyDayDifference(from, to) <= maximumDifference
  )
}

export function currentMonthDateOnlyRange(today = localDate()) {
  const from = `${today.slice(0, 7)}-01`
  const nextMonth = addDateOnlyMonths(from, 1)
  return { from, to: addDateOnlyDays(nextMonth, -1) }
}

export function formatDateOnlyRange(from: string, to: string) {
  const locale = intlLocale()
  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T00:00:00Z`)
  if (from.slice(0, 4) === to.slice(0, 4)) {
    const fromLabel = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(fromDate)
    const toLabel = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(toDate)
    return `${fromLabel} – ${toLabel}`
  }
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  })
  return `${formatter.format(fromDate)} – ${formatter.format(toDate)}`
}

export function addDateOnlyMonths(value: string, amount: number) {
  const [year, month, day] = value.split("-").map(Number)
  const absoluteMonth = year! * 12 + month! - 1 + amount
  const targetYear = Math.floor(absoluteMonth / 12)
  const targetMonth = ((absoluteMonth % 12) + 12) % 12
  const targetDay = Math.min(
    day!,
    new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  )
  return new Date(Date.UTC(targetYear, targetMonth, targetDay))
    .toISOString()
    .slice(0, 10)
}

export function addDateOnlyDays(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export function formatMonthDateOnly(value: string) {
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}

export function dateOnlyMonth(value: string) {
  return Number(value.slice(5, 7))
}

export function currentMonthDateOnly(day: number) {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}-${String(day).padStart(2, "0")}`
}

export function dateOnlyGroupLabel(
  value: string,
  labels: { today: string; yesterday: string },
  now = new Date()
) {
  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10)
  const date = new Date(`${value}T00:00:00Z`)

  return {
    relative:
      value === today
        ? labels.today
        : value === yesterday
          ? labels.yesterday
          : null,
    weekday: new Intl.DateTimeFormat(intlLocale(), {
      weekday: "long",
      timeZone: "UTC",
    }).format(date),
    date: formatShortDateOnly(value),
  }
}
