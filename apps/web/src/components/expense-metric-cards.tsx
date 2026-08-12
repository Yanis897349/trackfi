import {
  CalendarClockIcon,
  CircleDollarSignIcon,
  GaugeIcon,
  PiggyBankIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { cn } from "@trackfi/ui/lib/utils"

import type { ExpenseSummary } from "../lib/expenses"
import { formatMoney } from "../lib/subscriptions"

export function ExpenseMetricCards({
  summary,
  currency,
}: {
  summary: ExpenseSummary
  currency: string
}) {
  const budget = summary.effectiveBudgetMinor
  const dailyDifference =
    summary.settings.dailyTargetMinor === null
      ? null
      : summary.dailyPaceMinor - summary.settings.dailyTargetMinor
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={CircleDollarSignIcon}
        label="Spent this month"
        value={formatMoney(summary.spentMinor, currency)}
        detail={
          budget === null
            ? "Set a budget to track progress"
            : `${Math.round((summary.spentMinor / budget) * 100)}% of ${formatMoney(budget, currency)} budget`
        }
      />
      <MetricCard
        icon={GaugeIcon}
        label="Daily pace"
        value={formatMoney(summary.dailyPaceMinor, currency)}
        detail={
          dailyDifference === null
            ? "Set a daily spending target"
            : `${formatMoney(Math.abs(dailyDifference), currency)} ${dailyDifference > 0 ? "above" : "below"} target`
        }
        accent={dailyDifference !== null && dailyDifference > 0}
      />
      <MetricCard
        icon={PiggyBankIcon}
        label="Remaining"
        value={
          summary.remainingMinor === null
            ? "—"
            : formatMoney(summary.remainingMinor, currency)
        }
        detail={`${summary.period.remainingDays} days left`}
      />
      <MetricCard
        icon={CalendarClockIcon}
        label="Forecast"
        value={formatMoney(summary.forecastMinor, currency)}
        detail={
          budget === null
            ? "Based on your current pace"
            : `${formatMoney(Math.abs(summary.forecastMinor - budget), currency)} ${summary.forecastMinor > budget ? "over" : "under"} budget`
        }
        accent={budget !== null && summary.forecastMinor > budget}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = false,
}: {
  icon: typeof CircleDollarSignIcon
  label: string
  value: string
  detail: string
  accent?: boolean
}) {
  return (
    <Card className="gap-3 rounded-[10px] py-4 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p
          className={cn(
            "mt-1 text-[11px] text-muted-foreground",
            accent && "text-orange-600"
          )}
        >
          {detail}
        </p>
      </CardContent>
    </Card>
  )
}
