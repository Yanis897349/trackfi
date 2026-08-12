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
  subscriptionCadenceFilterOptions,
  subscriptionFilterOptions,
  type SubscriptionCadence,
  type SubscriptionFilter,
} from "../lib/subscriptions"
import { m } from "../lib/i18n"

export function SubscriptionFilters({
  search,
  status,
  cadence,
  onSearchChange,
  onStatusChange,
  onCadenceChange,
}: {
  search: string
  status: SubscriptionFilter
  cadence: SubscriptionCadence | "all"
  onSearchChange(value: string): void
  onStatusChange(value: SubscriptionFilter): void
  onCadenceChange(value: SubscriptionCadence | "all"): void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pr-3 pl-[38px]"
          placeholder={m.subscriptions_search()}
          aria-label={m.subscriptions_search()}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Select
          items={subscriptionCadenceFilterOptions}
          value={cadence}
          onValueChange={(value) => value && onCadenceChange(value)}
        >
          <SelectTrigger
            className="h-10 flex-1 px-3 data-[size=default]:h-10 sm:w-[150px] sm:flex-none"
            aria-label={m.subscriptions_cycle_filter()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subscriptionCadenceFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={subscriptionFilterOptions}
          value={status}
          onValueChange={(value) => value && onStatusChange(value)}
        >
          <SelectTrigger
            className="h-10 flex-1 px-3 data-[size=default]:h-10 sm:w-[150px] sm:flex-none"
            aria-label={m.subscriptions_status_filter()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subscriptionFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
