import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  FileQuestionIcon,
  SearchIcon,
} from "lucide-react"

import { Input } from "@trackfi/ui/components/input"

import { expensePeriodOptions } from "../lib/expense-periods"
import {
  expenseCategoryOptions,
  expenseStatusOptions,
  type ExpenseCategory,
  type ExpenseStatus,
  type ExpenseSummary,
} from "../lib/expenses"
import {
  ExpenseFilterSelect,
  ExpenseQuickFilter,
} from "./expense-filter-controls"
import { m } from "../lib/i18n"

export function ExpenseFilters({
  summary,
  search,
  period,
  category,
  status,
  pendingOnly,
  missingReceipt,
  onSearchChange,
  onPeriodChange,
  onCategoryChange,
  onStatusChange,
  onPendingChange,
  onMissingReceiptChange,
}: {
  summary: ExpenseSummary
  search: string
  period: string
  category: ExpenseCategory | "all"
  status: ExpenseStatus | "all"
  pendingOnly: boolean
  missingReceipt: boolean
  onSearchChange(value: string): void
  onPeriodChange(value: string): void
  onCategoryChange(value: ExpenseCategory | "all"): void
  onStatusChange(value: ExpenseStatus | "all"): void
  onPendingChange(value: boolean): void
  onMissingReceiptChange(value: boolean): void
}) {
  const periods = expensePeriodOptions(summary)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:grid-cols-[minmax(260px,1fr)_170px_160px_145px]">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder={m.expenses_search()}
            aria-label={m.expenses_search_label()}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <ExpenseFilterSelect
          icon={CalendarDaysIcon}
          label={m.expenses_date_filter()}
          value={period}
          items={periods}
          onChange={onPeriodChange}
        />
        <ExpenseFilterSelect
          label={m.expenses_category_filter()}
          value={category}
          items={[
            { value: "all", label: m.subscriptions_all_categories() },
            ...expenseCategoryOptions,
          ]}
          onChange={(value) =>
            onCategoryChange(value as ExpenseCategory | "all")
          }
        />
        <ExpenseFilterSelect
          label={m.expenses_status_filter()}
          value={status}
          items={[
            { value: "all", label: m.expenses_all_statuses() },
            ...expenseStatusOptions,
          ]}
          onChange={(value) => onStatusChange(value as ExpenseStatus | "all")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          {m.expenses_quick_filters()}
        </span>
        <ExpenseQuickFilter
          pressed={pendingOnly}
          onClick={() => onPendingChange(!pendingOnly)}
          icon={CheckCircle2Icon}
          label={m.expenses_needs_review({ count: summary.pendingCount })}
        />
        <ExpenseQuickFilter
          pressed={missingReceipt}
          onClick={() => onMissingReceiptChange(!missingReceipt)}
          icon={FileQuestionIcon}
          label={`${m.expenses_missing_receipt()} ${summary.missingReceiptCount}`}
        />
      </div>
    </div>
  )
}
