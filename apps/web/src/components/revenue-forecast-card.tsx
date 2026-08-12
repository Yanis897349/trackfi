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

import type { RevenueSummary } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"

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
            Cash-flow forecast
          </CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Expected take-home by month
          </p>
        </div>
        <ForecastTrend forecast={summary.forecast} />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(summary.forecast.totalMinor, currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">forecast income</p>
        </div>
        <Suspense fallback={<Skeleton className="mt-1 h-[118px] w-full" />}>
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
  const change =
    ((forecast.series[0]!.amountMinor - forecast.previousMonthMinor) /
      forecast.previousMonthMinor) *
    100
  const rounded = Math.round(change * 10) / 10
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
      aria-label={`${formatTrend(rounded)} projected versus last month`}
    >
      <Icon className="size-3" />
      {formatTrend(rounded)}
    </div>
  )
}

function formatTrend(value: number) {
  if (value === 0) return "0%"
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`
}
