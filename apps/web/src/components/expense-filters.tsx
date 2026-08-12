import { SearchIcon } from "lucide-react"

import { Input } from "@trackfi/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trackfi/ui/components/select"

import {
  expenseCategoryFilterOptions,
  expenseScheduleOptions,
  expenseStatusOptions,
  type ExpenseCategory,
  type ExpenseFilter,
  type ExpenseScheduleType,
} from "../lib/expenses"

export function ExpenseFilters({
  search,
  category,
  scheduleType,
  status,
  onSearchChange,
  onCategoryChange,
  onScheduleTypeChange,
  onStatusChange,
}: {
  search: string
  category: ExpenseCategory | "all"
  scheduleType: ExpenseScheduleType | "all"
  status: ExpenseFilter
  onSearchChange(value: string): void
  onCategoryChange(value: ExpenseCategory | "all"): void
  onScheduleTypeChange(value: ExpenseScheduleType | "all"): void
  onStatusChange(value: ExpenseFilter): void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative flex-1">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pr-3 pl-[38px]"
          placeholder="Search expenses..."
          aria-label="Search expenses"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <FilterSelect
          label="Category filter"
          items={expenseCategoryFilterOptions}
          value={category}
          onChange={(value) =>
            onCategoryChange(value as ExpenseCategory | "all")
          }
        />
        <FilterSelect
          label="Expense type filter"
          items={expenseScheduleOptions}
          value={scheduleType}
          onChange={(value) =>
            onScheduleTypeChange(value as ExpenseScheduleType | "all")
          }
        />
        <FilterSelect
          label="Status filter"
          items={expenseStatusOptions}
          value={status}
          className="col-span-2 sm:col-span-1"
          onChange={(value) => onStatusChange(value as ExpenseFilter)}
        />
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  items,
  value,
  className,
  onChange,
}: {
  label: string
  items: ReadonlyArray<{ value: string; label: string }>
  value: string
  className?: string
  onChange(value: string): void
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => next && onChange(next)}
    >
      <SelectTrigger
        className={`h-10 w-full px-3 data-[size=default]:h-10 lg:w-[150px] ${className ?? ""}`}
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
