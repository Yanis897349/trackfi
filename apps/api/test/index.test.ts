import { env, exports } from "cloudflare:workers"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import accountsMigration from "../migrations/20260811140200_create_accounts.sql?raw"
import featureFlagsMigration from "../migrations/20260811140500_create_feature_flags.sql?raw"
import rateLimitsMigration from "../migrations/20260811140400_create_rate_limits.sql?raw"
import sessionsMigration from "../migrations/20260811140100_create_sessions.sql?raw"
import usersMigration from "../migrations/20260811140000_create_users.sql?raw"
import verificationsMigration from "../migrations/20260811140300_create_verifications.sql?raw"
import waitlistMigration from "../migrations/20260811140600_create_waitlist_entries.sql?raw"
import userSettingsMigration from "../migrations/20260811140700_create_user_settings.sql?raw"
import subscriptionsMigration from "../migrations/20260811140800_create_subscriptions.sql?raw"
import subscriptionSnapshotsMigration from "../migrations/20260811140900_create_subscription_spend_snapshots.sql?raw"
import { createAuth } from "../src/auth"
import { sendInvitation } from "../src/email"
import { sha256 } from "../src/security"
import type { Bindings } from "../src/types"

const migrationQueries = [
  usersMigration,
  sessionsMigration,
  accountsMigration,
  verificationsMigration,
  rateLimitsMigration,
  featureFlagsMigration,
  waitlistMigration,
  userSettingsMigration,
  subscriptionsMigration,
  subscriptionSnapshotsMigration,
].flatMap((sql) =>
  sql
    .split(";")
    .map((query) => query.trim())
    .filter(Boolean)
)

beforeAll(async () => {
  await env.DB.batch(migrationQueries.map((query) => env.DB.prepare(query)))
})

beforeEach(async () => {
  await env.DB.prepare(
    "UPDATE feature_flags SET enabled = 1 WHERE key = 'waitlist_mode'"
  ).run()
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("challenges.cloudflare.com/turnstile")) {
        return Response.json({ success: true })
      }
      throw new Error(`Unexpected outbound request: ${url}`)
    })
  )
})

afterEach(() => vi.unstubAllGlobals())

