import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import {
  DashboardOverview,
  DashboardOverviewLoading,
} from "../components/dashboard-overview"
import { ModuleError } from "../components/module-layout"
import { dashboardOverviewQueryOptions } from "../lib/dashboard"
import { currentMonthDateOnlyRange, isDateOnlyRange } from "../lib/date"

export const Route = createFileRoute("/dashboard/")({
  validateSearch: z.object({
    from: z.string().optional().catch(undefined),
    to: z.string().optional().catch(undefined),
    page: z.coerce.number().int().positive().catch(1).default(1),
  }),
  component: DashboardHome,
})

function DashboardHome() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const fallback = currentMonthDateOnlyRange()
  const range = isDateOnlyRange(search.from, search.to, 365)
    ? { from: search.from!, to: search.to! }
    : fallback
  const query = useQuery(
    dashboardOverviewQueryOptions({ ...range, page: search.page })
  )
  const loading = useStableLoadingState({
    isLoading: query.isLoading,
    isError: query.isError,
  })

  if (query.isError) {
    return <ModuleError retry={() => void query.refetch()} />
  }
  if (loading.shouldRender || !query.data) {
    return (
      <StableLoadingPlaceholder isVisible={loading.isVisible}>
        <DashboardOverviewLoading />
      </StableLoadingPlaceholder>
    )
  }

  return (
    <DashboardOverview
      overview={query.data.overview}
      isFetching={query.isFetching}
      onRangeChange={({ from, to }) =>
        void navigate({ search: { from, to, page: 1 } })
      }
      onPageChange={(page) =>
        void navigate({ search: { ...range, page }, replace: true })
      }
    />
  )
}
