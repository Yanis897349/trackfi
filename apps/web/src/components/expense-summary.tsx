import { CalendarDaysIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import {
  type ExpenseForecastMonths,
  type ExpenseSummary as Summary,
} from "../lib/expenses"
import { ExpenseCategoryCard } from "./expense-category-card"
import { ExpenseForecastCard } from "./expense-forecast-card"
import { ExpenseUpcomingCard } from "./expense-upcoming-card"

const forecastRangeOptions = [3, 6, 12] as const

export function ExpenseSummary({
  summary,
  currency,
  months,
  fetching,
  onMonthsChange,
}: {
  summary: Summary
  currency: string
  months: ExpenseForecastMonths
  fetching: boolean
  onMonthsChange(months: ExpenseForecastMonths): void
}) {
  return (
    <section className="space-y-4" aria-busy={fetching}>
      <div className="flex justify-end">
        <Select
          items={forecastRangeOptions.map((value) => ({
            value: String(value),
            label: `Next ${value} months`,
          }))}
          value={String(months)}
          onValueChange={(value) =>
            value && onMonthsChange(Number(value) as ExpenseForecastMonths)
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
        <ExpenseForecastCard summary={summary} currency={currency} />
        <ExpenseCategoryCard summary={summary} currency={currency} />
      </div>
      <ExpenseUpcomingCard summary={summary} currency={currency} />
    </section>
  )
}
