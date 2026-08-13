import { dashboardActivities } from "./dashboard-overview-activities"
import {
  addCalendarMonths,
  addDateOnlyDays,
  dateOnlyParts,
  monthEndDateOnly,
} from "./date"
import type {
  DashboardActivity,
  DashboardRows,
} from "./dashboard-overview-types"
import { sumBy } from "./numbers"

export function dashboardCalendar({
  rows,
  currency,
  month,
}: {
  rows: DashboardRows
  currency: string | null
  month: string
}) {
  const monthFrom = `${month}-01`
  const monthTo = monthEndDateOnly(monthFrom)
  const firstWeekday = new Date(
    Date.UTC(dateOnlyParts(monthFrom).year, dateOnlyParts(monthFrom).month, 1)
  ).getUTCDay()
  const rangeFrom = addDateOnlyDays(monthFrom, -(firstWeekday || 7) + 1)
  const rangeTo = addDateOnlyDays(rangeFrom, 41)
  const activities = dashboardActivities(rows, rangeFrom, rangeTo)
  const monthActivities = activities.filter(
    (activity) => activity.date >= monthFrom && activity.date <= monthTo
  )
  const nextMonth = addCalendarMonths(month, 1)
  const nextMonthActivities = dashboardActivities(
    rows,
    `${nextMonth}-01`,
    monthEndDateOnly(`${nextMonth}-01`)
  )
  const inflowMinor = activityTotal(monthActivities, "in")
  const outflowMinor = activityTotal(monthActivities, "out")

  return {
    month,
    currency,
    range: { from: rangeFrom, to: rangeTo },
    activities,
    activityCount: monthActivities.length,
    inflowMinor,
    outflowMinor,
    netMinor: inflowMinor - outflowMinor,
    nextMonth: {
      month: nextMonth,
      firstActivity: nextMonthActivities[0] ?? null,
    },
  }
}

function activityTotal(
  activities: DashboardActivity[],
  direction: DashboardActivity["direction"]
) {
  return sumBy(
    activities.filter((activity) => activity.direction === direction),
    (activity) => activity.amountMinor
  )
}
