import type { Locale } from "@trackfi/localization"

import { formatCurrencyMinor } from "./intl"
import * as m from "./paraglide/messages.js"
import type {
  NotificationDeliveryRow,
  NotificationEmailRow,
  NotificationRow,
  NotificationType,
} from "./notification-types"

const notificationSelection = `id, user_id, type, expense_period_start,
  expense_period_end, spent_minor, budget_minor, currency, threshold_percent,
  read_at, created_at, updated_at`

export function listNotificationRows(database: D1Database, userId: string) {
  return database
    .prepare(
      `SELECT ${notificationSelection} FROM notifications
      WHERE user_id = ? ORDER BY created_at DESC, id DESC`
    )
    .bind(userId)
    .all<NotificationRow>()
}

export function findNotificationRow(
  database: D1Database,
  userId: string,
  notificationId: string
) {
  return database
    .prepare(
      `SELECT ${notificationSelection} FROM notifications
      WHERE id = ? AND user_id = ?`
    )
    .bind(notificationId, userId)
    .first<NotificationRow>()
}

export function findNotificationByPeriod(
  database: D1Database,
  userId: string,
  type: NotificationType,
  periodStart: string,
  periodEnd: string
) {
  return database
    .prepare(
      `SELECT ${notificationSelection} FROM notifications
      WHERE user_id = ? AND type = ? AND expense_period_start = ?
        AND expense_period_end = ?`
    )
    .bind(userId, type, periodStart, periodEnd)
    .first<NotificationRow>()
}

export function findNotificationDelivery(
  database: D1Database,
  notificationId: string
) {
  return database
    .prepare(
      `SELECT notification_id, channel, status, attempt_count,
        provider_message_id, last_error, enqueued_at, last_attempt_at, sent_at,
        created_at, updated_at FROM notification_deliveries
      WHERE notification_id = ? AND channel = 'email'`
    )
    .bind(notificationId)
    .first<NotificationDeliveryRow>()
}

export function findNotificationEmail(
  database: D1Database,
  notificationId: string
) {
  return database
    .prepare(
      `SELECT n.id, n.user_id, n.type, n.expense_period_start,
        n.expense_period_end, n.spent_minor, n.budget_minor, n.currency,
        n.threshold_percent, n.read_at, n.created_at, n.updated_at,
        d.notification_id, d.channel, d.status, d.attempt_count,
        d.provider_message_id, d.last_error, d.enqueued_at,
        d.last_attempt_at, d.sent_at, u.email, u.locale
      FROM notifications n
      JOIN notification_deliveries d ON d.notification_id = n.id
      JOIN user u ON u.id = n.user_id
      WHERE n.id = ? AND d.channel = 'email'`
    )
    .bind(notificationId)
    .first<NotificationEmailRow>()
}

export async function markNotificationRead(
  database: D1Database,
  userId: string,
  notificationId: string
) {
  const notification = await findNotificationRow(
    database,
    userId,
    notificationId
  )
  if (!notification) return null
  if (notification.read_at) return notification
  const now = new Date().toISOString()
  await database
    .prepare(
      `UPDATE notifications SET read_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND read_at IS NULL`
    )
    .bind(now, now, notificationId, userId)
    .run()
  return findNotificationRow(database, userId, notificationId)
}

export async function markAllNotificationsRead(
  database: D1Database,
  userId: string
) {
  const now = new Date().toISOString()
  const result = await database
    .prepare(
      `UPDATE notifications SET read_at = ?, updated_at = ?
      WHERE user_id = ? AND read_at IS NULL`
    )
    .bind(now, now, userId)
    .run()
  return result.meta.changes
}

export function unreadNotificationCount(database: D1Database, userId: string) {
  return database
    .prepare(
      `SELECT COUNT(*) AS count FROM notifications
      WHERE user_id = ? AND read_at IS NULL`
    )
    .bind(userId)
    .first<{ count: number }>()
}

export function serializeNotification(row: NotificationRow, locale: Locale) {
  const spent = formatCurrencyMinor(row.spent_minor, row.currency, locale)
  const budget = formatCurrencyMinor(row.budget_minor, row.currency, locale)
  const values = {
    budget,
    spent,
    threshold: row.threshold_percent,
  }
  const approaching = row.type === "expense_budget_approaching"
  return {
    id: row.id,
    type: row.type,
    title: approaching
      ? m.notification_expense_budget_approaching_title({}, { locale })
      : m.notification_expense_budget_limit_title({}, { locale }),
    description: approaching
      ? m.notification_expense_budget_approaching_description(values, {
          locale,
        })
      : m.notification_expense_budget_limit_description(values, { locale }),
    expensePeriod: {
      start: row.expense_period_start,
      end: row.expense_period_end,
    },
    context: {
      spentMinor: row.spent_minor,
      budgetMinor: row.budget_minor,
      currency: row.currency,
      thresholdPercent: row.threshold_percent,
    },
    readAt: row.read_at,
    createdAt: row.created_at,
    actionPath: "/dashboard/expenses" as const,
  }
}
