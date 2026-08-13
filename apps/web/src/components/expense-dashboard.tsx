import { PlusIcon, Settings2Icon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"
import { StableLoadingPlaceholder } from "@trackfi/ui/components/stable-loading-placeholder"
import { useStableLoadingState } from "@trackfi/ui/hooks/use-stable-loading-state"

import { useExpenses } from "../hooks/use-expenses"
import { ExpenseDeleteDialog } from "./expense-delete-dialog"
import { ExpenseFilters } from "./expense-filters"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseList } from "./expense-list"
import { ExpenseSettingsDialog } from "./expense-settings-dialog"
import { ExpenseEmptyState, ExpenseLoadingState } from "./expense-states"
import { ExpenseSummary } from "./expense-summary"
import { ModuleError, ModuleHeader } from "./module-layout"
import { m } from "../lib/i18n"

export function ExpenseDashboard({ currency }: { currency: string }) {
  const state = useExpenses()
  const initialError = state.summary.isError || state.settings.isError
  const initialLoading = useStableLoadingState({
    isLoading: state.summary.isLoading || state.settings.isLoading,
    isError: initialError,
  })
  const listLoading = useStableLoadingState({
    isLoading: state.list.isLoading,
    isError: state.list.isError,
  })

  if (initialError) {
    return (
      <ModuleError
        retry={() =>
          void Promise.all([state.summary.refetch(), state.settings.refetch()])
        }
      />
    )
  }
  if (initialLoading.shouldRender) {
    return (
      <StableLoadingPlaceholder isVisible={initialLoading.isVisible}>
        <ExpenseLoadingState />
      </StableLoadingPlaceholder>
    )
  }
  const summary = state.summary.data!.summary
  const expenses = state.list.data?.expenses ?? []
  const hasFilters =
    Boolean(state.search.trim()) ||
    state.category !== "all" ||
    state.status !== "all" ||
    state.period !== "current" ||
    state.pendingOnly ||
    state.missingReceipt
  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title={m.nav_expenses()}
        description={m.module_expenses_description()}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => state.setSettingsOpen(true)}
            >
              <Settings2Icon /> {m.expenses_budget_settings()}
            </Button>
            <Button size="lg" onClick={state.openCreate}>
              <PlusIcon /> {m.expenses_add()}
            </Button>
          </div>
        }
      />
      <ExpenseSummary summary={summary} currency={currency} />
      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{m.expenses_transactions()}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {m.expenses_transactions_description()}
          </p>
        </div>
        <ExpenseFilters
          summary={summary}
          search={state.search}
          period={state.period}
          category={state.category}
          status={state.status}
          pendingOnly={state.pendingOnly}
          missingReceipt={state.missingReceipt}
          onSearchChange={state.setSearch}
          onPeriodChange={state.setPeriod}
          onCategoryChange={state.setCategory}
          onStatusChange={state.setStatus}
          onPendingChange={state.setPendingOnly}
          onMissingReceiptChange={state.setMissingReceipt}
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
            <div
              role="status"
              aria-label={m.expenses_loading_list()}
              className="space-y-2"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-[58px]" />
              ))}
            </div>
          </StableLoadingPlaceholder>
        ) : expenses.length ? (
          <ExpenseList
            expenses={expenses}
            currency={currency}
            page={state.page}
            total={state.list.data?.total ?? expenses.length}
            onPageChange={state.setPage}
            onEdit={state.openEdit}
            onDelete={state.setDeleting}
          />
        ) : (
          <ExpenseEmptyState filtered={hasFilters} onAdd={state.openCreate} />
        )}
      </section>
      <ExpenseFormDialog
        currency={currency}
        expense={state.editing}
        open={state.dialogOpen}
        pending={state.savePending}
        error={state.message}
        onOpenChange={state.closeDialog}
        onOpenChangeComplete={state.finishDialogChange}
        onSubmit={state.save}
      />
      <ExpenseSettingsDialog
        currency={currency}
        settings={state.settings.data!.settings}
        open={state.settingsOpen}
        pending={state.settingsPending}
        error={state.message}
        onOpenChange={state.closeSettings}
        onSave={state.saveSettings}
      />
      <ExpenseDeleteDialog
        expense={state.deleting}
        onOpenChange={(open) => !open && state.setDeleting(null)}
        onConfirm={state.confirmDelete}
      />
    </section>
  )
}
