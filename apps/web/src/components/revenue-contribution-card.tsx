import { ChartPieIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"
import { cn } from "@trackfi/ui/lib/utils"

import type { RevenueSummary } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"

const contributionColors = [
  "bg-emerald-600",
  "bg-emerald-400",
  "bg-emerald-200",
]

export function RevenueContributionCard({
  summary,
  currency,
}: {
  summary: RevenueSummary
  currency: string
}) {
  const sources = contributionMix(summary)

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
                      className={cn(
                        "h-full rounded-full",
                        contributionColors[index]
                      )}
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

function contributionMix(summary: RevenueSummary) {
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
