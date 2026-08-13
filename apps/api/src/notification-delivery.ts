import { sendExpenseBudgetNotification } from "./email"
import { safeErrorMessage } from "./errors"
import { formatCurrencyMinor, formatDateOnlyRange } from "./intl"
import { evaluateExpenseBudgetNotifications } from "./notification-evaluation"
import { findNotificationEmail } from "./notification-database"
import type { NotificationDeliveryMessage } from "./notification-types"
import type { Bindings } from "./types"

const retryDelays = [60, 300, 1_800, 7_200, 21_600]

export async function enqueueNotificationDeliveries(
  env: Bindings,
  notificationIds: string[]
) {
  await Promise.all(
    [...new Set(notificationIds)].map(async (notificationId) => {
      try {
        await env.NOTIFICATION_EMAIL_QUEUE.send({ notificationId })
        const now = new Date().toISOString()
        await env.DB.prepare(
          `UPDATE notification_deliveries SET status = 'queued',
            enqueued_at = ?, last_error = NULL, updated_at = ?
          WHERE notification_id = ? AND channel = 'email'
            AND status = 'pending'`
        )
          .bind(now, now, notificationId)
          .run()
      } catch (error) {
        const now = new Date().toISOString()
        await env.DB.prepare(
          `UPDATE notification_deliveries SET last_error = ?, updated_at = ?
          WHERE notification_id = ? AND channel = 'email'
            AND status = 'pending'`
        )
          .bind(
            safeErrorMessage(error, "notification_delivery_failed"),
            now,
            notificationId
          )
          .run()
      }
    })
  )
}

export async function dispatchPendingNotificationDeliveries(env: Bindings) {
  const pending = await env.DB.prepare(
    `SELECT notification_id FROM notification_deliveries
    WHERE channel = 'email' AND status = 'pending'
    ORDER BY created_at LIMIT 100`
  ).all<{ notification_id: string }>()
  await enqueueNotificationDeliveries(
    env,
    pending.results.map((row) => row.notification_id)
  )
}

export async function processNotificationDeliveryBatch(
  env: Bindings,
  batch: MessageBatch<NotificationDeliveryMessage>
) {
  await Promise.all(
    batch.messages.map((message) =>
      processNotificationDeliveryMessage(env, message)
    )
  )
}

export async function processNotificationDeliveryMessage(
  env: Bindings,
  message: Message<NotificationDeliveryMessage>
) {
  const notificationId = message.body?.notificationId
  if (typeof notificationId !== "string" || !notificationId) {
    message.ack()
    return
  }
  const notification = await findNotificationEmail(env.DB, notificationId)
  if (!notification || notification.status === "sent") {
    message.ack()
    return
  }

  const attemptedAt = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE notification_deliveries SET status = 'sending',
      attempt_count = attempt_count + 1, last_attempt_at = ?, updated_at = ?
    WHERE notification_id = ? AND channel = 'email' AND status != 'sent'`
  )
    .bind(attemptedAt, attemptedAt, notificationId)
    .run()

  try {
    const result = await sendExpenseBudgetNotification(env, {
      budget: formatCurrencyMinor(
        notification.budget_minor,
        notification.currency,
        notification.locale
      ),
      email: notification.email,
      locale: notification.locale,
      notificationId,
      period: formatDateOnlyRange(
        notification.expense_period_start,
        notification.expense_period_end,
        notification.locale
      ),
      spent: formatCurrencyMinor(
        notification.spent_minor,
        notification.currency,
        notification.locale
      ),
      threshold: notification.threshold_percent,
      type: notification.type,
    })
    const sentAt = new Date().toISOString()
    await env.DB.prepare(
      `UPDATE notification_deliveries SET status = 'sent',
        provider_message_id = ?, last_error = NULL, sent_at = ?, updated_at = ?
      WHERE notification_id = ? AND channel = 'email'`
    )
      .bind(result.id, sentAt, sentAt, notificationId)
      .run()
    message.ack()
  } catch (error) {
    const failedAt = new Date().toISOString()
    await env.DB.prepare(
      `UPDATE notification_deliveries SET status = 'failed', last_error = ?,
        updated_at = ? WHERE notification_id = ? AND channel = 'email'`
    )
      .bind(
        safeErrorMessage(error, "notification_delivery_failed"),
        failedAt,
        notificationId
      )
      .run()
    message.retry({
      delaySeconds:
        retryDelays[Math.min(message.attempts - 1, retryDelays.length - 1)]!,
    })
  }
}

export async function runNotificationMaintenance(env: Bindings) {
  await reconcileExpenseNotifications(env)
  await dispatchPendingNotificationDeliveries(env)
}

export async function reconcileExpenseNotifications(env: Bindings) {
  const state = await env.DB.prepare(
    `SELECT last_user_id FROM notification_reconciliation_state WHERE id = 1`
  ).first<{ last_user_id: string | null }>()
  const cursor = state?.last_user_id ?? ""
  const users = await env.DB.prepare(
    `SELECT user_id FROM expense_settings
    WHERE monthly_budget_minor IS NOT NULL AND user_id > ?
    ORDER BY user_id LIMIT 50`
  )
    .bind(cursor)
    .all<{ user_id: string }>()

  for (let index = 0; index < users.results.length; index += 5) {
    const batch = users.results.slice(index, index + 5)
    await Promise.all(
      batch.map(async ({ user_id }) => {
        const pending = await evaluateExpenseBudgetNotifications(env, user_id)
        await enqueueNotificationDeliveries(env, pending)
      })
    )
  }

  const now = new Date().toISOString()
  const completed = users.results.length < 50
  const lastUserId = completed
    ? null
    : users.results[users.results.length - 1]!.user_id
  await env.DB.prepare(
    `UPDATE notification_reconciliation_state SET last_user_id = ?,
      last_completed_at = CASE WHEN ? THEN ? ELSE last_completed_at END,
      updated_at = ? WHERE id = 1`
  )
    .bind(lastUserId, completed ? 1 : 0, now, now)
    .run()
}
