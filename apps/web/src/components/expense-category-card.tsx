import { ChartPieIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import type { ExpenseSummary } from "../lib/expenses"
import { displayLabel, formatMoney } from "../lib/subscriptions"

export function ExpenseCategoryCard({
  summary,
  currency,
}: {
  summary: ExpenseSummary
  currency: string
}) {
  const categories = categoryMix(summary)
  return (
    <Card className="min-h-[230px] gap-3 py-4 shadow-xs lg:h-[230px]">
      <CardHeader className="flex items-center justify-between px-4">
        <div>
          <CardTitle className="text-sm font-semibold">Category mix</CardTitle>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Across the selected forecast
          </p>
        </div>
        <ChartPieIcon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center justify-between rounded-md bg-muted px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">
            Monthly average
          </span>
          <span className="text-[13px] font-semibold">
            {formatMoney(summary.forecast.averageMonthlyMinor, currency)}
          </span>
        </div>
        {categories.length ? (
          <div className="space-y-2.5">
            {categories.map((entry) => {
              const percentage = summary.forecast.totalMinor
                ? Math.round(
                    (entry.totalMinor / summary.forecast.totalMinor) * 100
                  )
                : 0
              return (
                <div key={entry.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="truncate font-medium">{entry.label}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {formatMoney(entry.totalMinor, currency)} · {percentage}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-label={`${entry.label} share of forecast spending`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <div
                      className="h-full rounded-full bg-orange-500"
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
            Add an expense to see your spending mix.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function categoryMix(summary: ExpenseSummary) {
  const categories = summary.categoryBreakdown.map((entry) => ({
    ...entry,
    key: entry.category,
    label: displayLabel(entry.category),
  }))
  if (categories.length <= 3) return categories
  return [
    ...categories.slice(0, 2),
    {
      key: "remaining-categories",
      label: "Everything else",
      category: "other" as const,
      totalMinor: categories
        .slice(2)
        .reduce((total, category) => total + category.totalMinor, 0),
    },
  ]
}
