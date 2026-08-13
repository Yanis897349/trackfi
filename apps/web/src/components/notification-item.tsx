import { formatDistanceToNow } from "date-fns"
import { CheckIcon, GaugeIcon, TriangleAlertIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Button } from "@trackfi/ui/components/button"
import { cn } from "@trackfi/ui/lib/utils"

import { dateFnsLocale, intlLocale, m } from "../lib/i18n"
import type { Notification } from "../lib/notifications"

export function NotificationItem({
  notification,
  variant,
  onOpen,
  onMarkRead,
}: {
  notification: Notification
  variant: "history" | "inbox"
  onOpen(notification: Notification): void
  onMarkRead(notification: Notification): void
}) {
  const unread = !notification.readAt
  const approaching = notification.type === "expense_budget_approaching"
  const Icon = approaching ? GaugeIcon : TriangleAlertIcon

  return (
    <div
      className={cn(
        "group flex min-w-0 gap-3 border-b last:border-b-0",
        variant === "inbox"
          ? "items-start px-5 py-[13px]"
          : "items-center px-4 py-2.5",
        unread ? "bg-amber-50/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          approaching
            ? "bg-yellow-100 text-yellow-950"
            : "bg-red-100 text-red-900"
        )}
      >
        <Icon className="size-[17px]" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="min-w-0 flex-1 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onOpen(notification)}
      >
        <span className="flex min-w-0 items-center gap-[7px]">
          {unread && (
            <span
              className="size-[7px] shrink-0 rounded-full bg-yellow-400"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              "truncate text-[13px]",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {notification.title}
          </span>
          {variant === "history" && unread && (
            <Badge className="h-auto bg-yellow-200 px-1.5 py-0.5 text-[8px] leading-none font-bold text-yellow-950 uppercase">
              {m.notifications_new()}
            </Badge>
          )}
        </span>
        <span
          className={cn(
            "mt-[3px] block truncate text-muted-foreground",
            variant === "history" ? "text-[11px]" : "text-xs"
          )}
        >
          {notification.description}
        </span>
        {variant === "inbox" && (
          <span className="mt-1 block text-[10px] text-muted-foreground/70">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: dateFnsLocale(),
            })}
          </span>
        )}
      </button>
      {variant === "history" && (
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <Badge
            variant="secondary"
            className="h-auto w-24 justify-center px-2 py-[5px] text-[10px] leading-none font-semibold"
          >
            {m.notifications_budget_type()}
          </Badge>
          <time
            className="w-[60px] text-right text-[10px] font-medium text-muted-foreground"
            dateTime={notification.createdAt}
          >
            {new Intl.DateTimeFormat(intlLocale(), {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(notification.createdAt))}
          </time>
        </div>
      )}
      {unread ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onMarkRead(notification)}
          aria-label={m.notifications_mark_read()}
          className="shrink-0 text-muted-foreground"
        >
          <CheckIcon />
        </Button>
      ) : variant === "history" ? (
        <span className="size-7 shrink-0" aria-hidden="true" />
      ) : null}
    </div>
  )
}