describe("Trackfi API", () => {
  it("reports its health", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/health")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "trackfi-api",
    })
  })

  it("starts with waitlist mode enabled", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/api/config")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ waitlistMode: true })
  })

  it("normalizes and deduplicates waitlist emails", async () => {
    const first = await joinWaitlist("  Person@Example.com ")
    const duplicate = await joinWaitlist("person@example.com")

    expect(first.status).toBe(202)
    expect(duplicate.status).toBe(202)
    const result = await env.DB.prepare(
      "SELECT email, status FROM waitlist_entries WHERE email = ?"
    )
      .bind("person@example.com")
      .all<{ email: string; status: string }>()
    expect(result.results).toEqual([
      { email: "person@example.com", status: "pending" },
    ])
  })

  it("validates usable invitations without storing their raw token", async () => {
    const token = "a".repeat(64)
    const tokenHash = await sha256(token)
    await env.DB.prepare(
      `INSERT INTO waitlist_entries
        (id, email, status, created_at, approved_at, invite_token_hash,
          invite_expires_at, invite_delivery_status)
      VALUES (?, ?, 'approved', ?, ?, ?, ?, 'sent')`
    )
      .bind(
        crypto.randomUUID(),
        "invited@example.com",
        new Date().toISOString(),
        new Date().toISOString(),
        tokenHash,
        new Date(Date.now() + 86_400_000).toISOString()
      )
      .run()

    const response = await exports.default.fetch(
      new Request("https://trackfi.test/api/invitations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      valid: true,
      email: "invited@example.com",
    })
    const stored = await env.DB.prepare(
      "SELECT invite_token_hash FROM waitlist_entries WHERE email = ?"
    )
      .bind("invited@example.com")
      .first<{ invite_token_hash: string }>()
    expect(stored?.invite_token_hash).toBe(tokenHash)
    expect(stored?.invite_token_hash).not.toBe(token)
  })

  it("rejects expired and consumed invitations", async () => {
    const expiredToken = "b".repeat(64)
    const consumedToken = "c".repeat(64)
    const now = new Date().toISOString()
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO waitlist_entries
          (id, email, status, created_at, approved_at, invite_token_hash,
            invite_expires_at, invite_delivery_status)
        VALUES (?, ?, 'approved', ?, ?, ?, ?, 'sent')`
      ).bind(
        crypto.randomUUID(),
        "expired@example.com",
        now,
        now,
        await sha256(expiredToken),
        new Date(Date.now() - 1_000).toISOString()
      ),
      env.DB.prepare(
        `INSERT INTO waitlist_entries
          (id, email, status, created_at, approved_at, invite_token_hash,
            invite_expires_at, invite_delivery_status, registered_at)
        VALUES (?, ?, 'registered', ?, ?, ?, ?, 'sent', ?)`
      ).bind(
        crypto.randomUUID(),
        "consumed@example.com",
        now,
        now,
        await sha256(consumedToken),
        new Date(Date.now() + 86_400_000).toISOString(),
        now
      ),
    ])

    for (const token of [expiredToken, consumedToken]) {
      const response = await validateInvitation(token)
      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ valid: false })
    }
  })

  it("fails closed when Turnstile rejects the submission", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: false }))
    )

    const response = await joinWaitlist("robot@example.com")

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "turnstile_failed",
    })
  })

  it("limits anonymous attempts per client", async () => {
    const clientIp = "192.0.2.55"
    const responses = []
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await joinWaitlist(`limited-${attempt}@example.com`, clientIp)
      )
    }

    expect(
      responses.slice(0, 5).every((response) => response.status === 202)
    ).toBe(true)
    expect(responses[5]?.status).toBe(429)
  })

  it("requires and consumes an invitation while waitlist mode is enabled", async () => {
    const token = "d".repeat(64)
    const email = "gated-user@example.com"
    const entryId = crypto.randomUUID()
    const now = new Date().toISOString()
    await env.DB.prepare(
      `INSERT INTO waitlist_entries
        (id, email, status, created_at, approved_at, invite_token_hash,
          invite_expires_at, invite_delivery_status)
      VALUES (?, ?, 'approved', ?, ?, ?, ?, 'sent')`
    )
      .bind(
        entryId,
        email,
        now,
        now,
        await sha256(token),
        new Date(Date.now() + 86_400_000).toISOString()
      )
      .run()

    const missingInvitation = await signUp({
      email: "not-invited@example.com",
    })
    expect(missingInvitation.status).toBe(403)

    const response = await signUp({ email, inviteToken: token })
    expect(response.status).toBe(200)
    const entry = await env.DB.prepare(
      `SELECT status, invite_token_hash, registered_at
      FROM waitlist_entries WHERE id = ?`
    )
      .bind(entryId)
      .first<{
        invite_token_hash: string | null
        registered_at: string | null
        status: string
      }>()
    expect(entry?.status).toBe("registered")
    expect(entry?.invite_token_hash).toBeNull()
    expect(entry?.registered_at).not.toBeNull()
  })

  it("allows open registration through Better Auth and assigns a user role", async () => {
    await env.DB.prepare(
      "UPDATE feature_flags SET enabled = 0 WHERE key = 'waitlist_mode'"
    ).run()

    const response = await exports.default.fetch(
      new Request("https://trackfi.test/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          "X-Turnstile-Token": "test-token",
          "CF-Connecting-IP": "192.0.2.1",
        },
        body: JSON.stringify({
          name: "Trackfi User",
          email: "new-user@example.com",
          password: "correct-horse-battery-staple",
          callbackURL: "/dashboard",
        }),
      })
    )

    expect(response.status).toBe(200)
    const user = await env.DB.prepare(
      'SELECT email, role FROM "user" WHERE email = ?'
    )
      .bind("new-user@example.com")
      .first<{ email: string; role: string }>()
    expect(user).toEqual({ email: "new-user@example.com", role: "user" })
  })

  it("bootstraps configured admin emails without accepting a role input", async () => {
    const auth = createAuth({
      ...(env as unknown as Bindings),
      ADMIN_EMAILS: "admin@example.com",
    })
    await auth.api.signUpEmail({
      body: {
        name: "Admin User",
        email: "admin@example.com",
        password: "correct-horse-battery-staple",
        role: "user",
      } as {
        email: string
        name: string
        password: string
      },
      headers: new Headers({ Origin: "http://localhost:5173" }),
    })

    const admin = await env.DB.prepare(
      'SELECT role FROM "user" WHERE email = ?'
    )
      .bind("admin@example.com")
      .first<{ role: string }>()
    expect(admin?.role).toBe("admin")
  })

  it("keeps approval idempotent and rotates only on resend", async () => {
    const cookie = await createAdminSession()
    const entryId = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO waitlist_entries (id, email, status, created_at)
      VALUES (?, ?, 'pending', ?)`
    )
      .bind(entryId, "approval@example.com", new Date().toISOString())
      .run()

    const first = await adminMutation(
      `/api/admin/waitlist/${entryId}/approve`,
      cookie
    )
    expect(first.status).toBe(200)
    const firstHash = await invitationHash(entryId)
    expect(firstHash).toHaveLength(64)

    const repeated = await adminMutation(
      `/api/admin/waitlist/${entryId}/approve`,
      cookie
    )
    expect(repeated.status).toBe(200)
    await expect(repeated.json()).resolves.toMatchObject({
      alreadyApproved: true,
    })
    expect(await invitationHash(entryId)).toBe(firstHash)

    const resent = await adminMutation(
      `/api/admin/waitlist/${entryId}/resend-invite`,
      cookie
    )
    expect(resent.status).toBe(200)
    expect(await invitationHash(entryId)).not.toBe(firstHash)
  })

  it("rejects cookie-authenticated mutations from an untrusted origin", async () => {
    const response = await exports.default.fetch(
      new Request(
        "https://trackfi.test/api/admin/feature-flags/waitlist_mode",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://malicious.example",
          },
          body: JSON.stringify({ enabled: false }),
        }
      )
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "invalid_origin" })
  })

  it("allows CORS only for the configured application origin", async () => {
    const trusted = await preflight("http://localhost:5173")
    const untrusted = await preflight("https://malicious.example")

    expect(trusted.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:5173"
    )
    expect(trusted.headers.get("access-control-allow-credentials")).toBe("true")
    expect(untrusted.headers.get("access-control-allow-origin")).toBeNull()
  })

  it("surfaces Resend delivery failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 }))
    )

    await expect(
      sendInvitation(
        {
          ...(env as unknown as Bindings),
          RESEND_API_KEY: "re_test",
        },
        "delivery@example.com",
        "e".repeat(64)
      )
    ).rejects.toThrow("status 503")
  })

  it("rejects admin endpoints without a session", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/api/admin/feature-flags")
    )
    expect(response.status).toBe(401)
  })

  it("manages user-scoped subscriptions and calculates recurring insights", async () => {
    const cookie = await createUserSession()
    const missingCurrency = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    expect(missingCurrency.status).toBe(409)
    await expect(missingCurrency.json()).resolves.toEqual({
      error: "currency_required",
    })

    const savedSettings = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    expect(savedSettings.status).toBe(200)

    const created = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    expect(created.status).toBe(201)
    const createdBody = await created.json<{
      subscription: { id: string; status: string }
    }>()
    expect(createdBody.subscription.status).toBe("active")
    const subscriptionOwner = await env.DB.prepare(
      "SELECT user_id FROM subscriptions WHERE id = ?"
    )
      .bind(createdBody.subscription.id)
      .first<{ user_id: string }>()

    const summary = await userApi(
      "/api/subscriptions/summary?asOf=2024-02-01",
      cookie
    )
    await expect(summary.json()).resolves.toMatchObject({
      summary: {
        currency: "EUR",
        activeCount: 1,
        monthlyEquivalentMinor: 1000,
        annualEquivalentMinor: 12000,
        upcomingCount: 1,
        upcoming: [{ nextRenewalDate: "2024-02-29" }],
        monthlyComparison: null,
      },
    })

    const snapshots = await env.DB.prepare(
      `SELECT monthly_equivalent_minor FROM subscription_spend_snapshots
      WHERE user_id = (SELECT user_id FROM subscriptions WHERE id = ?)
      ORDER BY recorded_at`
    )
      .bind(createdBody.subscription.id)
      .all<{ monthly_equivalent_minor: number }>()
    expect(
      snapshots.results.map((snapshot) => snapshot.monthly_equivalent_minor)
    ).toEqual([0, 1000])

    const paused = await userApi(
      `/api/subscriptions/${createdBody.subscription.id}`,
      cookie,
      { method: "PATCH", body: { status: "paused" } }
    )
    expect(paused.status).toBe(200)
    const pausedSummary = await userApi(
      "/api/subscriptions/summary?asOf=2024-02-01",
      cookie
    )
    await expect(pausedSummary.json()).resolves.toMatchObject({
      summary: { activeCount: 0, annualEquivalentMinor: 0 },
    })

    const currencyConflict = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "USD" },
    })
    expect(currencyConflict.status).toBe(409)
    await expect(currencyConflict.json()).resolves.toMatchObject({
      error: "currency_change_requires_confirmation",
      subscriptionCount: 1,
    })
    expect(
      (
        await userApi("/api/settings", cookie, {
          method: "PATCH",
          body: { currency: "JPY", confirmRelabel: true },
        })
      ).status
    ).toBe(200)
    await expect(
      (
        await userApi("/api/subscriptions?status=all&asOf=2024-02-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      subscriptions: [{ amountMinor: 10 }],
    })

    expect(
      (
        await userApi(
          `/api/subscriptions/${createdBody.subscription.id}`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          `/api/subscriptions/${createdBody.subscription.id}?confirm=true`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(204)

    const mutationSnapshots = await env.DB.prepare(
      `SELECT currency, monthly_equivalent_minor
      FROM subscription_spend_snapshots
      WHERE user_id = ?
      ORDER BY rowid`
    )
      .bind(subscriptionOwner!.user_id)
      .all<{ currency: string; monthly_equivalent_minor: number }>()
    expect(mutationSnapshots.results).toEqual([
      { currency: "EUR", monthly_equivalent_minor: 0 },
      { currency: "EUR", monthly_equivalent_minor: 1000 },
      { currency: "EUR", monthly_equivalent_minor: 0 },
      { currency: "JPY", monthly_equivalent_minor: 0 },
      { currency: "JPY", monthly_equivalent_minor: 0 },
    ])
  })

  it("keeps subscription records isolated between users", async () => {
    const ownerCookie = await createUserSession()
    const otherCookie = await createUserSession()
    await userApi("/api/settings", ownerCookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const created = await userApi("/api/subscriptions", ownerCookie, {
      method: "POST",
      body: subscriptionBody({ name: "Private service" }),
    })
    const id = (await created.json<{ subscription: { id: string } }>())
      .subscription.id

    const otherList = await userApi("/api/subscriptions", otherCookie)
    await expect(otherList.json()).resolves.toEqual({
      subscriptions: [],
      page: 1,
      pageSize: 25,
      total: 0,
    })
    expect(
      (
        await userApi(`/api/subscriptions/${id}`, otherCookie, {
          method: "PATCH",
          body: { status: "archived" },
        })
      ).status
    ).toBe(404)
  })

  it("validates subscription inputs and protects regular-user mutations", async () => {
    expect(
      (
        await exports.default.fetch(
          new Request("https://trackfi.test/api/settings")
        )
      ).status
    ).toBe(401)

    const cookie = await createUserSession()
    expect(
      (
        await userApi("/api/settings", cookie, {
          method: "PATCH",
          body: { currency: "ZZZ" },
        })
      ).status
    ).toBe(400)
    const untrusted = await exports.default.fetch(
      new Request("https://trackfi.test/api/settings", {
        method: "PATCH",
        headers: {
          Cookie: cookie,
          Origin: "https://malicious.example",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency: "EUR" }),
      })
    )
    expect(untrusted.status).toBe(403)

    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    expect(
      (
        await userApi("/api/subscriptions", cookie, {
          method: "POST",
          body: subscriptionBody({ websiteUrl: "javascript:alert(1)" }),
        })
      ).status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions/summary?asOf=not-a-date", cookie))
        .status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions?status=unknown", cookie)).status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions?cadence=daily", cookie)).status
    ).toBe(400)
    expect((await userApi("/api/subscriptions?page=0", cookie)).status).toBe(
      400
    )
    expect(
      (await userApi("/api/subscriptions/calendar?month=2024-13", cookie))
        .status
    ).toBe(400)
    expect(
      (await userApi("/api/subscriptions/calendar?month=0000-01", cookie))
        .status
    ).toBe(400)
  })

  it("paginates subscriptions and returns every renewal in a calendar grid", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody({
        name: "Weekly service",
        amountMinor: 500,
        cadence: "weekly",
        billingAnchor: "2024-08-31",
      }),
    })
    await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody({
        name: "Outside-month service",
        amountMinor: 1000,
        cadence: "monthly",
        billingAnchor: "2024-10-02",
        category: "finance",
      }),
    })

    await expect(
      (
        await userApi(
          "/api/subscriptions?status=active&cadence=weekly&page=1&pageSize=1&asOf=2024-09-01",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      page: 1,
      pageSize: 1,
      total: 1,
      subscriptions: [{ name: "Weekly service" }],
    })

    const response = await userApi(
      "/api/subscriptions/calendar?month=2024-09",
      cookie
    )
    const calendarBody = await response.json<{
      calendar: {
        renewals: Array<{ name: string; renewalDate: string }>
      }
    }>()
    expect(calendarBody).toMatchObject({
      calendar: {
        month: "2024-09",
        rangeStart: "2024-08-26",
        rangeEnd: "2024-10-06",
        renewalCount: 7,
        totalMinor: 4000,
        monthTotalMinor: 2000,
        categoryCount: 2,
      },
    })
    expect(calendarBody.calendar.renewals[0]).toMatchObject({
      name: "Weekly service",
      renewalDate: "2024-08-31",
    })
    expect(calendarBody.calendar.renewals).toContainEqual(
      expect.objectContaining({
        name: "Outside-month service",
        renewalDate: "2024-10-02",
      })
    )
  })

  it("compares commitment snapshots and resets history across currencies", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const created = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    const createdBody = await created.json<{
      subscription: { id: string }
    }>()
    const user = await env.DB.prepare(
      "SELECT user_id FROM subscriptions WHERE id = ?"
    )
      .bind(createdBody.subscription.id)
      .first<{ user_id: string }>()
    await env.DB.prepare(
      `INSERT INTO subscription_spend_snapshots
        (id, user_id, currency, monthly_equivalent_minor, recorded_at)
      VALUES (?, ?, 'EUR', 500, ?)`
    )
      .bind(
        crypto.randomUUID(),
        user!.user_id,
        new Date(Date.now() - 45 * 86_400_000).toISOString()
      )
      .run()

    await expect(
      (await userApi("/api/subscriptions/summary", cookie)).json()
    ).resolves.toMatchObject({
      summary: {
        monthlyEquivalentMinor: 1000,
        monthlyComparison: { previousMonthlyEquivalentMinor: 500 },
      },
    })

    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY", confirmRelabel: true },
    })
    await expect(
      (await userApi("/api/subscriptions/summary", cookie)).json()
    ).resolves.toMatchObject({
      summary: { monthlyComparison: null },
    })
  })

  it("returns 404 for unknown routes", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/unknown")
    )
    expect(response.status).toBe(404)
  })
})

