import { formatDistanceToNow } from "date-fns"
import { CheckIcon, GaugeIcon, TriangleAlertIcon } from "lucide-react"

import { Badge } from "@trackfi/ui/components/badge"
import { Button } from "@trackfi/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@trackfi/ui/components/empty"
import { Skeleton } from "@trackfi/ui/components/skeleton"
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
        "group flex min-w-0 items-start gap-3 border-b px-4 last:border-b-0",
        variant === "inbox" ? "py-3" : "py-2.5",
        unread ? "bg-amber-50/70" : "bg-background"
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
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="min-w-0 flex-1 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onOpen(notification)}
      >
        <span className="flex min-w-0 items-center gap-2">
          {unread && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-yellow-400"
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
            <Badge className="h-4 bg-yellow-200 px-1.5 text-[9px] text-yellow-950 uppercase">
              {m.notifications_new()}
            </Badge>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
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
            className="w-24 justify-center text-[10px]"
          >
            {m.notifications_budget_type()}
          </Badge>
          <time
            className="w-12 text-right text-[10px] text-muted-foreground"
            dateTime={notification.createdAt}
          >
            {new Intl.DateTimeFormat(intlLocale(), {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(notification.createdAt))}
          </time>
        </div>
      )}
      {unread && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onMarkRead(notification)}
          aria-label={m.notifications_mark_read()}
          className="shrink-0 text-muted-foreground"
        >
          <CheckIcon />
        </Button>
      )}
    </div>
  )
}

export function NotificationDateHeader({
  date,
  count,
}: {
  date: string
  count?: number
}) {
  return (
    <div className="flex h-8 items-center justify-between bg-muted/50 px-4 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
      <span>{notificationDateLabel(date)}</span>
      {count !== undefined && (
        <span className="font-medium normal-case">
          {m.notifications_result_count({ count })}
        </span>
      )}
    </div>
  )
}

export function NotificationLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label={m.notifications_loading()}
      className="divide-y"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-9 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Empty className="min-h-48 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GaugeIcon />
        </EmptyMedia>
        <EmptyTitle>
          {filtered
            ? m.notifications_no_match_title()
            : m.notifications_empty_title()}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? m.notifications_no_match_description()
            : m.notifications_empty_description()}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function notificationDateLabel(value: string) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  if (value === today) return m.notifications_today()
  if (value === yesterday) return m.notifications_yesterday()
  return new Intl.DateTimeFormat(intlLocale(), {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`))
}
