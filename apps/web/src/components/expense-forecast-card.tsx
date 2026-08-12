import { lazy, Suspense } from "react"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { cn } from "@trackfi/ui/lib/utils"

import type { ExpenseSummary } from "../lib/expenses"
import { forecastTrendPercentage, formatForecastTrend } from "../lib/forecast"
import { formatMoney } from "../lib/subscriptions"

const ExpenseForecastChart = lazy(async () => {
  const module = await import("./expense-forecast-chart")
  return { default: module.ExpenseForecastChart }
})

export function ExpenseForecastCard({
  summary,
  currency,
}: {
  summary: ExpenseSummary
  currency: string
}) {
  return (
    <Card className="h-[230px] gap-3 py-4 shadow-xs">
      <CardHeader className="flex items-center justify-between px-4">
        <div>
          <CardTitle className="text-sm font-semibold">
            Spending forecast
          </CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Planned expenses and subscriptions by month
          </p>
        </div>
        <ForecastTrend forecast={summary.forecast} />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(summary.forecast.totalMinor, currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">forecast spending</p>
        </div>
        <Suspense fallback={<Skeleton className="mt-1 h-[118px] w-full" />}>
          <ExpenseForecastChart
            forecast={summary.forecast}
            currency={currency}
          />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function ForecastTrend({ forecast }: { forecast: ExpenseSummary["forecast"] }) {
  if (forecast.previousMonthMinor === 0 || !forecast.series.length) return null
  const rounded = forecastTrendPercentage(
    forecast.series[0]!.amountMinor,
    forecast.previousMonthMinor
  )
  const Icon =
    rounded > 0 ? TrendingUpIcon : rounded < 0 ? TrendingDownIcon : MinusIcon
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold",
        rounded > 0 &&
          "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
        rounded < 0 &&
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        rounded === 0 && "bg-muted text-muted-foreground"
      )}
      aria-label={`${formatForecastTrend(rounded)} projected versus last month`}
    >
      <Icon className="size-3" /> {formatForecastTrend(rounded)}
    </div>
  )
}
