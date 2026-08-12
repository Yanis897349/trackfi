import { PlusIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import { Skeleton } from "@trackfi/ui/components/skeleton"

import { useExpenses } from "../hooks/use-expenses"
import { ExpenseDeleteDialog } from "./expense-delete-dialog"
import { ExpenseFilters } from "./expense-filters"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseList } from "./expense-list"
import { ExpenseEmptyState, ExpenseLoadingState } from "./expense-states"
import { ExpenseSummary } from "./expense-summary"
import { ModuleError, ModuleHeader } from "./module-layout"

export function ExpenseDashboard({ currency }: { currency: string }) {
  const state = useExpenses()
  if (state.summary.isLoading) return <ExpenseLoadingState />
  if (state.summary.isError) {
    return <ModuleError retry={() => void state.summary.refetch()} />
  }
  const expenses = state.list.data?.expenses ?? []
  const hasFilters =
    Boolean(state.search.trim()) ||
    state.status !== "active" ||
    state.category !== "all" ||
    state.scheduleType !== "all"
  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <ModuleHeader
        title="Expenses"
        description="Plan outgoing costs and understand what’s coming next."
        action={
          <Button size="lg" className="px-4" onClick={state.openCreate}>
            <PlusIcon /> Add expense
          </Button>
        }
      />
      <ExpenseSummary
        summary={state.summary.data!.summary}
        currency={currency}
        months={state.forecastMonths}
        fetching={state.summary.isFetching}
        onMonthsChange={state.setForecastMonths}
      />
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Planned expenses</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Manage recurring costs, one-time plans, and flexible monthly
            estimates.
          </p>
        </div>
        <ExpenseFilters
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
          <div
            role="status"
            aria-label="Loading expense list"
            className="space-y-3"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[72px]" />
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
            onStatus={state.updateStatus}
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
      <ExpenseDeleteDialog
        expense={state.deleting}
        onOpenChange={(open) => !open && state.setDeleting(null)}
        onConfirm={state.confirmDelete}
      />
    </section>
  )
}