function joinWaitlist(email: string, clientIp: string = crypto.randomUUID()) {
  return exports.default.fetch(
    new Request("https://trackfi.test/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Turnstile-Token": "test-token",
        "CF-Connecting-IP": clientIp,
      },
      body: JSON.stringify({ email }),
    })
  )
}

function validateInvitation(token: string) {
  return exports.default.fetch(
    new Request("https://trackfi.test/api/invitations/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CF-Connecting-IP": crypto.randomUUID(),
      },
      body: JSON.stringify({ token }),
    })
  )
}

function signUp({
  email,
  inviteToken,
}: {
  email: string
  inviteToken?: string
}) {
  return exports.default.fetch(
    new Request("https://trackfi.test/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        "X-Turnstile-Token": "test-token",
        "CF-Connecting-IP": crypto.randomUUID(),
        ...(inviteToken ? { "X-Invite-Token": inviteToken } : {}),
      },
      body: JSON.stringify({
        name: "Trackfi User",
        email,
        password: "correct-horse-battery-staple",
        callbackURL: "/dashboard",
      }),
    })
  )
}

async function createAdminSession() {
  const email = `admin-${crypto.randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"
  const auth = createAuth({
    ...(env as unknown as Bindings),
    ADMIN_EMAILS: email,
  })
  await auth.api.signUpEmail({
    body: { name: "Admin User", email, password },
    headers: new Headers({ Origin: "http://localhost:5173" }),
  })
  await env.DB.prepare('UPDATE "user" SET "emailVerified" = 1 WHERE email = ?')
    .bind(email)
    .run()
  const signedIn = await auth.api.signInEmail({
    body: { email, password },
    headers: new Headers({ Origin: "http://localhost:5173" }),
    returnHeaders: true,
  })
  const cookie = signedIn.headers.get("set-cookie")?.split(";")[0]
  if (!cookie) throw new Error("Admin sign-in did not set a session cookie")
  return cookie
}

async function createUserSession() {
  const email = `user-${crypto.randomUUID()}@example.com`
  const password = "correct-horse-battery-staple"
  const auth = createAuth(env as unknown as Bindings)
  await auth.api.signUpEmail({
    body: { name: "Subscription User", email, password },
    headers: new Headers({ Origin: "http://localhost:5173" }),
  })
  await env.DB.prepare('UPDATE "user" SET "emailVerified" = 1 WHERE email = ?')
    .bind(email)
    .run()
  const signedIn = await auth.api.signInEmail({
    body: { email, password },
    headers: new Headers({ Origin: "http://localhost:5173" }),
    returnHeaders: true,
  })
  const cookie = signedIn.headers.get("set-cookie")?.split(";")[0]
  if (!cookie) throw new Error("User sign-in did not set a session cookie")
  return cookie
}

function userApi(
  path: string,
  cookie: string,
  options?: { method?: string; body?: unknown }
) {
  return exports.default.fetch(
    new Request(`https://trackfi.test${path}`, {
      method: options?.method ?? "GET",
      headers: {
        Cookie: cookie,
        Origin: "http://localhost:5173",
        "Content-Type": "application/json",
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    })
  )
}

function subscriptionBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Design software",
    amountMinor: 1000,
    cadence: "monthly",
    billingAnchor: "2024-01-31",
    category: "software",
    websiteUrl: "https://example.com",
    notes: "Team plan",
    ...overrides,
  }
}

function adminMutation(path: string, cookie: string) {
  return exports.default.fetch(
    new Request(`https://trackfi.test${path}`, {
      method: "POST",
      headers: { Cookie: cookie, Origin: "http://localhost:5173" },
    })
  )
}

async function invitationHash(entryId: string) {
  const row = await env.DB.prepare(
    "SELECT invite_token_hash FROM waitlist_entries WHERE id = ?"
  )
    .bind(entryId)
    .first<{ invite_token_hash: string | null }>()
  return row?.invite_token_hash ?? null
}

function preflight(origin: string) {
  return exports.default.fetch(
    new Request("https://trackfi.test/api/config", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    })
  )
}
