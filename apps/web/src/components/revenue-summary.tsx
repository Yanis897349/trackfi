import {
  BanknoteIcon,
  CalendarClockIcon,
  ChartNoAxesColumnIncreasingIcon,
  CircleDollarSignIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import type { RevenueSummary as Summary } from "../lib/revenue"
import { formatMoney } from "../lib/subscriptions"

export function RevenueSummary({
  summary,
  currency,
}: {
  summary: Summary
  currency: string
}) {
  const breakdown = sourceMix(summary)
  const largest = Math.max(
    ...breakdown.map((source) => source.monthlyEquivalentMinor),
    1
  )
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active sources"
          value={String(summary.activeCount)}
          context={
            summary.activeCount === 0
              ? "No active sources"
              : summary.pausedCount
                ? `${summary.pausedCount} paused`
                : summary.variableCount
                  ? `${summary.variableCount} variable estimate${summary.variableCount === 1 ? "" : "s"}`
                  : "Scheduled and earning"
          }
          icon={BanknoteIcon}
        />
        <MetricCard
          label="Expected monthly"
          value={formatMoney(summary.monthlyEquivalentMinor, currency)}
          context="Normalized take-home forecast"
          icon={CircleDollarSignIcon}
        />
        <MetricCard
          label="Annual forecast"
          value={formatMoney(summary.annualEquivalentMinor, currency)}
          context={`Across ${summary.activeCategoryCount} ${summary.activeCategoryCount === 1 ? "category" : "categories"}`}
          icon={ChartNoAxesColumnIncreasingIcon}
        />
        <MetricCard
          label="Due in 30 days"
          value={formatMoney(summary.upcomingTotalMinor, currency)}
          context={`${summary.upcomingCount} scheduled ${summary.upcomingCount === 1 ? "payment" : "payments"}`}
          icon={CalendarClockIcon}
        />
      </div>
      <Card className="gap-4 shadow-xs">
        <CardHeader>
          <CardTitle>Revenue by source</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            Monthly-equivalent contribution from active income sources.
          </p>
        </CardHeader>
        <CardContent>
          {breakdown.length ? (
            <div className="space-y-4">
              {breakdown.map((source) => (
                <div key={source.sourceId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{source.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatMoney(source.monthlyEquivalentMinor, currency)} /
                      month
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-label={`${source.name} monthly revenue`}
                    aria-valuemin={0}
                    aria-valuemax={largest}
                    aria-valuenow={source.monthlyEquivalentMinor}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${Math.max(2, (source.monthlyEquivalentMinor / largest) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add an active revenue source to see your income mix.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function sourceMix(summary: Summary) {
  if (summary.sourceBreakdown.length <= 5) return summary.sourceBreakdown
  const top = summary.sourceBreakdown.slice(0, 5)
  return [
    ...top,
    {
      sourceId: "other",
      name: "Other",
      category: "other" as const,
      monthlyEquivalentMinor: summary.sourceBreakdown
        .slice(5)
        .reduce((total, source) => total + source.monthlyEquivalentMinor, 0),
    },
  ]
}

function MetricCard({
  label,
  value,
  context,
  icon: Icon,
}: {
  label: string
  value: string
  context: string
  icon: typeof CalendarClockIcon
}) {
  return (
    <Card className="h-[126px] shadow-xs">
      <CardContent className="flex h-full flex-col justify-center gap-2.5 px-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-muted-foreground">
            {label}
          </p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="text-[26px] leading-none font-normal tracking-[-0.6px]">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{context}</p>
      </CardContent>
    </Card>
  )
}
