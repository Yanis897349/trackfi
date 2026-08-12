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
