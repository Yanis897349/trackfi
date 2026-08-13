import { formatDistanceToNow } from "date-fns"
import {
  CheckIcon,
  ChevronRightIcon,
  GaugeIcon,
  TriangleAlertIcon,
} from "lucide-react"

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
        <span
          className="flex size-7 shrink-0 items-center justify-center text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronRightIcon className="size-4" />
        </span>
      ) : null}
    </div>
  )
}

export function NotificationDateHeader({
  date,
  count,
  variant,
}: {
  date: string
  count?: number
  variant: "history" | "inbox"
}) {
  const label = notificationDateLabel(date)

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-muted/50 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase",
        variant === "inbox" ? "px-5 pt-3 pb-2" : "px-4 py-2"
      )}
    >
      <span>
        {variant === "history"
          ? `${label.relative ?? label.weekday} · ${label.date}`
          : (label.relative ?? label.weekday)}
      </span>
      {variant === "inbox" ? (
        <span className="font-medium">{label.date}</span>
      ) : (
        count !== undefined && (
          <span className="font-medium normal-case">
            {m.notifications_result_count({ count })}
          </span>
        )
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
  const date = new Date(`${value}T00:00:00Z`)
  const shortDate = new Intl.DateTimeFormat(intlLocale(), {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date)
  const weekday = new Intl.DateTimeFormat(intlLocale(), {
    weekday: "long",
    timeZone: "UTC",
  }).format(date)

  return {
    relative:
      value === today
        ? m.notifications_today()
        : value === yesterday
          ? m.notifications_yesterday()
          : null,
    weekday,
    date: shortDate,
  }
}
