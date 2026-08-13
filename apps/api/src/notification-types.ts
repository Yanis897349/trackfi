import type { Locale } from "@trackfi/localization"

export const notificationTypes = [
  "expense_budget_approaching",
  "expense_budget_limit",
] as const

export type NotificationType = (typeof notificationTypes)[number]
export type NotificationDeliveryStatus =
  "pending" | "queued" | "sending" | "sent" | "failed"

export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  expense_period_start: string
  expense_period_end: string
  spent_minor: number
  budget_minor: number
  currency: string
  threshold_percent: number
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationDeliveryRow {
  notification_id: string
  channel: "email"
  status: NotificationDeliveryStatus
  attempt_count: number
  provider_message_id: string | null
  last_error: string | null
  enqueued_at: string | null
  last_attempt_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationEmailRow
  extends NotificationRow, NotificationDeliveryRow {
  email: string
  locale: Locale
}

export interface NotificationDeliveryMessage {
  notificationId: string
}
