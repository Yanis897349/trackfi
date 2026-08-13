import { Link } from "@tanstack/react-router"
import {
  ArrowDownUpIcon,
  ArrowLeftIcon,
  CalendarCheck2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import { Card, CardContent, CardHeader } from "@trackfi/ui/components/card"
import { cn } from "@trackfi/ui/lib/utils"

import { formatSignedMoney } from "../lib/currency"
import type { DashboardCalendar } from "../lib/dashboard"
import { m } from "../lib/i18n"
import {
  formatMonthTitle,
  monthDate,
  shiftMonth,
} from "../lib/subscription-calendar"
import { DashboardActivityCalendar } from "./dashboard-activity-calendar"
import { DashboardCalendarSidebar } from "./dashboard-calendar-sidebar"

export function DashboardCalendarView({
  calendar,
  currency,
  isUpdating,
  month,
  onMonthChange,
}: {
  calendar: DashboardCalendar
  currency: string
  isUpdating: boolean
  month: Date
  onMonthChange(month: Date): void
}) {
  const outgoingCount = calendar.activities.filter(
    (activity) =>
      activity.date.startsWith(calendar.month) && activity.direction === "out"
  ).length

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-fit px-4"
          )}
        >
          <ArrowLeftIcon /> {m.dashboard_calendar_back()}
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <CalendarCheck2Icon className="size-4 text-muted-foreground" />
            {m.dashboard_calendar_activity_count({
              count: calendar.activityCount,
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <WalletCardsIcon className="size-4 text-muted-foreground" />
            {m.dashboard_calendar_outgoing_count({ count: outgoingCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowDownUpIcon className="size-4 text-muted-foreground" />
            {m.dashboard_calendar_net({
              amount: formatSignedMoney(calendar.netMinor, currency),
            })}
          </span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.05fr)_minmax(18rem,1fr)]">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="grid grid-cols-[auto_1fr_auto] items-center border-b px-4 py-4">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isUpdating}
                onClick={() => onMonthChange(shiftMonth(month, -1))}
              >
                <ChevronLeftIcon />
                <span className="sr-only">{m.calendar_previous_month()}</span>
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isUpdating}
                onClick={() => onMonthChange(shiftMonth(month, 1))}
              >
                <ChevronRightIcon />
                <span className="sr-only">{m.calendar_next_month()}</span>
              </Button>
            </div>
            <h3 className="text-center text-sm font-bold sm:text-base">
              {formatMonthTitle(month)}
            </h3>
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={() => onMonthChange(monthDate(new Date()))}
            >
              {m.common_today()}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <DashboardActivityCalendar
              activities={calendar.activities}
              currency={currency}
              month={month}
            />
          </CardContent>
        </Card>
        <DashboardCalendarSidebar calendar={calendar} currency={currency} />
      </div>
    </>
  )
}
