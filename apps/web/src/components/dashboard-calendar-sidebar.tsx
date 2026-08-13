import { CreditCardIcon, LandmarkIcon, ReceiptTextIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import { formatMoney, formatSignedMoney } from "../lib/currency"
import type { DashboardActivity, DashboardCalendar } from "../lib/dashboard"
import { activityTone } from "../lib/dashboard-calendar"
import { dashboardModuleLabel } from "../lib/dashboard-labels"
import { formatDateOnly } from "../lib/date"
import { intlLocale, m } from "../lib/i18n"
import { formatMonthTitle, monthKeyDate } from "../lib/subscription-calendar"

export function DashboardCalendarSidebar({
  calendar,
  currency,
}: {
  calendar: DashboardCalendar
  currency: string
}) {
  const monthActivities = calendar.activities.filter((activity) =>
    activity.date.startsWith(calendar.month)
  )

  return (
    <aside className="space-y-4 lg:flex lg:h-full lg:flex-col lg:gap-4 lg:space-y-0">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-lg font-bold">
            {m.calendar_upcoming()}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {m.dashboard_calendar_activity_count({
              count: calendar.activityCount,
            })}{" "}
            ·{" "}
            {m.dashboard_calendar_net({
              amount: formatSignedMoney(calendar.netMinor, currency),
            })}
          </p>
        </CardHeader>
        <CardContent className="max-h-[37rem] overflow-y-auto px-0 py-0">
          {monthActivities.length ? (
            monthActivities.map((activity) => (
              <AgendaItem
                key={activity.id}
                activity={activity}
                currency={currency}
              />
            ))
          ) : (
            <p className="p-5 text-sm text-muted-foreground">
              {m.dashboard_calendar_no_activity()}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-between bg-card px-5 py-4">
          <span className="text-xs text-muted-foreground">
            {m.dashboard_calendar_month_net({
              month: formatMonthTitle(monthKeyDate(calendar.month)),
            })}
          </span>
          <span className="font-semibold">
            {formatSignedMoney(calendar.netMinor, currency)}
          </span>
        </CardFooter>
      </Card>
      <ModuleLegend />
      {calendar.nextMonth.firstActivity && (
        <Card className="gap-2 bg-zinc-950 p-5 text-white ring-0 lg:min-h-0 lg:flex-1 dark:bg-zinc-900">
          <p className="text-[11px] font-bold tracking-wide text-zinc-400 uppercase">
            {m.dashboard_calendar_looking_ahead()}
          </p>
          <p className="text-base font-bold">
            {calendar.nextMonth.firstActivity.label}
          </p>
          <p className="text-xs leading-relaxed text-zinc-300">
            {m.dashboard_calendar_next_activity({
              date: formatDateOnly(calendar.nextMonth.firstActivity.date),
              module: dashboardModuleLabel(
                calendar.nextMonth.firstActivity.module
              ),
            })}
          </p>
        </Card>
      )}
    </aside>
  )
}

function AgendaItem({
  activity,
  currency,
}: {
  activity: DashboardActivity
  currency: string
}) {
  const date = new Date(`${activity.date}T00:00:00Z`)
  return (
    <div className="flex min-h-20 items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span className="w-9 shrink-0 text-center">
        <span className="block text-[10px] font-bold text-muted-foreground uppercase">
          {new Intl.DateTimeFormat(intlLocale(), {
            month: "short",
            timeZone: "UTC",
          }).format(date)}
        </span>
        <span className="block text-base font-bold">
          {date.getUTCDate().toString().padStart(2, "0")}
        </span>
      </span>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-md ${activityTone(activity.module)}`}
      >
        <ModuleIcon module={activity.module} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {activity.label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {dashboardModuleLabel(activity.module)}
        </span>
      </span>
      <span className="shrink-0 font-mono text-xs font-semibold">
        {activity.direction === "in" ? "+" : "−"}
        {formatMoney(activity.amountMinor, currency)}
      </span>
    </div>
  )
}

function ModuleLegend() {
  return (
    <Card className="gap-3 bg-muted/40 p-5">
      <CardTitle className="text-sm font-bold">
        {m.dashboard_calendar_module_key()}
      </CardTitle>
      {(["revenue", "expenses", "subscriptions"] as const).map((module) => (
        <div
          key={module}
          className="flex items-center gap-2.5 text-xs font-medium"
        >
          <span className={`size-2.5 rounded-full ${legendDot(module)}`} />
          {dashboardModuleLabel(module)}
        </div>
      ))}
    </Card>
  )
}

function ModuleIcon({ module }: { module: DashboardActivity["module"] }) {
  if (module === "revenue") return <LandmarkIcon className="size-4" />
  if (module === "expenses") return <ReceiptTextIcon className="size-4" />
  return <CreditCardIcon className="size-4" />
}

function legendDot(module: DashboardActivity["module"]) {
  if (module === "revenue") return "bg-emerald-500"
  if (module === "expenses") return "bg-orange-500"
  return "bg-violet-500"
}
