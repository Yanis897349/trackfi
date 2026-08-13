import { todayDateOnly } from "./date"
import {
  findNotificationByPeriod,
  findNotificationDelivery,
} from "./notification-database"
import type { NotificationType } from "./notification-types"
import { readExpenseSummary } from "./expense-summary"
import type { Bindings } from "./types"

interface EligibleNotification {
  threshold: number
  type: NotificationType
}

export async function evaluateExpenseBudgetNotifications(
  env: Bindings,
  userId: string,
  asOf = todayDateOnly()
) {
  const summary = await readExpenseSummary(env.DB, userId, asOf)
  if (!summary.currency || !summary.effectiveBudgetMinor) return []

  const eligible: EligibleNotification[] = []
  if (
    thresholdReached(
      summary.spentMinor,
      summary.effectiveBudgetMinor,
      summary.settings.approachingThreshold
    )
  ) {
    eligible.push({
      type: "expense_budget_approaching",
      threshold: summary.settings.approachingThreshold,
    })
  }
  if (
    thresholdReached(
      summary.spentMinor,
      summary.effectiveBudgetMinor,
      summary.settings.limitThreshold
    )
  ) {
    eligible.push({
      type: "expense_budget_limit",
      threshold: summary.settings.limitThreshold,
    })
  }
  if (!eligible.length) return []

  const now = new Date().toISOString()
  const statements: D1PreparedStatement[] = []
  for (const event of eligible) {
    const id = crypto.randomUUID()
    statements.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO notifications
        (id, user_id, type, expense_period_start, expense_period_end,
          spent_minor, budget_minor, currency, threshold_percent, read_at,
          created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
      ).bind(
        id,
        userId,
        event.type,
        summary.period.start,
        summary.period.end,
        summary.spentMinor,
        summary.effectiveBudgetMinor,
        summary.currency,
        event.threshold,
        now,
        now
      ),
      env.DB.prepare(
        `INSERT OR IGNORE INTO notification_deliveries
        (notification_id, channel, status, attempt_count, provider_message_id,
          last_error, enqueued_at, last_attempt_at, sent_at, created_at,
          updated_at)
        SELECT ?, 'email', 'pending', 0, NULL, NULL, NULL, NULL, NULL, ?, ?
        WHERE EXISTS (SELECT 1 FROM notifications WHERE id = ?)`
      ).bind(id, now, now, id)
    )
  }
  await env.DB.batch(statements)

  const pending: string[] = []
  for (const event of eligible) {
    const notification = await findNotificationByPeriod(
      env.DB,
      userId,
      event.type,
      summary.period.start,
      summary.period.end
    )
    if (!notification) continue
    const delivery = await findNotificationDelivery(env.DB, notification.id)
    if (delivery?.status === "pending") pending.push(notification.id)
  }
  return pending
}

function thresholdReached(spent: number, budget: number, threshold: number) {
  return BigInt(spent) * 100n >= BigInt(budget) * BigInt(threshold)
}
