import type { ExpenseSummary as Summary } from "../lib/expenses"
import { ExpenseBudgetPaceCard } from "./expense-budget-pace-card"
import { ExpenseCategoryAllocationCard } from "./expense-category-allocation-card"
import { ExpenseMetricCards } from "./expense-metric-cards"

export function ExpenseSummary({
  summary,
  currency,
}: {
  summary: Summary
  currency: string
}) {
  return (
    <section className="space-y-3">
      <ExpenseMetricCards summary={summary} currency={currency} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
        <ExpenseBudgetPaceCard summary={summary} currency={currency} />
        <ExpenseCategoryAllocationCard summary={summary} currency={currency} />
      </div>
    </section>
  )
}
