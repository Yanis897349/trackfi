import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { BellIcon, CheckCheckIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@trackfi/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@trackfi/ui/components/popover"
import { cn } from "@trackfi/ui/lib/utils"

import { useNotificationActions } from "../hooks/use-notifications"
import { m } from "../lib/i18n"
import {
  groupNotifications,
  notificationListQueryOptions,
  unreadNotificationCountQueryOptions,
  type Notification,
  type NotificationStatusFilter,
} from "../lib/notifications"
import {
  NotificationDateHeader,
  NotificationEmptyState,
  NotificationItem,
  NotificationLoading,
} from "./notification-parts"

export function NotificationInbox() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<NotificationStatusFilter>("all")
  const navigate = useNavigate()
  const unread = useQuery(unreadNotificationCountQueryOptions())
  const list = useQuery({
    ...notificationListQueryOptions({
      range: "all",
      status: filter,
      pageSize: 4,
    }),
    enabled: open,
  })
  const { markAllRead, markRead } = useNotificationActions()
  const unreadCount = unread.data?.unreadCount ?? 0

  function openNotification(notification: Notification) {
    if (!notification.readAt) markRead.mutate(notification.id)
    setOpen(false)
    void navigate({ to: notification.actionPath })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={m.notifications_unread_count({ count: unreadCount })}
          />
        }
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] leading-4 font-bold text-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(420px,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
      >
        <PopoverHeader className="flex-row items-center justify-between px-5 pt-5 pb-3">
          <div>
            <PopoverTitle className="text-lg">{m.notifications()}</PopoverTitle>
            <PopoverDescription className="text-xs">
              {m.notifications_unread_count({
                count: list.data?.summary.unread ?? unreadCount,
              })}
            </PopoverDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheckIcon />
            {m.notifications_mark_all_read()}
          </Button>
        </PopoverHeader>
        <div className="flex gap-1 border-b px-5 pb-3">
          {(["all", "unread"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="xs"
              variant={filter === value ? "default" : "ghost"}
              onClick={() => setFilter(value)}
              className="rounded-md"
            >
              {value === "all"
                ? m.notifications_all()
                : m.notifications_unread()}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  filter === value ? "bg-white/15" : "bg-muted"
                )}
              >
                {value === "all"
                  ? (list.data?.summary.total ?? 0)
                  : (list.data?.summary.unread ?? unreadCount)}
              </span>
            </Button>
          ))}
        </div>
        <div className="max-h-[344px] overflow-y-auto">
          {list.isPending ? (
            <NotificationLoading />
          ) : list.isError ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p>{m.notifications_error_description()}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void list.refetch()}
              >
                {m.common_retry()}
              </Button>
            </div>
          ) : !list.data.notifications.length ? (
            <NotificationEmptyState filtered={filter !== "all"} />
          ) : (
            groupNotifications(list.data.notifications).map((group) => (
              <div key={group.date}>
                <NotificationDateHeader date={group.date} />
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    variant="inbox"
                    onOpen={openNotification}
                    onMarkRead={(item) => markRead.mutate(item.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
        <Button
          variant="ghost"
          nativeButton={false}
          className="h-11 w-full rounded-none border-t bg-muted/30 text-xs"
          render={<Link to="/dashboard/notifications" />}
          onClick={() => setOpen(false)}
        >
          {m.notifications_view_history()}
          <ChevronRightIcon />
        </Button>
      </PopoverContent>
    </Popover>
  )
}
