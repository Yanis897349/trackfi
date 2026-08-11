import { vi } from "vitest"

export function mockApi({
  deferUrl,
  featureFlags = false,
  invitation,
  session,
  currency = "EUR",
  subscriptions = [],
  waitlistEntries = false,
  waitlistMode,
}: {
  deferUrl?: string
  featureFlags?: boolean
  invitation?: { email: string; valid: true } | null
  session: null | { session: { id: string }; user: Record<string, string> }
  currency?: string | null
  subscriptions?: Array<Record<string, unknown>>
  waitlistEntries?: boolean
  waitlistMode: boolean
}) {
  const requests: Array<{ method: string; url: string }> = []
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
      let body: unknown = {}
      let status = 200
      if (url.includes("/api/config")) body = { waitlistMode }
      else if (url.includes("/api/auth/get-session")) body = session
      else if (url.includes("/api/settings")) {
        body = { settings: { currency, updatedAt: null } }
      } else if (url.includes("/api/subscriptions/calendar")) {
        body = {
          calendar: {
            month: "2026-08",
            rangeStart: "2026-07-27",
            rangeEnd: "2026-09-06",
            currency,
            renewalCount: subscriptions.length,
            totalMinor: subscriptions.length ? 1000 : 0,
            categoryCount: subscriptions.length ? 1 : 0,
            monthTotalMinor: subscriptions.length ? 1000 : 0,
            renewals: subscriptions.map((subscription) => ({
              id: `${subscription.id}:${subscription.nextRenewalDate}`,
              subscriptionId: subscription.id,
              name: subscription.name,
              amountMinor: subscription.amountMinor,
              cadence: subscription.cadence,
              category: subscription.category,
              websiteUrl: subscription.websiteUrl,
              renewalDate: subscription.nextRenewalDate,
            })),
          },
        }
      } else if (url.includes("/api/subscriptions/summary")) {
        body = {
          summary: {
            currency,
            activeCount: subscriptions.length,
            pausedCount: 0,
            activeCategoryCount: subscriptions.length ? 1 : 0,
            monthlyEquivalentMinor: subscriptions.length ? 1000 : 0,
            annualEquivalentMinor: subscriptions.length ? 12000 : 0,
            upcomingCount: subscriptions.length,
            upcomingTotalMinor: subscriptions.length ? 1000 : 0,
            upcoming: subscriptions,
            monthlyComparison: null,
          },
        }
      } else if (url.includes("/api/subscriptions")) {
        body = {
          subscriptions,
          page: 1,
          pageSize: 3,
          total: subscriptions.length,
        }
      } else if (url.includes("/api/invitations/validate")) {
        if (invitation) body = invitation
        else {
          body = { valid: false }
          status = 404
        }
      } else if (url.includes("/api/admin/feature-flags")) {
        body =
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
            : { flag: { key: "waitlist_mode", enabled: false } }
      } else if (url.includes("/api/admin/waitlist") && waitlistEntries) {
        body =
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
            : { sent: true }
      } else if (url.includes("/api/auth/sign-out")) {
        body = { success: true }
      }
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      )
    })
  )
  return requests
}

export function sessionFor(role: "admin" | "user") {
  return {
    session: { id: "session-id" },
    user: {
      id: `${role}-id`,
      email: `${role}@example.com`,
      name: role === "admin" ? "Admin User" : "Regular User",
      role,
    },
  }
}

export function subscriptionFixture() {
  return {
    id: "subscription-id",
    name: "Design software",
    amountMinor: 1000,
    cadence: "monthly",
    billingAnchor: "2026-08-20",
    nextRenewalDate: "2026-08-20",
    category: "software",
    websiteUrl: "https://example.com",
    notes: null,
    status: "active",
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}
