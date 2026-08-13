import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Bar, BarChart, Cell, XAxis } from "recharts"

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

import {
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
} from "../lib/currency"
import type { DashboardOverview } from "../lib/dashboard"
import { dashboardMovementColor } from "../lib/dashboard-colors"
import { formatShortDateOnly } from "../lib/date"
import { m } from "../lib/i18n"
import { DashboardActivityAmount } from "./dashboard-activity-parts"

const movementConfig = {
  netMinor: { label: m.dashboard_net_movement(), color: "#00a876" },
} satisfies ChartConfig

export function DashboardFinancialPulse({
  overview,
  currency,
}: {
  overview: DashboardOverview
  currency: string
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <div className="flex min-h-[260px] flex-col rounded-xl bg-[#171717] p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] text-[#a9a9a4] uppercase">
              {m.dashboard_net_position_range()}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-[32px] leading-tight font-semibold tracking-[-0.04em]",
                overview.totals.netPositionMinor < 0 && "text-orange-400"
              )}
            >
              {formatSignedMoney(overview.totals.netPositionMinor, currency)}
            </p>
            <p className="mt-1.5 text-xs text-[#bebeba] sm:text-sm">
              {m.dashboard_net_position_summary({
                expected: formatMoney(
                  overview.totals.expectedIncomeMinor,
                  currency
                ),
                committed: formatMoney(
                  overview.totals.committedMinor,
                  currency
                ),
              })}
            </p>
          </div>
          <TrendBadge value={overview.totals.comparisonPercent} />
        </div>
        <MovementChart overview={overview} currency={currency} />
      </div>
      <Card className="min-h-[260px] gap-3 py-5 shadow-xs">
        <CardHeader className="flex items-center justify-between px-5">
          <CardTitle className="text-base font-bold">
            {m.dashboard_range_activity()}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {m.dashboard_movement_count({ count: overview.activity.total })}
          </span>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-5">
          {overview.highlights.length ? (
            <div className="divide-y">
              {overview.highlights.map((activity) => (
                <div
                  key={activity.id}
                  className="flex h-10 items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-12 shrink-0 font-mono text-[9px] font-semibold text-muted-foreground uppercase">
                      {formatShortDateOnly(activity.date)}
                    </span>
                    <span className="truncate text-xs font-medium">
                      {activity.label}
                    </span>
                  </div>
                  <DashboardActivityAmount
                    activity={activity}
                    currency={currency}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center text-sm text-muted-foreground">
              {m.dashboard_no_activity()}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null
  const positive = value > 0
  const negative = value < 0
  const Icon = positive
    ? TrendingUpIcon
    : negative
      ? TrendingDownIcon
      : MinusIcon
  const label = formatSignedPercent(value)
  return (
    <span
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold",
        positive && "bg-[#20372f] text-[#65dbb2]",
        negative && "bg-orange-950/70 text-orange-300",
        !positive && !negative && "bg-white/10 text-white/70"
      )}
      aria-label={m.dashboard_comparison_label({ change: label })}
    >
      <Icon className="size-3.5" /> {label}
    </span>
  )
}

function MovementChart({
  overview,
  currency,
}: {
  overview: DashboardOverview
  currency: string
}) {
  const data = overview.movement.map((entry) => ({
    ...entry,
    label: formatShortDateOnly(entry.to),
  }))
  return (
    <ChartContainer
      config={movementConfig}
      className="mt-auto h-[115px] w-full text-[#a9a9a4]"
      initialDimension={{ width: 700, height: 115 }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={6}
          fontSize={9}
        />
        <ChartTooltip
          cursor={{ fill: "#ffffff", opacity: 0.06 }}
          content={
            <ChartTooltipContent
              hideLabel
              hideIndicator
              formatter={(value) => (
                <span className="font-mono font-medium text-foreground">
                  {formatSignedMoney(Number(value), currency)}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="netMinor" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={entry.from}
              fill={dashboardMovementColor(entry.netMinor, index, data.length)}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
