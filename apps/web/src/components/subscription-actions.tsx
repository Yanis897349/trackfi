import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@trackfi/ui/components/dropdown-menu"

import type { Subscription, SubscriptionStatus } from "../lib/subscriptions"

export function SubscriptionActions({
  subscription,
  onEdit,
  onStatus,
  onDelete,
}: {
  subscription: Subscription
  onEdit(subscription: Subscription): void
  onStatus(subscription: Subscription, status: SubscriptionStatus): void
  onDelete(subscription: Subscription): void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <MoreHorizontalIcon />
        <span className="sr-only">Actions for {subscription.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(subscription)}>
          <PencilIcon /> Edit
        </DropdownMenuItem>
        {subscription.status === "active" && (
          <DropdownMenuItem onClick={() => onStatus(subscription, "paused")}>
            <PauseIcon /> Pause
          </DropdownMenuItem>
        )}
        {subscription.status === "paused" && (
          <DropdownMenuItem onClick={() => onStatus(subscription, "active")}>
            <PlayIcon /> Resume
          </DropdownMenuItem>
        )}
        {subscription.status === "archived" ? (
          <DropdownMenuItem onClick={() => onStatus(subscription, "active")}>
            <RotateCcwIcon /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onStatus(subscription, "archived")}>
            <ArchiveIcon /> Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(subscription)}
        >
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
