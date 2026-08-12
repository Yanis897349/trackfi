import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  SparklesIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@trackfi/ui/components/card"

import { formatShortDateOnly } from "../lib/date"
import type { ExpenseSummary } from "../lib/expenses"
import { displayLabel, formatMoney } from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function ExpenseBudgetPaceCard({
  summary,
  currency,
}: {
  summary: ExpenseSummary
  currency: string
}) {
  const budget = summary.effectiveBudgetMinor
  const progress = budget
    ? Math.min(100, Math.max(0, (summary.spentMinor / budget) * 100))
    : 0
  return (
    <Card className="gap-3 rounded-[10px] border-0 bg-neutral-900 py-[18px] text-white shadow-none">
      <CardHeader className="flex flex-row items-start justify-between px-[18px]">
        <div>
          <CardTitle className="text-sm">{m.expenses_budget_pace()}</CardTitle>
          <p className="mt-1 text-[11px] text-neutral-400">
            {formatShortDateOnly(summary.period.start)}–
            {formatShortDateOnly(summary.period.end)} ·{" "}
            {m.expenses_day_count({
              day: summary.period.elapsedDays,
              total: summary.period.totalDays,
            })}
          </p>
        </div>
        {summary.pace && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-amber-300">
            {summary.pace === "above" ? (
              <ArrowUpRightIcon className="size-3" />
            ) : (
              <ArrowDownRightIcon className="size-3" />
            )}
            {m.expenses_pace_label({ direction: displayLabel(summary.pace) })}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3 px-[18px]">
        {budget === null ? (
          <div className="rounded-lg bg-white/5 p-4 text-sm text-neutral-300">
            {m.expenses_set_monthly_budget()}
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-semibold">
                  {formatMoney(summary.spentMinor, currency)}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {m.expenses_spent_of({
                    budget: formatMoney(budget, currency),
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatMoney(summary.targetToDateMinor ?? 0, currency)}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {m.expenses_target_today()}
                </p>
              </div>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/15"
              role="meter"
              aria-label={m.expenses_budget_used()}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="flex items-center gap-2 text-[11px] text-neutral-300">
              <SparklesIcon className="size-3.5 text-amber-300" />{" "}
              {m.expenses_recommendation({
                amount: formatMoney(
                  summary.recommendedDailyMinor ?? 0,
                  currency
                ),
              })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
