import { addDateOnlyDays, dateOnlyDayDifference } from "./date"
import type { DashboardActivity } from "./dashboard-overview-types"
import { sumBy } from "./numbers"

export function bucketActivities(
  activities: DashboardActivity[],
  from: string,
  to: string
) {
  return bucketRanges(from, to).map((range) => {
    const entries = activities.filter(
      (activity) => activity.date >= range.from && activity.date <= range.to
    )
    const incomeMinor = sumBy(
      entries.filter((entry) => entry.direction === "in"),
      (entry) => entry.amountMinor
    )
    const outgoingMinor = sumBy(
      entries.filter((entry) => entry.direction === "out"),
      (entry) => entry.amountMinor
    )
    return {
      ...range,
      incomeMinor,
      outgoingMinor,
      netMinor: incomeMinor - outgoingMinor,
    }
  })
}

export function bucketModuleActivities(
  activities: DashboardActivity[],
  from: string,
  to: string
) {
  return bucketRanges(from, to).map((range) => ({
    ...range,
    amountMinor: sumBy(
      activities.filter(
        (activity) => activity.date >= range.from && activity.date <= range.to
      ),
      (activity) => activity.amountMinor
    ),
  }))
}

function bucketRanges(from: string, to: string) {
  const days = dateOnlyDayDifference(from, to) + 1
  const bucketCount = Math.min(7, days)
  const baseSize = Math.floor(days / bucketCount)
  const remainder = days % bucketCount
  const ranges: Array<{ from: string; to: string }> = []
  let cursor = from
  for (let index = 0; index < bucketCount; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0)
    const bucketTo = addDateOnlyDays(cursor, size - 1)
    ranges.push({ from: cursor, to: bucketTo })
    cursor = addDateOnlyDays(bucketTo, 1)
  }
  return ranges
}
