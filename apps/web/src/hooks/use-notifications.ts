import { useState } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

import { apiFetch } from "../lib/api"
import {
  notificationListQueryOptions,
  type Notification,
  type NotificationListResponse,
  type NotificationRange,
  type NotificationStatusFilter,
  type NotificationType,
} from "../lib/notifications"

type NotificationSnapshot = Array<
  readonly [readonly unknown[], NotificationListResponse | undefined]
>

export function useNotificationActions() {
  const queryClient = useQueryClient()
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ notification: Notification }>(
        `/api/notifications/${id}/read`,
        { method: "PATCH" }
      ),
    onMutate: async (id) => optimisticMarkRead(queryClient, id),
    onError: (_error, _id, snapshot) => restoreSnapshot(queryClient, snapshot),
    onSettled: () => invalidateNotifications(queryClient),
  })
  const markAllRead = useMutation({
    mutationFn: () =>
      apiFetch<{ updatedCount: number; unreadCount: number }>(
        "/api/notifications/read-all",
        { method: "PATCH" }
      ),
    onMutate: async () => optimisticMarkAllRead(queryClient),
    onError: (_error, _variables, snapshot) =>
      restoreSnapshot(queryClient, snapshot),
    onSettled: () => invalidateNotifications(queryClient),
  })
  return { markAllRead, markRead }
}

export function useNotificationHistory() {
  const [search, setSearchState] = useState("")
  const [status, setStatusState] = useState<NotificationStatusFilter>("all")
  const [type, setTypeState] = useState<NotificationType | "all">("all")
  const [range, setRangeState] = useState<NotificationRange>("30d")
  const [page, setPage] = useState(1)
  const query = useQuery(
    notificationListQueryOptions({
      query: search,
      status,
      type,
      range,
      page,
      pageSize: 6,
    })
  )
  const actions = useNotificationActions()
  function resetPage<T>(setter: (value: T) => void, value: T) {
    setter(value)
    setPage(1)
  }
  return {
    actions,
    page,
    query,
    range,
    search,
    status,
    type,
    setPage,
    setRange(value: NotificationRange) {
      resetPage(setRangeState, value)
    },
    setSearch(value: string) {
      resetPage(setSearchState, value)
    },
    setStatus(value: NotificationStatusFilter) {
      resetPage(setStatusState, value)
    },
    setType(value: NotificationType | "all") {
      resetPage(setTypeState, value)
    },
  }
}

async function optimisticMarkRead(queryClient: QueryClient, id: string) {
  await cancelNotificationQueries(queryClient)
  const snapshot = notificationSnapshot(queryClient)
  const now = new Date().toISOString()
  queryClient.setQueriesData<NotificationListResponse>(
    { queryKey: ["notifications"] },
    (current) => {
      if (!current) return current
      let changed = false
      const notifications = current.notifications.map((notification) => {
        if (notification.id !== id || notification.readAt) return notification
        changed = true
        return { ...notification, readAt: now }
      })
      return changed
        ? {
            ...current,
            notifications,
            summary: {
              ...current.summary,
              unread: Math.max(0, current.summary.unread - 1),
            },
          }
        : current
    }
  )
  queryClient.setQueryData<{ unreadCount: number }>(
    ["notification-unread-count"],
    (current) =>
      current ? { unreadCount: Math.max(0, current.unreadCount - 1) } : current
  )
  return snapshot
}

async function optimisticMarkAllRead(queryClient: QueryClient) {
  await cancelNotificationQueries(queryClient)
  const snapshot = notificationSnapshot(queryClient)
  const now = new Date().toISOString()
  queryClient.setQueriesData<NotificationListResponse>(
    { queryKey: ["notifications"] },
    (current) =>
      current
        ? {
            ...current,
            notifications: current.notifications.map((notification) => ({
              ...notification,
              readAt: notification.readAt ?? now,
            })),
            summary: { ...current.summary, unread: 0 },
          }
        : current
  )
  queryClient.setQueryData(["notification-unread-count"], { unreadCount: 0 })
  return snapshot
}

function notificationSnapshot(queryClient: QueryClient) {
  return {
    lists: queryClient.getQueriesData<NotificationListResponse>({
      queryKey: ["notifications"],
    }) as NotificationSnapshot,
    unread: queryClient.getQueryData<{ unreadCount: number }>([
      "notification-unread-count",
    ]),
  }
}

function restoreSnapshot(
  queryClient: QueryClient,
  snapshot:
    | {
        lists: NotificationSnapshot
        unread: { unreadCount: number } | undefined
      }
    | undefined
) {
  if (!snapshot) return
  for (const [key, value] of snapshot.lists)
    queryClient.setQueryData(key, value)
  queryClient.setQueryData(["notification-unread-count"], snapshot.unread)
}

function cancelNotificationQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.cancelQueries({ queryKey: ["notifications"] }),
    queryClient.cancelQueries({ queryKey: ["notification-unread-count"] }),
  ])
}

function invalidateNotifications(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
  ])
}
