import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Bar, BarChart, Cell, LabelList, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@trackfi/ui/components/chart"
import { cn } from "@trackfi/ui/lib/utils"

import type { RevenueSummary } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"

const chartConfig = {
  amountMinor: {
    label: "Forecast income",
    color: "#10b981",
  },
} satisfies ChartConfig

export function RevenueForecastCard({
  summary,
  currency,
}: {
  summary: RevenueSummary
  currency: string
}) {
  const data = summary.forecast.series.map((entry) => ({
    ...entry,
    label: formatMonth(entry.month),
  }))

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
        <ChartContainer
          config={chartConfig}
          className="mt-1 aspect-auto h-[118px] w-full"
          initialDimension={{ width: 640, height: 118 }}
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={5}
              fontSize={10}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.35 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  hideIndicator
                  formatter={(value) => (
                    <div className="flex min-w-36 items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        Forecast income
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {formatMoney(Number(value), currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="amountMinor"
              fill="var(--color-amountMinor)"
              radius={[4, 4, 1, 1]}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.month}
                  fillOpacity={barOpacity(index, data.length)}
                />
              ))}
              {data.length <= 6 && (
                <LabelList
                  dataKey="amountMinor"
                  position="top"
                  formatter={(value) =>
                    formatCompactMoney(Number(value ?? 0), currency)
                  }
                  className="fill-muted-foreground text-[9px] font-medium"
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
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

function formatMonth(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`))
}

function formatCompactMoney(amountMinor: number, currency: string) {
  const fractionDigits =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountMinor / 10 ** fractionDigits)
}

function formatTrend(value: number) {
  if (value === 0) return "0%"
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`
}

function barOpacity(index: number, length: number) {
  if (length <= 3) return 0.85
  const progress = index / Math.max(1, length - 1)
  return 0.35 + progress * 0.65
}
