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
  displayLabel,
  subscriptionCategories,
  type SubscriptionCategory,
  type SubscriptionFilter,
} from "../lib/subscriptions"

export function SubscriptionFilters({
  search,
  status,
  category,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
}: {
  search: string
  status: SubscriptionFilter
  category: SubscriptionCategory | "all"
  onSearchChange(value: string): void
  onStatusChange(value: SubscriptionFilter): void
  onCategoryChange(value: SubscriptionCategory | "all"): void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search subscriptions"
          aria-label="Search subscriptions"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <Select
        value={status}
        onValueChange={(value) => value && onStatusChange(value)}
      >
        <SelectTrigger className="w-full sm:w-36" aria-label="Status filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["current", "active", "paused", "archived", "all"] as const).map(
            (option) => (
              <SelectItem key={option} value={option}>
                {displayLabel(option)}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
      <Select
        value={category}
        onValueChange={(value) => value && onCategoryChange(value)}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Category filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {subscriptionCategories.map((option) => (
            <SelectItem key={option} value={option}>
              {displayLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
