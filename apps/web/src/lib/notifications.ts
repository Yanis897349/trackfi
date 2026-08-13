import { keepPreviousData } from "@tanstack/react-query"

import { apiFetch } from "./api"

export const notificationTypes = [
  "expense_budget_approaching",
  "expense_budget_limit",
] as const

export type NotificationType = (typeof notificationTypes)[number]
export type NotificationStatusFilter = "all" | "read" | "unread"
export type NotificationRange = "7d" | "30d" | "90d" | "all"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  expensePeriod: { start: string; end: string }
  context: {
    spentMinor: number
    budgetMinor: number
    currency: string
    thresholdPercent: number
  }
  readAt: string | null
  createdAt: string
  actionPath: "/dashboard/expenses"
}

export interface NotificationListResponse {
  notifications: Notification[]
  page: number
  pageSize: number
  total: number
  summary: { total: number; unread: number; thisWeek: number }
}

export function notificationListQueryOptions({
  query = "",
  status = "all",
  type = "all",
  range = "30d",
  page = 1,
  pageSize = 6,
}: {
  query?: string
  status?: NotificationStatusFilter
  type?: NotificationType | "all"
  range?: NotificationRange
  page?: number
  pageSize?: number
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    range,
    status,
    type,
  })
  if (query.trim()) params.set("q", query.trim())
  const queryString = params.toString()
  return {
    queryKey: ["notifications", queryString],
    queryFn: () =>
      apiFetch<NotificationListResponse>(`/api/notifications?${queryString}`),
    placeholderData: keepPreviousData,
  }
}

export function unreadNotificationCountQueryOptions() {
  return {
    queryKey: ["notification-unread-count"],
    queryFn: () =>
      apiFetch<{ unreadCount: number }>("/api/notifications/unread-count"),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  }
}

export function formatUnreadNotificationCount(count: number) {
  return count > 99 ? "99+" : String(count)
}

export function groupNotifications(notifications: Notification[]) {
  const groups = new Map<string, Notification[]>()
  for (const notification of notifications) {
    const key = notification.createdAt.slice(0, 10)
    groups.set(key, [...(groups.get(key) ?? []), notification])
  }
  return [...groups.entries()].map(([date, items]) => ({ date, items }))
}
