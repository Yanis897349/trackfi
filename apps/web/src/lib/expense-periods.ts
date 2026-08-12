import {
  addDateOnlyDays,
  addDateOnlyMonths,
  dateOnlyMonth,
  formatMonthDateOnly,
} from "./date"
import type { ExpenseSummary } from "./expenses"
import { m } from "./i18n"

export function expensePeriodOptions(summary: ExpenseSummary) {
  const periods = [
    {
      value: "current",
      label: formatMonthDateOnly(summary.period.start),
      month: dateOnlyMonth(summary.period.start),
    },
  ]
  let start = summary.period.start
  for (let index = 1; index < 12; index += 1) {
    const nextStart = addDateOnlyMonths(start, -1)
    const end = addDateOnlyDays(start, -1)
    periods.push({
      value: `${nextStart}:${end}`,
      label: formatMonthDateOnly(nextStart),
      month: dateOnlyMonth(nextStart),
    })
    start = nextStart
  }
  return [
    ...periods
      .sort((left, right) => left.month - right.month)
      .map(({ value, label }) => ({ value, label })),
    { value: "all", label: m.expenses_all_time() },
  ]
}
