import { BanknoteIcon, CreditCardIcon, ReceiptTextIcon } from "lucide-react"

import { formatMoney } from "../lib/currency"
import type { DashboardOverview } from "../lib/dashboard"
import { m } from "../lib/i18n"
import { DashboardModuleCard } from "./dashboard-module-card"

export function DashboardMoneyModules({
  overview,
  currency,
}: {
  overview: DashboardOverview
  currency: string
}) {
  const expenses = overview.modules.expenses
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{m.dashboard_money_modules()}</h3>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {m.dashboard_open_module_hint()}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <DashboardModuleCard
          module="subscriptions"
          icon={<CreditCardIcon />}
          href="/dashboard/subscriptions"
          kicker={m.dashboard_subscription_commitment()}
          value={formatMoney(
            overview.modules.subscriptions.totalMinor,
            currency
          )}
          note={m.dashboard_subscription_note({
            active: overview.modules.subscriptions.activeCount,
            occurrences: overview.modules.subscriptions.occurrenceCount,
          })}
          series={overview.modules.subscriptions.series}
          accent="dark"
          currency={currency}
        />
        <DashboardModuleCard
          module="expenses"
          icon={<ReceiptTextIcon />}
          href="/dashboard/expenses"
          kicker={m.dashboard_expenses_range()}
          value={formatMoney(expenses.totalMinor, currency)}
          note={expenseNote(overview, currency)}
          series={expenses.series}
          accent="orange"
          currency={currency}
        />
        <DashboardModuleCard
          module="revenue"
          icon={<BanknoteIcon />}
          href="/dashboard/revenue"
          kicker={m.dashboard_revenue_range()}
          value={formatMoney(overview.modules.revenue.totalMinor, currency)}
          note={m.dashboard_revenue_note({
            sources: overview.modules.revenue.activeCount,
            percentage: overview.modules.revenue.scheduledPercent,
          })}
          series={overview.modules.revenue.series}
          accent="green"
          currency={currency}
        />
      </div>
    </section>
  )
}

function expenseNote(overview: DashboardOverview, currency: string) {
  const expenses = overview.modules.expenses
  return expenses.monthlyBudgetMinor
    ? m.dashboard_expense_budget_note({
        percentage: Math.round(
          (expenses.totalMinor / expenses.monthlyBudgetMinor) * 100
        ),
        budget: formatMoney(expenses.monthlyBudgetMinor, currency),
      })
    : m.dashboard_expense_note({
        count: expenses.transactionCount,
        pending: expenses.pendingCount,
      })
}
