import type { SubscriptionCategory } from "./subscriptions"
import { intlLocale } from "./i18n"

export function monthDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

export function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)
}

export function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
}

export function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "long",
    year: "numeric",
  }).format(date)
}

export function calendarDateOnly(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
}

export function subscriptionCategoryStyle(category: SubscriptionCategory) {
  const styles: Record<SubscriptionCategory, string> = {
    software: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    entertainment: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    utilities: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    finance: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    health: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    education: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    shopping: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    other: "bg-muted text-muted-foreground",
  }
  return styles[category]
}
