import { addDateOnlyDays, monthEndDateOnly } from "./date"

export function subscriptionCalendarRange(month: string) {
  const monthStart = `${month}-01`
  const monthEnd = monthEndDateOnly(monthStart)
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
