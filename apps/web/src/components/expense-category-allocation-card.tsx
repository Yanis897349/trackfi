import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import type { ExpenseSummary } from "../lib/expenses"
import { displayLabel, formatMoney } from "../lib/subscriptions"

export function ExpenseCategoryAllocationCard({
  summary,
  currency,
}: {
  summary: ExpenseSummary
  currency: string
}) {
  const entries = categoryEntries(summary)
  return (
    <Card className="gap-3 rounded-[10px] py-[18px] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-[18px]">
        <CardTitle className="text-sm">Category allocation</CardTitle>
        <span className="text-xs font-semibold">
          {formatMoney(summary.spentMinor, currency)}
        </span>
      </CardHeader>
      <CardContent className="space-y-2.5 px-[18px]">
        {entries.length ? (
          entries.map((entry) => {
            const percentage = summary.spentMinor
              ? Math.round((entry.totalMinor / summary.spentMinor) * 100)
              : 0
            return (
              <div key={entry.category} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium">
                    {displayLabel(entry.category)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatMoney(entry.totalMinor, currency)} {percentage}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-neutral-800"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add expenses to see category allocation.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function categoryEntries(summary: ExpenseSummary) {
  if (summary.categoryBreakdown.length <= 4) return summary.categoryBreakdown
  return [
    ...summary.categoryBreakdown.slice(0, 3),
    {
      category: "other" as const,
      totalMinor: summary.categoryBreakdown
        .slice(3)
        .reduce((total, entry) => total + entry.totalMinor, 0),
    },
  ]
}
