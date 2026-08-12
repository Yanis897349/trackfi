import { lazy, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import {
  ExpenseCurrencyRequiredState,
  ExpenseLoadingState,
} from "../components/expense-states"
import { ModuleError } from "../components/module-layout"
import { settingsQueryOptions } from "../lib/settings"

const ExpenseDashboard = lazy(async () => {
  const module = await import("../components/expense-dashboard")
  return { default: module.ExpenseDashboard }
})

export const Route = createFileRoute("/dashboard/expenses")({
  component: ExpensesRoute,
})

function ExpensesRoute() {
  const settings = useQuery(settingsQueryOptions())
  if (settings.isLoading) return <ExpenseLoadingState />
  if (settings.isError) {
    return <ModuleError retry={() => void settings.refetch()} />
  }
  const currency = settings.data?.settings.currency
  if (!currency) return <ExpenseCurrencyRequiredState />
  return (
    <Suspense fallback={<ExpenseLoadingState />}>
      <ExpenseDashboard currency={currency} />
    </Suspense>
  )
}
