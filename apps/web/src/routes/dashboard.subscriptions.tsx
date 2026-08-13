import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { ModuleError, ModuleHeader } from "../components/module-layout"
import { SubscriptionDeleteDialog } from "../components/subscription-delete-dialog"
import { SubscriptionFilters } from "../components/subscription-filters"
import { SubscriptionFormDialog } from "../components/subscription-form-dialog"
import { SubscriptionList } from "../components/subscription-list"
import { SubscriptionListSkeleton } from "../components/subscription-list-skeleton"
import {
  CurrencyRequiredState,
  SubscriptionEmptyState,
} from "../components/subscription-states"
import { SubscriptionSummary } from "../components/subscription-summary"
import { SubscriptionsLoadingState } from "../components/subscriptions-loading-state"
import { useSubscriptions } from "../hooks/use-subscriptions"
import { m } from "../lib/i18n"

export const Route = createFileRoute("/dashboard/subscriptions")({
  component: SubscriptionsRoute,
})

function SubscriptionsRoute() {
  const state = useSubscriptions()
  const initialError = state.settings.isError || state.summary.isError
  const initialLoading = useStableLoadingState({
    isLoading: state.settings.isLoading || state.summary.isLoading,
    isError: initialError,
  })
  const listLoading = useStableLoadingState({
    isLoading: state.list.isLoading,
    isError: state.list.isError,
  })

  if (initialError) {
    return (
      <ModuleError
        retry={() => {
          void state.settings.refetch()
          void state.summary.refetch()
        }}
      />
    )
  }
  if (initialLoading.shouldRender) {
    return (
      <StableLoadingPlaceholder isVisible={initialLoading.isVisible}>
        <SubscriptionsLoadingState />
      </StableLoadingPlaceholder>
    )
  }
  if (!state.currency) return <CurrencyRequiredState />

  const subscriptions = state.list.data?.subscriptions ?? []
  const hasFilters =
    Boolean(state.search.trim()) ||
    state.status !== "active" ||
    state.cadence !== "all"

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title={m.nav_subscriptions()}
        description={m.module_subscriptions_description()}
        action={
          <Button size="lg" className="px-4" onClick={state.openCreate}>
            <PlusIcon /> {m.subscriptions_add()}
          </Button>
        }
      />
      <SubscriptionSummary
        summary={state.summary.data!.summary}
        currency={state.currency}
      />
      <SubscriptionFilters
        search={state.search}
        status={state.status}
        cadence={state.cadence}
        onSearchChange={state.setSearch}
        onStatusChange={state.setStatus}
        onCadenceChange={state.setCadence}
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
          <SubscriptionListSkeleton />
        </StableLoadingPlaceholder>
      ) : subscriptions.length ? (
        <SubscriptionList
          subscriptions={subscriptions}
          currency={state.currency}
          page={state.page}
          total={state.list.data?.total ?? subscriptions.length}
          onPageChange={state.setPage}
          onEdit={state.openEdit}
          onStatus={state.updateStatus}
          onDelete={state.setDeleting}
        />
      ) : (
        <SubscriptionEmptyState
          filtered={hasFilters}
          onAdd={state.openCreate}
        />
      )}
      <SubscriptionFormDialog
        currency={state.currency}
        subscription={state.editing}
        open={state.dialogOpen}
        pending={state.savePending}
        error={state.message}
        onOpenChange={state.closeDialog}
        onOpenChangeComplete={state.finishDialogChange}
        onSubmit={state.save}
      />
      <SubscriptionDeleteDialog
        subscription={state.deleting}
        onOpenChange={(open) => !open && state.setDeleting(null)}
        onConfirm={state.confirmDelete}
      />
    </section>
  )
}
