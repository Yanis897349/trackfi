import { lazy, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { ModuleError } from "../components/module-layout"
import {
  RevenueCurrencyRequiredState,
  RevenueLoadingState,
} from "../components/revenue-states"
import { settingsQueryOptions } from "../lib/settings"

const RevenueDashboard = lazy(async () => {
  const module = await import("../components/revenue-dashboard")
  return { default: module.RevenueDashboard }
})

export const Route = createFileRoute("/dashboard/revenue")({
  component: RevenueRoute,
})

function RevenueRoute() {
  const settings = useQuery(settingsQueryOptions())
  if (settings.isLoading) return <RevenueLoadingState />
  if (settings.isError) {
    return <ModuleError retry={() => void settings.refetch()} />
  }

  const currency = settings.data?.settings.currency
  if (!currency) return <RevenueCurrencyRequiredState />

  return (
    <Suspense fallback={<RevenueLoadingState />}>
      <RevenueDashboard currency={currency} />
    </Suspense>
  )
}
