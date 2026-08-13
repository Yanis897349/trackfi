import { Bar, BarChart, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@trackfi/ui/components/chart"

import { formatMoney } from "../lib/currency"
import type { DashboardSeriesEntry } from "../lib/dashboard"
import { dashboardChartColors } from "../lib/dashboard-colors"
import { formatDateOnlyRange } from "../lib/date"

export type DashboardModuleAccent = "dark" | "orange" | "green"

export function DashboardModuleSparkChart({
  series,
  accent,
  currency,
  label,
}: {
  series: DashboardSeriesEntry[]
  accent: DashboardModuleAccent
  currency: string
  label: string
}) {
  const config = {
    amountMinor: { label },
  } satisfies ChartConfig
  const summary = series
    .map(
      (entry) =>
        `${formatDateOnlyRange(entry.from, entry.to)}: ${formatMoney(
          entry.amountMinor,
          currency
        )}`
    )
    .join(", ")

  return (
    <ChartContainer
      config={config}
      className="mt-auto aspect-auto h-7 w-full overflow-visible"
      initialDimension={{ width: 280, height: 28 }}
      role="img"
      aria-label={`${label}: ${summary}`}
    >
      <BarChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <ChartTooltip
          allowEscapeViewBox={{ x: true, y: true }}
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_value, payload) => {
                const entry = payload[0]?.payload as
                  DashboardSeriesEntry | undefined
                return entry
                  ? formatDateOnlyRange(entry.from, entry.to)
                  : undefined
              }}
              formatter={(value) => (
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {formatMoney(Number(value), currency)}
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="amountMinor"
          minPointSize={4}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        >
          {series.map((entry, index) => (
            <Cell
              key={entry.from}
              fill={
                index === series.length - 1
                  ? sparkAccentColor(accent)
                  : "var(--muted)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function sparkAccentColor(accent: DashboardModuleAccent) {
  if (accent === "orange") return dashboardChartColors.expenses
  if (accent === "green") return dashboardChartColors.revenue
  return dashboardChartColors.subscriptions
}
