import { Bar, BarChart, Cell, LabelList, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@trackfi/ui/components/chart"

import { formatCompactMoney } from "../lib/currency"
import { formatShortMonth } from "../lib/date"
import type { RevenueSummary } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"

const chartConfig = {
  amountMinor: {
    label: "Forecast income",
    color: "#10b981",
  },
} satisfies ChartConfig

export function RevenueForecastChart({
  forecast,
  currency,
}: {
  forecast: RevenueSummary["forecast"]
  currency: string
}) {
  const data = forecast.series.map((entry) => ({
    ...entry,
    label: formatShortMonth(entry.month),
  }))

  return (
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
                  <span className="text-muted-foreground">Forecast income</span>
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
  )
}

function barOpacity(index: number, length: number) {
  if (length <= 3) return 0.85
  const progress = index / Math.max(1, length - 1)
  return 0.35 + progress * 0.65
}
