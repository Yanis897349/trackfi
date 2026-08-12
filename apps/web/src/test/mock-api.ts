import { vi } from "vitest"

export function mockApi({
  deferUrl,
  featureFlags = false,
  invitation,
  session,
  currency = "EUR",
  expenses = [],
  revenueSources = [],
  subscriptions = [],
  waitlistEntries = false,
  waitlistMode,
}: {
  deferUrl?: string
  featureFlags?: boolean
  invitation?: { email: string; valid: true } | null
  session: null | { session: { id: string }; user: Record<string, string> }
  currency?: string | null
  expenses?: Array<Record<string, unknown>>
  revenueSources?: Array<Record<string, unknown>>
  subscriptions?: Array<Record<string, unknown>>
  waitlistEntries?: boolean
  waitlistMode: boolean
}) {
  const requests: Array<{ method: string; url: string }> = []
  const expenseRecords = expenses.map((expense) => ({ ...expense }))
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
      } else if (url.includes("/api/expenses/summary")) {
        const active = expenseRecords.filter(
          (expense) => expense.status === "active"
        )
        const requestUrl = new URL(url, "https://trackfi.test")
        const months = Number(requestUrl.searchParams.get("months") ?? "6")
        const asOf = requestUrl.searchParams.get("asOf") ?? "2026-08-12"
        const subscriptionMonthly = subscriptions.reduce(
          (total, subscription) =>
            total +
            Number(
              subscription.monthlyEquivalentMinor ??
                subscription.amountMinor ??
                0
            ),
          0
        )
        const expenseMonthly = active.reduce(
          (total, expense) =>
            total + Number(expense.monthlyEquivalentMinor ?? 0),
          0
        )
        const monthly = subscriptionMonthly + expenseMonthly
        const categoryTotals = new Map<string, number>()
        for (const item of [...active, ...subscriptions]) {
          const category = String(item.category ?? "other")
          const value =
            Number(item.monthlyEquivalentMinor ?? item.amountMinor ?? 0) *
            months
          categoryTotals.set(
            category,
            (categoryTotals.get(category) ?? 0) + value
          )
        }
        body = {
          summary: {
            currency,
            activeExpenseCount: active.length,
            activeSubscriptionCount: subscriptions.length,
            pausedExpenseCount: expenseRecords.filter(
              (expense) => expense.status === "paused"
            ).length,
            variableExpenseCount: active.filter(
              (expense) => expense.scheduleType === "variable"
            ).length,
            forecast: {
              months,
              totalMinor: monthly * months,
              previousMonthMinor: monthly,
              averageMonthlyMinor: monthly,
              series: Array.from({ length: months }, (_, index) => ({
                month: addMockMonths(asOf.slice(0, 7), index),
                amountMinor: monthly,
              })),
            },
            categoryBreakdown: Array.from(
              categoryTotals,
              ([category, totalMinor]) => ({
                category,
                totalMinor,
              })
            ),
            upcomingScheduledCount: active.length + subscriptions.length,
            upcomingScheduledTotalMinor: [...active, ...subscriptions].reduce(
              (total, item) =>
                total +
                (item.nextExpenseDate || item.nextRenewalDate
                  ? Number(item.amountMinor)
                  : 0),
              0
            ),
            upcomingSpending: [
              ...active.map((expense) => ({
                id: `expense:${expense.id}`,
                sourceId: expense.id,
                origin: "expense",
                name: expense.name,
                category: expense.category,
                amountMinor: expense.amountMinor,
                scheduleType: expense.scheduleType,
                cadence: expense.cadence,
                expectedDate: expense.nextExpenseDate ?? null,
              })),
              ...subscriptions.map((subscription) => ({
                id: `subscription:${subscription.id}`,
                sourceId: subscription.id,
                origin: "subscription",
                name: subscription.name,
                category: subscription.category,
                amountMinor: subscription.amountMinor,
                scheduleType: "scheduled",
                cadence: subscription.cadence,
                expectedDate: subscription.nextRenewalDate,
              })),
            ],
          },
        }
      } else if (url.includes("/api/expenses")) {
        const requestUrl = new URL(url, "https://trackfi.test")
        if (method === "PATCH") {
          const id = requestUrl.pathname.split("/").at(-1)
          const expense = expenseRecords.find((record) => record.id === id)
          const update =
            typeof init?.body === "string" ? JSON.parse(init.body) : {}
          if (expense) Object.assign(expense, update)
          body = { expense }
        } else {
          const statusFilter = requestUrl.searchParams.get("status") ?? "active"
          const category = requestUrl.searchParams.get("category")
          const scheduleType = requestUrl.searchParams.get("scheduleType")
          const query = (requestUrl.searchParams.get("q") ?? "").toLowerCase()
          const page = Number(requestUrl.searchParams.get("page") ?? "1")
          const pageSize = Number(
            requestUrl.searchParams.get("pageSize") ?? "25"
          )
          const filtered = expenseRecords.filter((expense) => {
            const statusMatches =
              statusFilter === "all" ||
              (statusFilter === "current"
                ? expense.status !== "archived"
                : expense.status === statusFilter)
            return (
              statusMatches &&
              (!category || expense.category === category) &&
              (!scheduleType || expense.scheduleType === scheduleType) &&
              (!query || String(expense.name).toLowerCase().includes(query))
            )
          })
          const offset = (page - 1) * pageSize
          body = {
            expenses: filtered.slice(offset, offset + pageSize),
            page,
            pageSize,
            total: filtered.length,
          }
        }
      } else if (url.includes("/api/revenue-sources/summary")) {
        const active = revenueSources.filter(
          (source) => source.status === "active"
        )
        const requestUrl = new URL(url, "https://trackfi.test")
        const months = Number(requestUrl.searchParams.get("months") ?? "6")
        const asOf = requestUrl.searchParams.get("asOf") ?? "2026-08-12"
        const monthlyEquivalentMinor = active.reduce(
          (total, source) => total + Number(source.monthlyEquivalentMinor ?? 0),
          0
        )
        body = {
          summary: {
            currency,
            activeCount: active.length,
            pausedCount: revenueSources.filter(
              (source) => source.status === "paused"
            ).length,
            variableCount: active.filter(
              (source) => source.scheduleType === "variable"
            ).length,
            activeCategoryCount: active.length ? 1 : 0,
            monthlyEquivalentMinor,
            annualEquivalentMinor: active.reduce(
              (total, source) =>
                total + Number(source.annualEquivalentMinor ?? 0),
              0
            ),
            upcomingCount: active.filter((source) => source.nextPaymentDate)
              .length,
            upcomingTotalMinor: active.reduce(
              (total, source) =>
                total +
                (source.nextPaymentDate ? Number(source.amountMinor) : 0),
              0
            ),
            sourceBreakdown: active.map((source) => ({
              sourceId: source.id,
              name: source.name,
              category: source.category,
              monthlyEquivalentMinor: source.monthlyEquivalentMinor,
            })),
            upcoming: [],
            forecast: {
              months,
              totalMinor: monthlyEquivalentMinor * months,
              previousMonthMinor: monthlyEquivalentMinor,
              series: Array.from({ length: months }, (_, index) => ({
                month: addMockMonths(asOf.slice(0, 7), index),
                amountMinor: monthlyEquivalentMinor,
              })),
            },
            upcomingIncome: active.map((source) => ({
              id: `${source.id}:upcoming`,
              sourceId: source.id,
              name: source.name,
              category: source.category,
              amountMinor: source.amountMinor,
              scheduleType: source.scheduleType,
              cadence: source.cadence,
              expectedDate: source.nextPaymentDate ?? null,
            })),
          },
        }
      } else if (url.includes("/api/revenue-sources")) {
        body = {
          revenueSources,
          page: 1,
          pageSize: 3,
          total: revenueSources.length,
        }
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

export function revenueSourceFixture() {
  return {
    id: "revenue-source-id",
    name: "Primary job",
    amountMinor: 300000,
    scheduleType: "scheduled",
    cadence: "monthly",
    paymentAnchor: "2026-08-25",
    nextPaymentDate: "2026-08-25",
    category: "salary",
    notes: "Net salary",
    status: "active",
    monthlyEquivalentMinor: 300000,
    annualEquivalentMinor: 3600000,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}

export function expenseFixture() {
  return {
    id: "expense-id",
    name: "Rent",
    amountMinor: 120000,
    scheduleType: "scheduled",
    cadence: "monthly",
    expenseAnchor: "2026-08-15",
    nextExpenseDate: "2026-08-15",
    category: "housing",
    notes: "Apartment",
    status: "active",
    monthlyEquivalentMinor: 120000,
    annualEquivalentMinor: 1440000,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
  }
}

function addMockMonths(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(Date.UTC(year!, monthNumber! - 1 + offset, 1))
    .toISOString()
    .slice(0, 7)
}
