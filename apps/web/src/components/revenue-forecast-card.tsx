import { lazy, Suspense } from "react"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { cn } from "@trackfi/ui/lib/utils"

import type { RevenueSummary } from "../lib/revenue"
import { forecastTrendPercentage, formatForecastTrend } from "../lib/forecast"
import { formatMoney } from "../lib/subscriptions"
import { m } from "../lib/i18n"

const RevenueForecastChart = lazy(async () => {
  const module = await import("./revenue-forecast-chart")
  return { default: module.RevenueForecastChart }
})

export function RevenueForecastCard({
  summary,
  currency,
}: {
  summary: RevenueSummary
  currency: string
}) {
  return (
    <Card className="h-[230px] gap-3 py-4 shadow-xs">
      <CardHeader className="flex items-center justify-between px-4">
        <div>
          <CardTitle className="text-sm font-semibold">
            {m.revenue_cash_flow_forecast()}
          </CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {m.revenue_expected_by_month()}
          </p>
        </div>
        <ForecastTrend forecast={summary.forecast} />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(summary.forecast.totalMinor, currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {m.revenue_forecast_income()}
          </p>
        </div>
        <Suspense
          fallback={<div aria-hidden className="mt-1 h-[118px] w-full" />}
        >
          <RevenueForecastChart
            forecast={summary.forecast}
            currency={currency}
          />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function ForecastTrend({ forecast }: { forecast: RevenueSummary["forecast"] }) {
  if (forecast.previousMonthMinor === 0 || !forecast.series.length) return null
  const rounded = forecastTrendPercentage(
    forecast.series[0]!.amountMinor,
    forecast.previousMonthMinor
  )
  const positive = rounded > 0
  const negative = rounded < 0
  const Icon = positive
    ? TrendingUpIcon
    : negative
      ? TrendingDownIcon
      : MinusIcon

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold",
        positive &&
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        negative &&
          "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
        !positive && !negative && "bg-muted text-muted-foreground"
      )}
      aria-label={m.revenue_projected_last_month({
        change: formatForecastTrend(rounded),
      })}
    >
      <Icon className="size-3" />
      {formatForecastTrend(rounded)}
    </div>
  )
}
