import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TagsIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Button, buttonVariants } from "@trackfi/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { cn } from "@trackfi/ui/lib/utils"

import {
  formatMonthTitle,
  monthDate,
  shiftMonth,
} from "../lib/subscription-calendar"
import { formatMoney, type RenewalCalendar } from "../lib/subscriptions"
import { SubscriptionRenewalAgenda } from "./subscription-renewal-agenda"
import { SubscriptionRenewalMonth } from "./subscription-renewal-month"
import { m } from "../lib/i18n"

export function SubscriptionCalendarView({
  calendar,
  currency,
  isUpdating,
  month,
  message,
  onMonthChange,
}: {
  calendar: RenewalCalendar
  currency: string
  isUpdating: boolean
  month: Date
  message: string
  onMonthChange(month: Date): void
}) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard/subscriptions"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-fit px-4"
          )}
        >
          <ArrowLeftIcon /> {m.calendar_back()}
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          <CalendarStat icon={CalendarCheckIcon}>
            {m.calendar_renewal_count({ count: calendar.renewalCount })}
          </CalendarStat>
          <CalendarStat icon={WalletCardsIcon}>
            {m.calendar_due({
              amount: formatMoney(calendar.totalMinor, currency),
            })}
          </CalendarStat>
          <CalendarStat icon={TagsIcon}>
            {m.calendar_category_count({ count: calendar.categoryCount })}
          </CalendarStat>
        </div>
      </div>
      {message && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {message}
        </p>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
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
            <CardTitle className="text-center text-base">
              {formatMonthTitle(month)}
            </CardTitle>
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={() => onMonthChange(monthDate(new Date()))}
            >
              {m.common_today()}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <SubscriptionRenewalMonth
              month={month}
              renewals={calendar.renewals}
              currency={currency}
            />
          </CardContent>
        </Card>
        <SubscriptionRenewalAgenda
          calendar={calendar}
          currency={currency}
          month={month}
        />
      </div>
    </>
  )
}

function CalendarStat({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarCheckIcon
  children: ReactNode
}) {
  return (
    <span className="flex items-center gap-1.5 font-medium">
      <Icon className="size-4 text-muted-foreground" /> {children}
    </span>
  )
}
