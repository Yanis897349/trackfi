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
  revenueCategoryFilterOptions,
  revenueScheduleOptions,
  revenueStatusOptions,
  type RevenueCategory,
  type RevenueFilter,
  type RevenueScheduleType,
} from "../lib/revenue"

export function RevenueFilters({
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
  category: RevenueCategory | "all"
  scheduleType: RevenueScheduleType | "all"
  status: RevenueFilter
  onSearchChange(value: string): void
  onCategoryChange(value: RevenueCategory | "all"): void
  onScheduleTypeChange(value: RevenueScheduleType | "all"): void
  onStatusChange(value: RevenueFilter): void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative flex-1">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pr-3 pl-[38px]"
          placeholder="Search revenue sources..."
          aria-label="Search revenue sources"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <FilterSelect
          label="Category filter"
          items={revenueCategoryFilterOptions}
          value={category}
          onChange={(value) =>
            onCategoryChange(value as RevenueCategory | "all")
          }
        />
        <FilterSelect
          label="Income type filter"
          items={revenueScheduleOptions}
          value={scheduleType}
          onChange={(value) =>
            onScheduleTypeChange(value as RevenueScheduleType | "all")
          }
        />
        <FilterSelect
          label="Status filter"
          items={revenueStatusOptions}
          value={status}
          className="col-span-2 sm:col-span-1"
          onChange={(value) => onStatusChange(value as RevenueFilter)}
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
