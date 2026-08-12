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
import { m } from "../lib/i18n"

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
        <span className="sr-only">
          {m.common_actions_for({ name: subscription.name })}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(subscription)}>
          <PencilIcon /> {m.common_edit()}
        </DropdownMenuItem>
        {subscription.status === "active" && (
          <DropdownMenuItem onClick={() => onStatus(subscription, "paused")}>
            <PauseIcon /> {m.common_pause()}
          </DropdownMenuItem>
        )}
        {subscription.status === "paused" && (
          <DropdownMenuItem onClick={() => onStatus(subscription, "active")}>
            <PlayIcon /> {m.common_resume()}
          </DropdownMenuItem>
        )}
        {subscription.status === "archived" ? (
          <DropdownMenuItem onClick={() => onStatus(subscription, "active")}>
            <RotateCcwIcon /> {m.common_restore()}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onStatus(subscription, "archived")}>
            <ArchiveIcon /> {m.common_archive()}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(subscription)}
        >
          <Trash2Icon /> {m.common_delete()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
