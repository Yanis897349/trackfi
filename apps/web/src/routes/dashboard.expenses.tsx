import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { ExpenseDashboard } from "../components/expense-dashboard"
import {
  ExpenseCurrencyRequiredState,
  ExpenseLoadingState,
} from "../components/expense-states"
import { ModuleError } from "../components/module-layout"
import { settingsQueryOptions } from "../lib/settings"

export const Route = createFileRoute("/dashboard/expenses")({
  component: ExpensesRoute,
})

function ExpensesRoute() {
  const settings = useQuery(settingsQueryOptions())
  const loading = useStableLoadingState({
    isLoading: settings.isLoading,
    isError: settings.isError,
  })

  if (settings.isError) {
    return <ModuleError retry={() => void settings.refetch()} />
  }
  if (loading.shouldRender) {
    return (
      <StableLoadingPlaceholder isVisible={loading.isVisible}>
        <ExpenseLoadingState />
      </StableLoadingPlaceholder>
    )
  }
  const currency = settings.data?.settings.currency
  if (!currency) return <ExpenseCurrencyRequiredState />
  return <ExpenseDashboard currency={currency} />
}
