import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { useRevenue } from "../hooks/use-revenue"
import { ModuleError, ModuleHeader } from "./module-layout"
import { RevenueDeleteDialog } from "./revenue-delete-dialog"
import { RevenueFilters } from "./revenue-filters"
import { RevenueFormDialog } from "./revenue-form-dialog"
import { RevenueList } from "./revenue-list"
import { RevenueEmptyState, RevenueLoadingState } from "./revenue-states"
import { RevenueSummary } from "./revenue-summary"
import { m } from "../lib/i18n"

export function RevenueDashboard({ currency }: { currency: string }) {
  const state = useRevenue(currency)
  const summaryLoading = useStableLoadingState({
    isLoading: state.summary.isLoading,
    isError: state.summary.isError,
  })
  const listLoading = useStableLoadingState({
    isLoading: state.list.isLoading,
    isError: state.list.isError,
  })

  if (state.summary.isError) {
    return <ModuleError retry={() => void state.summary.refetch()} />
  }
  if (summaryLoading.shouldRender) {
    return (
      <StableLoadingPlaceholder isVisible={summaryLoading.isVisible}>
        <RevenueLoadingState />
      </StableLoadingPlaceholder>
    )
  }

  const sources = state.list.data?.revenueSources ?? []
  const hasFilters =
    Boolean(state.search.trim()) ||
    state.status !== "active" ||
    state.category !== "all" ||
    state.scheduleType !== "all"

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title={m.nav_revenue()}
        description={m.module_revenue_description()}
        action={
          <Button size="lg" className="px-4" onClick={state.openCreate}>
            <PlusIcon /> {m.revenue_add()}
          </Button>
        }
      />
      <RevenueSummary
        summary={state.summary.data!.summary}
        currency={currency}
        months={state.forecastMonths}
        fetching={state.summary.isFetching}
        onMonthsChange={state.setForecastMonths}
      />
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{m.revenue_sources()}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {m.revenue_sources_description()}
          </p>
        </div>
        <RevenueFilters
          search={state.search}
          category={state.category}
          scheduleType={state.scheduleType}
          status={state.status}
          onSearchChange={state.setSearch}
          onCategoryChange={state.setCategory}
          onScheduleTypeChange={state.setScheduleType}
          onStatusChange={state.setStatus}
        />
        {state.message && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {state.message}
          </p>
        )}
        {state.list.isError ? (
          <ModuleError retry={() => void state.list.refetch()} />
        ) : listLoading.shouldRender ? (
          <StableLoadingPlaceholder isVisible={listLoading.isVisible}>
            <SkeletonList />
          </StableLoadingPlaceholder>
        ) : sources.length ? (
          <RevenueList
            sources={sources}
            currency={currency}
            page={state.page}
            total={state.list.data?.total ?? sources.length}
            onPageChange={state.setPage}
            onEdit={state.openEdit}
            onStatus={state.updateStatus}
            onDelete={state.setDeleting}
          />
        ) : (
          <RevenueEmptyState filtered={hasFilters} onAdd={state.openCreate} />
        )}
      </section>
      <RevenueFormDialog
        currency={currency}
        source={state.editing}
        open={state.dialogOpen}
        pending={state.savePending}
        error={state.message}
        onOpenChange={state.closeDialog}
        onOpenChangeComplete={state.finishDialogChange}
        onSubmit={state.save}
      />
      <RevenueDeleteDialog
        source={state.deleting}
        onOpenChange={(open) => !open && state.setDeleting(null)}
        onConfirm={state.confirmDelete}
      />
    </section>
  )
}

function SkeletonList() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label={m.revenue_loading_sources()}
      aria-busy="true"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-[72px]" />
      ))}
    </div>
  )
}
