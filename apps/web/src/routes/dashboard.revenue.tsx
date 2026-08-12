import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { ModuleError, ModuleHeader } from "../components/module-layout"
import { RevenueDeleteDialog } from "../components/revenue-delete-dialog"
import { RevenueFilters } from "../components/revenue-filters"
import { RevenueFormDialog } from "../components/revenue-form-dialog"
import { RevenueList } from "../components/revenue-list"
import {
  RevenueCurrencyRequiredState,
  RevenueEmptyState,
  RevenueLoadingState,
} from "../components/revenue-states"
import { RevenueSummary } from "../components/revenue-summary"
import { useRevenue } from "../hooks/use-revenue"

export const Route = createFileRoute("/dashboard/revenue")({
  component: RevenueRoute,
})

function RevenueRoute() {
  const state = useRevenue()
  if (state.settings.isLoading || state.summary.isLoading) {
    return <RevenueLoadingState />
  }
  if (state.settings.isError || state.summary.isError) {
    return (
      <ModuleError
        retry={() => {
          void state.settings.refetch()
          void state.summary.refetch()
        }}
      />
    )
  }
  if (!state.currency) return <RevenueCurrencyRequiredState />

  const sources = state.list.data?.revenueSources ?? []
  const hasFilters =
    Boolean(state.search.trim()) ||
    state.status !== "active" ||
    state.category !== "all" ||
    state.scheduleType !== "all"

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title="Revenue"
        description="Forecast take-home income across scheduled and variable sources."
        action={
          <Button size="lg" className="px-4" onClick={state.openCreate}>
            <PlusIcon /> Add revenue source
          </Button>
        }
      />
      <RevenueSummary
        summary={state.summary.data!.summary}
        currency={state.currency}
      />
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
      {state.list.isLoading ? (
        <SkeletonList />
      ) : state.list.isError ? (
        <ModuleError retry={() => void state.list.refetch()} />
      ) : sources.length ? (
        <RevenueList
          sources={sources}
          currency={state.currency}
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
      <RevenueFormDialog
        currency={state.currency}
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
      aria-label="Loading revenue sources"
      aria-busy="true"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-[72px]" />
      ))}
    </div>
  )
}
