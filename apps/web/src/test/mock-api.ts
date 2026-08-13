import { vi } from "vitest"

import { createExpenseMock } from "./mock-api-expenses"
import { createRevenueMock } from "./mock-api-revenue"
import { createSubscriptionMock } from "./mock-api-subscriptions"
import type {
  MockApiHandler,
  MockApiOptions,
  MockApiResponse,
} from "./mock-api-types"

export {
  expenseFixture,
  revenueSourceFixture,
  sessionFor,
  subscriptionFixture,
  notificationFixture,
} from "./mock-fixtures"

export function mockApi({
  deferUrl,
  featureFlags = false,
  invitation,
  session,
  currency = "EUR",
  expenses = [],
  revenueSources = [],
  subscriptions = [],
  notifications = [],
  waitlistEntries = false,
  waitlistMode,
  localeUpdateFails = false,
}: MockApiOptions) {
  const requests: Array<{ method: string; url: string }> = []
  const handlers: MockApiHandler[] = [
    createExpenseMock(expenses, currency),
    createRevenueMock(revenueSources, currency),
    createSubscriptionMock(subscriptions, currency),
  ]

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input)
      const method =
        (input instanceof Request ? input.method : init?.method) ?? "GET"
      requests.push({ method, url })
      if (deferUrl && url.includes(deferUrl)) {
        return new Promise<Response>(() => {})
      }

      let response: MockApiResponse | undefined
      for (const handler of handlers) {
        response = handler({ init, method, url })
        if (response) break
      }
      response ??= coreResponse({
        featureFlags,
        invitation,
        localeUpdateFails,
        method,
        session,
        url,
        waitlistEntries,
        waitlistMode,
        currency,
        notifications,
      })

      return Promise.resolve(
        new Response(JSON.stringify(response.body), {
          status: response.status ?? 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    })
  )
  return requests
}

function coreResponse({
  featureFlags,
  invitation,
  localeUpdateFails,
  method,
  session,
  url,
  waitlistEntries,
  waitlistMode,
  currency,
  notifications,
}: {
  currency: string | null
  notifications: Array<Record<string, unknown>>
  featureFlags: boolean
  invitation: { email: string; valid: true } | null | undefined
  localeUpdateFails: boolean
  method: string
  session: MockApiOptions["session"]
  url: string
  waitlistEntries: boolean
  waitlistMode: boolean
}): MockApiResponse {
  if (url.includes("/api/config")) return { body: { waitlistMode } }
  if (url.includes("/api/auth/get-session")) return { body: session }
  if (url.includes("/api/notifications/unread-count")) {
    return {
      body: {
        unreadCount: notifications.filter((item) => !item.readAt).length,
      },
    }
  }
  if (url.includes("/api/notifications/read-all")) {
    const updatedCount = notifications.filter((item) => !item.readAt).length
    for (const item of notifications) item.readAt ??= new Date().toISOString()
    return { body: { updatedCount, unreadCount: 0 } }
  }
  if (url.includes("/api/notifications/") && method === "PATCH") {
    const id = url.split("/api/notifications/")[1]?.split("/")[0]
    const notification = notifications.find((item) => item.id === id)
    if (!notification) return { body: { error: "not_found" }, status: 404 }
    notification.readAt ??= new Date().toISOString()
    return { body: { notification } }
  }
  if (url.includes("/api/notifications")) {
    const requestUrl = new URL(url)
    const status = requestUrl.searchParams.get("status") ?? "all"
    const type = requestUrl.searchParams.get("type") ?? "all"
    const query = (requestUrl.searchParams.get("q") ?? "").toLowerCase()
    const page = Number(requestUrl.searchParams.get("page") ?? 1)
    const pageSize = Number(requestUrl.searchParams.get("pageSize") ?? 6)
    const filtered = notifications.filter(
      (item) =>
        (status === "all" ||
          (status === "unread" && !item.readAt) ||
          (status === "read" && Boolean(item.readAt))) &&
        (type === "all" || item.type === type) &&
        (!query ||
          String(item.title).toLowerCase().includes(query) ||
          String(item.description).toLowerCase().includes(query))
    )
    const offset = (page - 1) * pageSize
    return {
      body: {
        notifications: filtered.slice(offset, offset + pageSize),
        page,
        pageSize,
        total: filtered.length,
        summary: {
          total: notifications.length,
          unread: notifications.filter((item) => !item.readAt).length,
          thisWeek: notifications.length,
        },
      },
    }
  }
  if (url.includes("/api/auth/update-user") && localeUpdateFails) {
    return { body: { message: "Unable to update user" }, status: 500 }
  }
  if (url.includes("/api/settings")) {
    return { body: { settings: { currency, updatedAt: null } } }
  }
  if (url.includes("/api/invitations/validate")) {
    return invitation
      ? { body: invitation }
      : { body: { valid: false }, status: 404 }
  }
  if (url.includes("/api/admin/feature-flags")) {
    return {
      body:
        method === "GET" && featureFlags
          ? {
              flags: [
                {
                  key: "waitlist_mode",
                  enabled: true,
                  description: "Restrict registration to invitations.",
                  updatedAt: new Date().toISOString(),
                },
              ],
            }
          : { flag: { key: "waitlist_mode", enabled: false } },
    }
  }
  if (url.includes("/api/admin/waitlist") && waitlistEntries) {
    return {
      body:
        method === "GET"
          ? {
              entries: [
                {
                  id: "entry-id",
                  email: "pending@example.com",
                  status: "pending",
                  created_at: new Date().toISOString(),
                  approved_at: null,
                  invite_expires_at: null,
                  invite_sent_at: null,
                  invite_delivery_status: "not_sent",
                  registered_at: null,
                },
              ],
              page: 1,
              pageSize: 25,
              total: 1,
            }
          : { sent: true },
    }
  }
  if (url.includes("/api/auth/sign-out")) {
    return { body: { success: true } }
  }
  return { body: {} }
}
