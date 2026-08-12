import { PlusIcon, Settings2Icon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { useExpenses } from "../hooks/use-expenses"
import { ExpenseDeleteDialog } from "./expense-delete-dialog"
import { ExpenseFilters } from "./expense-filters"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseList } from "./expense-list"
import { ExpenseSettingsDialog } from "./expense-settings-dialog"
import { ExpenseEmptyState, ExpenseLoadingState } from "./expense-states"
import { ExpenseSummary } from "./expense-summary"
import { ModuleError, ModuleHeader } from "./module-layout"

export function ExpenseDashboard({ currency }: { currency: string }) {
  const state = useExpenses()
  if (state.summary.isLoading || state.settings.isLoading)
    return <ExpenseLoadingState />
  if (state.summary.isError || state.settings.isError) {
    return (
      <ModuleError
        retry={() =>
          void Promise.all([state.summary.refetch(), state.settings.refetch()])
        }
      />
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
        title="Expenses"
        description="Understand where money goes and keep spending on track."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => state.setSettingsOpen(true)}
            >
              <Settings2Icon /> Budget settings
            </Button>
            <Button size="lg" onClick={state.openCreate}>
              <PlusIcon /> Add expense
            </Button>
          </div>
        }
      />
      <ExpenseSummary summary={summary} currency={currency} />
      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Transactions</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Review, categorize, and resolve spending activity.
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
        {state.list.isLoading ? (
          <div
            role="status"
            aria-label="Loading expense list"
            className="space-y-2"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-[58px]" />
            ))}
          </div>
        ) : state.list.isError ? (
          <ModuleError retry={() => void state.list.refetch()} />
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
