import { useMemo } from "react"

import { Calendar } from "@trackfi/ui/components/calendar"
import { cn } from "@trackfi/ui/lib/utils"

import type { DashboardActivity } from "../lib/dashboard"
import { activityTone } from "../lib/dashboard-calendar"
import { formatMoney } from "../lib/currency"
import { dateFnsLocale, m } from "../lib/i18n"
import { calendarDateOnly } from "../lib/subscription-calendar"

export function DashboardActivityCalendar({
  activities,
  currency,
  month,
}: {
  activities: DashboardActivity[]
  currency: string
  month: Date
}) {
  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, DashboardActivity[]>()
    for (const activity of activities) {
      const dateActivities = grouped.get(activity.date) ?? []
      dateActivities.push(activity)
      grouped.set(activity.date, dateActivities)
    }
    return grouped
  }, [activities])

  return (
    <div className="min-w-[43rem]">
      <Calendar
        month={month}
        weekStartsOn={1}
        fixedWeeks
        hideNavigation
        showOutsideDays
        locale={dateFnsLocale()}
        className="w-full p-0"
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full gap-0",
          month_caption: "hidden",
          month_grid: "w-full table-fixed border-collapse",
          weekdays: "flex w-full border-b bg-muted/40",
          weekday:
            "flex-1 py-2.5 text-center text-[11px] font-semibold text-muted-foreground",
          week: "m-0 flex w-full",
          day: "relative h-28 min-w-0 flex-1 overflow-hidden border-r border-b p-0 text-left last:border-r-0",
          outside: "bg-muted/15 text-muted-foreground",
          today: "bg-accent/40",
        }}
        components={{
          Day: ({ day, modifiers, ...cellProps }) => {
            const date = calendarDateOnly(day.date)
            const dateActivities = activitiesByDate.get(date) ?? []
            return (
              <td {...cellProps}>
                <div className="flex h-28 min-w-0 flex-col gap-1.5 overflow-hidden p-2">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      modifiers.outside && "text-muted-foreground"
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {dateActivities.slice(0, 2).map((activity) => (
                    <span
                      key={activity.id}
                      title={`${activity.label} · ${formatMoney(activity.amountMinor, currency)}`}
                      className={cn(
                        "flex w-full min-w-0 items-center justify-between gap-1 overflow-hidden rounded px-1.5 py-1 text-[10px] font-semibold",
                        activityTone(activity.module)
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {activity.label}
                      </span>
                      <span className="max-w-16 shrink-0 truncate font-mono">
                        {activity.direction === "in" ? "+" : "−"}
                        {formatMoney(activity.amountMinor, currency)}
                      </span>
                    </span>
                  ))}
                  {dateActivities.length > 2 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      {m.calendar_more({ count: dateActivities.length - 2 })}
                    </span>
                  )}
                </div>
              </td>
            )
          },
        }}
      />
    </div>
  )
}
