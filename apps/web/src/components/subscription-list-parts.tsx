import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Button } from "@trackfi/ui/components/button"

import {
  displayLabel,
  type Subscription,
  type SubscriptionStatus,
} from "../lib/subscriptions"

export interface SubscriptionListActions {
  onEdit(subscription: Subscription): void
  onStatus(subscription: Subscription, status: SubscriptionStatus): void
  onDelete(subscription: Subscription): void
}

export function SubscriptionPagination({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: {
  hasPrevious: boolean
  hasNext: boolean
  onPrevious(): void
  onNext(): void
}) {
  return (
    <div className="flex gap-1.5">
      <Button
        variant="outline"
        size="icon"
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        <ChevronLeftIcon />
        <span className="sr-only">Previous page</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={!hasNext}
        onClick={onNext}
      >
        <ChevronRightIcon />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus
}) {
  return (
    <Badge
      variant={status === "active" ? "secondary" : "outline"}
      className="h-auto gap-1.5 px-[9px] py-[5px] leading-none"
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {displayLabel(status)}
    </Badge>
  )
}
