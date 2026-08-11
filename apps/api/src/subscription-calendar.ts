import { addDateOnlyDays, dateOnlyParts, daysInUtcMonth } from "./date"

export function subscriptionCalendarRange(month: string) {
  const monthStart = `${month}-01`
  const { year, month: monthIndex } = dateOnlyParts(monthStart)
  const monthEnd = `${month}-${daysInUtcMonth(year, monthIndex)
    .toString()
    .padStart(2, "0")}`
  const firstWeekday = new Date(`${monthStart}T00:00:00Z`).getUTCDay()
  const lastWeekday = new Date(`${monthEnd}T00:00:00Z`).getUTCDay()
  const daysBefore = (firstWeekday + 6) % 7
  const daysAfter = 6 - ((lastWeekday + 6) % 7)
  return {
    monthStart,
    monthEnd,
    rangeStart: addDateOnlyDays(monthStart, -daysBefore),
    rangeEnd: addDateOnlyDays(monthEnd, daysAfter),
  }
}
