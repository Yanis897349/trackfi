import { useNavigate } from "@tanstack/react-router"

import { useNotificationHistory } from "../hooks/use-notifications"
import type {
  Notification,
  NotificationListResponse,
} from "../lib/notifications"
import {
  NotificationHistoryFilters,
  NotificationHistoryHeader,
} from "./notification-history-controls"
import { NotificationHistoryResults } from "./notification-history-results"

export function NotificationHistory() {
  const state = useNotificationHistory()
  const navigate = useNavigate()
  const data: NotificationListResponse = state.query.data ?? {
    notifications: [],
    page: state.page,
    pageSize: 6,
    total: 0,
    summary: { total: 0, unread: 0, thisWeek: 0 },
  }
  const hasFilters =
    Boolean(state.search) ||
    state.status !== "all" ||
    state.type !== "all" ||
    state.range !== "30d"

  function openNotification(notification: Notification) {
    if (!notification.readAt) state.actions.markRead.mutate(notification.id)
    void navigate({ to: notification.actionPath })
  }

  return (
    <div className="space-y-6 md:px-1 md:pt-2">
      <NotificationHistoryHeader state={state} />
      <NotificationHistoryFilters state={state} />
      <NotificationHistoryResults
        state={state}
        data={data}
        hasFilters={hasFilters}
        onOpen={openNotification}
      />
    </div>
  )
}
