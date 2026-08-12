import { CalendarDaysIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import {
  type RevenueForecastMonths,
  type RevenueSummary as Summary,
} from "../lib/revenue"
import { RevenueContributionCard } from "./revenue-contribution-card"
import { RevenueForecastCard } from "./revenue-forecast-card"
import { RevenueUpcomingIncomeCard } from "./revenue-upcoming-income-card"
import { m } from "../lib/i18n"

const forecastRangeOptions = [3, 6, 12] as const

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
      <div className="flex justify-end">
        <Select
          items={forecastRangeOptions.map((value) => ({
            value: String(value),
            label: m.revenue_next_months({ count: value }),
          }))}
          value={String(months)}
          onValueChange={(value) =>
            value && onMonthsChange(Number(value) as RevenueForecastMonths)
          }
        >
          <SelectTrigger
            aria-label={m.revenue_forecast_range()}
            className="h-8 w-full gap-2 bg-card px-2.5 text-xs sm:w-auto"
            disabled={fetching}
          >
            <CalendarDaysIcon className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {forecastRangeOptions.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {m.revenue_next_months({ count: value })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <RevenueForecastCard summary={summary} currency={currency} />
        <RevenueContributionCard summary={summary} currency={currency} />
      </div>

      <RevenueUpcomingIncomeCard summary={summary} currency={currency} />
    </section>
  )
}
