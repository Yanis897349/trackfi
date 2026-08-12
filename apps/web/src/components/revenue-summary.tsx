import {
  CalendarDaysIcon,
  ChartPieIcon,
  Clock3Icon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trackfi/ui/components/table"
import { cn } from "@trackfi/ui/lib/utils"

import { formatDateOnly } from "../lib/date"
import {
  type RevenueForecastMonths,
  type RevenueSummary as Summary,
} from "../lib/revenue"
import { displayLabel, formatMoney } from "../lib/subscriptions"

const forecastRangeOptions = [3, 6, 12] as const
const chartConfig = {
  amountMinor: {
    label: "Forecast income",
    color: "#10b981",
  },
} satisfies ChartConfig

export function RevenueSummary({
  summary,
  currency,
  months,
  fetching,
  onMonthsChange,
}: {
  summary: Summary
  currency: string
  months: RevenueForecastMonths
  fetching: boolean
  onMonthsChange(months: RevenueForecastMonths): void
}) {
  return (
    <section className="space-y-4" aria-busy={fetching}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">Revenue outlook</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Forecasted cash flow and incoming payments
          </p>
        </div>
        <Select
          items={forecastRangeOptions.map((value) => ({
            value: String(value),
            label: `Next ${value} months`,
          }))}
          value={String(months)}
          onValueChange={(value) =>
            value && onMonthsChange(Number(value) as RevenueForecastMonths)
          }
        >
          <SelectTrigger
            aria-label="Forecast range"
            className="h-8 w-full gap-2 bg-card px-2.5 text-xs sm:w-auto"
            disabled={fetching}
          >
            <CalendarDaysIcon className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {forecastRangeOptions.map((value) => (
              <SelectItem key={value} value={String(value)}>
                Next {value} months
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <ForecastCard summary={summary} currency={currency} />
        <ContributionCard summary={summary} currency={currency} />
      </div>

      <UpcomingIncomeCard summary={summary} currency={currency} />
    </section>
  )
}

function ForecastCard({
  summary,
  currency,
}: {
  summary: Summary
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

function ForecastTrend({ forecast }: { forecast: Summary["forecast"] }) {
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

function ContributionCard({
  summary,
  currency,
}: {
  summary: Summary
  currency: string
}) {
  const sources = contributionMix(summary)
  const colors = ["bg-emerald-600", "bg-emerald-400", "bg-emerald-200"]

  return (
    <Card className="min-h-[230px] gap-3 py-4 shadow-xs lg:h-[230px]">
      <CardHeader className="flex items-center justify-between px-4">
        <div>
          <CardTitle className="text-sm font-semibold">
            Source contribution
          </CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Monthly equivalent
          </p>
        </div>
        <ChartPieIcon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center justify-between rounded-md bg-muted px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">
            Expected monthly
          </span>
          <span className="text-[13px] font-semibold">
            {formatMoney(summary.monthlyEquivalentMinor, currency)}
          </span>
        </div>
        {sources.length ? (
          <div className="space-y-2.5">
            {sources.map((source, index) => {
              const percentage = summary.monthlyEquivalentMinor
                ? Math.round(
                    (source.monthlyEquivalentMinor /
                      summary.monthlyEquivalentMinor) *
                      100
                  )
                : 0
              return (
                <div key={source.sourceId} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="truncate font-medium">{source.name}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {formatMoney(source.monthlyEquivalentMinor, currency)} ·{" "}
                      {percentage}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-label={`${source.name} monthly contribution`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <div
                      className={cn("h-full rounded-full", colors[index])}
                      style={{
                        width: `${Math.min(100, Math.max(2, percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add an active revenue source to see your income mix.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingIncomeCard({
  summary,
  currency,
}: {
  summary: Summary
  currency: string
}) {
  const upcoming = summary.upcomingIncome.slice(0, 3)

  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardHeader className="flex min-h-12 flex-col items-start justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-sm font-semibold">
            Upcoming income
          </CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Next scheduled and estimated payments
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Clock3Icon className="size-3.5" />
          {formatMoney(summary.upcomingTotalMinor, currency)} due in 30 days
        </div>
      </CardHeader>
      {upcoming.length ? (
        <>
          <div className="hidden lg:block">
            <Table className="text-[11px]">
              <TableHeader>
                <TableRow className="h-[30px] hover:bg-muted">
                  <TableHead className="h-[30px] pl-4 text-[10px]">
                    Source
                  </TableHead>
                  <TableHead className="h-[30px] w-[150px] text-[10px]">
                    Expected
                  </TableHead>
                  <TableHead className="h-[30px] w-[190px] text-[10px]">
                    Take-home
                  </TableHead>
                  <TableHead className="h-[30px] w-[180px] text-[10px]">
                    Confidence
                  </TableHead>
                  <TableHead className="h-[30px] w-[190px] pr-4 text-[10px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((item) => (
                  <TableRow
                    key={item.id}
                    className="h-[39px] hover:bg-muted/30"
                  >
                    <TableCell className="py-1 pl-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {displayLabel(item.category)}
                      </p>
                    </TableCell>
                    <TableCell className="py-1">
                      {item.expectedDate
                        ? formatUpcomingDate(item.expectedDate)
                        : "This month"}
                    </TableCell>
                    <TableCell className="py-1 font-semibold">
                      {formatMoney(item.amountMinor, currency)}
                    </TableCell>
                    <TableCell className="py-1">
                      <ConfidenceLabel
                        scheduled={item.scheduleType === "scheduled"}
                      />
                    </TableCell>
                    <TableCell className="py-1 pr-4">
                      <IncomeTypeBadge
                        scheduled={item.scheduleType === "scheduled"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 border-t p-4 lg:hidden">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-muted/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.expectedDate
                      ? formatDateOnly(item.expectedDate)
                      : "This month"}{" "}
                    · {displayLabel(item.category)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <ConfidenceLabel
                      scheduled={item.scheduleType === "scheduled"}
                    />
                    <IncomeTypeBadge
                      scheduled={item.scheduleType === "scheduled"}
                    />
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {formatMoney(item.amountMinor, currency)}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <CardContent className="border-t py-6 text-sm text-muted-foreground">
          Add an active revenue source to see upcoming income.
        </CardContent>
      )}
    </Card>
  )
}

function ConfidenceLabel({ scheduled }: { scheduled: boolean }) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium",
        scheduled
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-orange-700 dark:text-orange-400"
      )}
    >
      {scheduled ? "Confirmed" : "Estimate"}
    </span>
  )
}

function IncomeTypeBadge({ scheduled }: { scheduled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium",
        scheduled
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          scheduled ? "bg-emerald-500" : "bg-orange-500"
        )}
        aria-hidden="true"
      />
      {scheduled ? "Scheduled" : "Estimated"}
    </span>
  )
}

function contributionMix(summary: Summary) {
  const sources = summary.sourceBreakdown
  if (sources.length <= 3) return sources
  return [
    ...sources.slice(0, 2),
    {
      sourceId: "other",
      name: "Other",
      category: "other" as const,
      monthlyEquivalentMinor: sources
        .slice(2)
        .reduce((total, source) => total + source.monthlyEquivalentMinor, 0),
    },
  ]
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`))
}

function formatUpcomingDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
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
