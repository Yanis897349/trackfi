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
import { m } from "../lib/i18n"

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
        label={m.expenses_spent_month()}
        value={formatMoney(summary.spentMinor, currency)}
        detail={
          budget === null
            ? m.expenses_set_budget()
            : m.expenses_of_budget({
                percent: Math.round((summary.spentMinor / budget) * 100),
                budget: formatMoney(budget, currency),
              })
        }
      />
      <MetricCard
        icon={GaugeIcon}
        label={m.expenses_daily_pace()}
        value={formatMoney(summary.dailyPaceMinor, currency)}
        detail={
          dailyDifference === null
            ? m.expenses_set_daily_target()
            : m.expenses_target_difference({
                amount: formatMoney(Math.abs(dailyDifference), currency),
                direction:
                  dailyDifference > 0 ? m.status_above() : m.status_below(),
              })
        }
        accent={dailyDifference !== null && dailyDifference > 0}
      />
      <MetricCard
        icon={PiggyBankIcon}
        label={m.expenses_remaining()}
        value={
          summary.remainingMinor === null
            ? "—"
            : formatMoney(summary.remainingMinor, currency)
        }
        detail={m.expenses_days_left({ count: summary.period.remainingDays })}
      />
      <MetricCard
        icon={CalendarClockIcon}
        label={m.expenses_forecast()}
        value={formatMoney(summary.forecastMinor, currency)}
        detail={
          budget === null
            ? m.expenses_current_pace()
            : m.expenses_budget_difference({
                amount: formatMoney(
                  Math.abs(summary.forecastMinor - budget),
                  currency
                ),
                direction:
                  summary.forecastMinor > budget
                    ? m.status_above()
                    : m.status_below(),
              })
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
