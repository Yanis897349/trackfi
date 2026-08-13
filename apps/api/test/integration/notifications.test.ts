import { env } from "cloudflare:workers"
import { describe, expect, it, vi } from "vitest"

import { todayDateOnly } from "../../src/date"
import {
  processNotificationDeliveryMessage,
  reconcileExpenseNotifications,
} from "../../src/notification-delivery"
import type { NotificationDeliveryMessage } from "../../src/notification-types"
import type { Bindings } from "../../src/types"
import { expenseBody } from "../support/fixtures"
import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("notifications", () => {
  it("emits each threshold once and scopes read operations to the owner", async () => {
    const cookie = await createUserSession()
    await configureBudget(cookie)

    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        amountMinor: 80_000,
        transactionDate: todayDateOnly(),
      }),
    })
    let list = await notificationList(cookie)
    expect(list.notifications).toHaveLength(1)
    expect(list.notifications[0]).toMatchObject({
      type: "expense_budget_approaching",
      readAt: null,
    })

    await userApi(`/api/expenses/${await latestExpenseId(cookie)}`, cookie, {
      method: "PATCH",
      body: { notes: "Recalculated without another alert" },
    })
    expect((await notificationList(cookie)).notifications).toHaveLength(1)

    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        merchant: "Utilities",
        amountMinor: 20_000,
        transactionDate: todayDateOnly(),
        category: "utilities",
      }),
    })
    list = await notificationList(cookie)
    expect(list.notifications.map((item) => item.type).sort()).toEqual([
      "expense_budget_approaching",
      "expense_budget_limit",
    ])
    expect(
      await (await userApi("/api/notifications/unread-count", cookie)).json()
    ).toEqual({ unreadCount: 2 })

    const otherCookie = await createUserSession()
    expect(
      (
        await userApi(
          `/api/notifications/${list.notifications[0]!.id}/read`,
          otherCookie,
          { method: "PATCH" }
        )
      ).status
    ).toBe(404)
    expect((await notificationList(otherCookie)).notifications).toHaveLength(0)

    await userApi(
      `/api/notifications/${list.notifications[0]!.id}/read`,
      cookie,
      { method: "PATCH" }
    )
    expect(
      await (await userApi("/api/notifications/unread-count", cookie)).json()
    ).toEqual({ unreadCount: 1 })
    await userApi("/api/notifications/read-all", cookie, { method: "PATCH" })
    expect(
      await (await userApi("/api/notifications/unread-count", cookie)).json()
    ).toEqual({ unreadCount: 0 })
  })

  it("creates both alerts for a direct jump and backfill remains idempotent", async () => {
    const cookie = await createUserSession()
    await configureBudget(cookie)
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        amountMinor: 120_000,
        transactionDate: todayDateOnly(),
      }),
    })
    expect((await notificationList(cookie)).notifications).toHaveLength(2)
    await reconcileExpenseNotifications(env as unknown as Bindings)
    await reconcileExpenseNotifications(env as unknown as Bindings)
    expect((await notificationList(cookie)).notifications).toHaveLength(2)
  })

  it("tracks successful and failed Queue delivery attempts safely", async () => {
    const cookie = await createUserSession()
    await configureBudget(cookie)
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        amountMinor: 100_000,
        transactionDate: todayDateOnly(),
      }),
    })
    const notifications = (await notificationList(cookie)).notifications
    const success = fakeMessage(notifications[0]!.id)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ id: "email_123" }))
    )
    await processNotificationDeliveryMessage(
      {
        ...(env as unknown as Bindings),
        RESEND_API_KEY: "resend-test-key",
      },
      success.message
    )
    expect(success.ack).toHaveBeenCalledOnce()
    expect(success.retry).not.toHaveBeenCalled()
    await expect(deliveryStatus(notifications[0]!.id)).resolves.toMatchObject({
      status: "sent",
      provider_message_id: "email_123",
      attempt_count: 1,
    })

    const failure = fakeMessage(notifications[1]!.id, 2)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 503 }))
    )
    await processNotificationDeliveryMessage(
      {
        ...(env as unknown as Bindings),
        RESEND_API_KEY: "resend-test-key",
      },
      failure.message
    )
    expect(failure.retry).toHaveBeenCalledWith({ delaySeconds: 300 })
    await expect(deliveryStatus(notifications[1]!.id)).resolves.toMatchObject({
      status: "failed",
      attempt_count: 1,
      last_error: "Resend rejected the email with status 503",
    })
  })
})

async function configureBudget(cookie: string) {
  await userApi("/api/settings", cookie, {
    method: "PATCH",
    body: { currency: "EUR" },
  })
  await userApi("/api/expenses/settings", cookie, {
    method: "PATCH",
    body: {
      monthlyBudgetMinor: 100_000,
      dailyTargetMinor: null,
      budgetPeriod: "monthly",
      resetDay: 1,
      rolloverEnabled: false,
      approachingThreshold: 80,
      limitThreshold: 100,
    },
  })
}

async function notificationList(cookie: string) {
  return (
    await userApi("/api/notifications?range=all&page=1&pageSize=50", cookie)
  ).json<{
    notifications: Array<{
      id: string
      type: string
      readAt: string | null
    }>
  }>()
}

async function latestExpenseId(cookie: string) {
  const body = await (
    await userApi("/api/expenses?page=1&pageSize=1", cookie)
  ).json<{ expenses: Array<{ id: string }> }>()
  return body.expenses[0]!.id
}

function fakeMessage(notificationId: string, attempts = 1) {
  const ack = vi.fn()
  const retry = vi.fn()
  const message = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    body: { notificationId },
    attempts,
    ack,
    retry,
  } as unknown as Message<NotificationDeliveryMessage>
  return { ack, message, retry }
}

function deliveryStatus(notificationId: string) {
  return env.DB.prepare(
    `SELECT status, provider_message_id, attempt_count, last_error
    FROM notification_deliveries WHERE notification_id = ?`
  )
    .bind(notificationId)
    .first<{
      status: string
      provider_message_id: string | null
      attempt_count: number
      last_error: string | null
    }>()
}
