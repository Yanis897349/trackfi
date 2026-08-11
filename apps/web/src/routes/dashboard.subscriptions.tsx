import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"

import {
  ModuleError,
  ModuleHeader,
  ModuleLoading,
} from "../components/module-layout"
import { SubscriptionDeleteDialog } from "../components/subscription-delete-dialog"
import { SubscriptionFilters } from "../components/subscription-filters"
import { SubscriptionFormSheet } from "../components/subscription-form-sheet"
import { SubscriptionList } from "../components/subscription-list"
import {
  CurrencyRequiredState,
  SubscriptionEmptyState,
} from "../components/subscription-states"
import { SubscriptionSummary } from "../components/subscription-summary"
import { useSubscriptions } from "../hooks/use-subscriptions"

export const Route = createFileRoute("/dashboard/subscriptions")({
  component: SubscriptionsRoute,
})

function SubscriptionsRoute() {
  const state = useSubscriptions()

  if (state.settings.isLoading || state.summary.isLoading) {
    return <ModuleLoading label="Loading subscriptions" />
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
  if (!state.currency) return <CurrencyRequiredState />

  const subscriptions = state.list.data?.subscriptions ?? []
  const hasFilters =
    Boolean(state.search.trim()) ||
    state.status !== "current" ||
    state.category !== "all"

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <ModuleHeader
        title="Subscriptions"
        description="Track recurring services, costs, and renewal dates."
        action={
          <Button onClick={state.openCreate}>
            <PlusIcon /> Add subscription
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
        category={state.category}
        onSearchChange={state.setSearch}
        onStatusChange={state.setStatus}
        onCategoryChange={state.setCategory}
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
        <ModuleLoading label="Loading services" />
      ) : state.list.isError ? (
        <ModuleError retry={() => void state.list.refetch()} />
      ) : subscriptions.length ? (
        <SubscriptionList
          subscriptions={subscriptions}
          currency={state.currency}
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
      {state.sheetOpen && (
        <SubscriptionFormSheet
          currency={state.currency}
          subscription={state.editing}
          open
          pending={state.savePending}
          error={state.message}
          onOpenChange={state.closeSheet}
          onSubmit={state.save}
        />
      )}
      <SubscriptionDeleteDialog
        subscription={state.deleting}
        onOpenChange={(open) => !open && state.setDeleting(null)}
        onConfirm={state.confirmDelete}
      />
    </section>
  )
}
