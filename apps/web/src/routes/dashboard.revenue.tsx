import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { ModuleError } from "../components/module-layout"
import { RevenueDashboard } from "../components/revenue-dashboard"
import {
  RevenueCurrencyRequiredState,
  RevenueLoadingState,
} from "../components/revenue-states"
import { settingsQueryOptions } from "../lib/settings"

export const Route = createFileRoute("/dashboard/revenue")({
  component: RevenueRoute,
})

function RevenueRoute() {
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
        <RevenueLoadingState />
      </StableLoadingPlaceholder>
    )
  }

  const currency = settings.data?.settings.currency
  if (!currency) return <RevenueCurrencyRequiredState />

  return <RevenueDashboard currency={currency} />
}
