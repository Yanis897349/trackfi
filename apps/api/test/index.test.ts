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
import revenueSourcesMigration from "../migrations/20260812120000_create_revenue_sources.sql?raw"
import oneTimeRevenueMigration from "../migrations/20260812130000_add_one_time_revenue_cadence.sql?raw"
import expensesMigration from "../migrations/20260812140000_create_expenses.sql?raw"
import expenseTransactionsMigration from "../migrations/20260812150000_create_expense_transactions.sql?raw"
import localesMigration from "../migrations/20260813100000_add_locales.sql?raw"
import { createAuth } from "../src/auth"
import {
  sendInvitation,
  sendPasswordReset,
  sendVerificationEmail,
  sendWaitlistConfirmation,
} from "../src/email"
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
  revenueSourcesMigration,
  oneTimeRevenueMigration,
  expensesMigration,
  expenseTransactionsMigration,
  localesMigration,
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

  it("persists explicit and negotiated waitlist locales and updates duplicates", async () => {
    await joinWaitlistWithLocale("french@example.com", {
      acceptLanguage: "fr-FR,fr;q=0.9,en;q=0.8",
    })
    await joinWaitlistWithLocale("french@example.com", { locale: "en" })

    const entry = await env.DB.prepare(
      "SELECT locale FROM waitlist_entries WHERE email = ?"
    )
      .bind("french@example.com")
      .first<{ locale: string }>()
    expect(entry?.locale).toBe("en")

    await joinWaitlistWithLocale("negotiated@example.com", {
      acceptLanguage: "fr-CA,fr;q=0.8",
    })
    const negotiated = await env.DB.prepare(
      "SELECT locale FROM waitlist_entries WHERE email = ?"
    )
      .bind("negotiated@example.com")
      .first<{ locale: string }>()
    expect(negotiated?.locale).toBe("fr")
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

  it("persists locale on Better Auth users", async () => {
    await env.DB.prepare(
      "UPDATE feature_flags SET enabled = 0 WHERE key = 'waitlist_mode'"
    ).run()
    const auth = createAuth(env as unknown as Bindings)
    const email = `french-${crypto.randomUUID()}@example.com`
    await auth.api.signUpEmail({
      body: {
        name: "Utilisateur Trackfi",
        email,
        password: "correct-horse-battery-staple",
        locale: "fr",
      } as never,
      headers: new Headers({ Origin: "http://localhost:5173" }),
    })

    const user = await env.DB.prepare(
      'SELECT locale FROM "user" WHERE email = ?'
    )
      .bind(email)
      .first<{ locale: string }>()
    expect(user?.locale).toBe("fr")
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

  it("localizes every transactional email and callback URL", async () => {
    const payloads: Array<Record<string, unknown>> = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        payloads.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
        return Response.json({ id: "email-id" })
      })
    )

    const emailEnv = {
      ...(env as unknown as Bindings),
      RESEND_API_KEY: "re_test",
    }
    const cases = [
      {
        locale: "en" as const,
        subjects: [
          "You’re on the Trackfi waitlist",
          "Your Trackfi invitation is ready",
          "Verify your Trackfi email",
          "Reset your Trackfi password",
        ],
      },
      {
        locale: "fr" as const,
        subjects: [
          "Vous êtes sur la liste d’attente Trackfi",
          "Votre invitation Trackfi est prête",
          "Vérifiez votre adresse e-mail Trackfi",
          "Réinitialisez votre mot de passe Trackfi",
        ],
      },
    ]

    for (const { locale } of cases) {
      await sendWaitlistConfirmation(
        emailEnv,
        `${locale}-waitlist@example.com`,
        locale
      )
      await sendInvitation(
        emailEnv,
        `${locale}-invite@example.com`,
        locale.repeat(32),
        locale
      )
      await sendVerificationEmail(
        emailEnv,
        `${locale}-verify@example.com`,
        `https://trackfi.test/${locale}/verify`,
        locale
      )
      await sendPasswordReset(
        emailEnv,
        `${locale}-reset@example.com`,
        `https://trackfi.test/${locale}/reset-password`,
        locale
      )
    }

    for (const [caseIndex, { locale, subjects }] of cases.entries()) {
      const localePayloads = payloads.slice(caseIndex * 4, caseIndex * 4 + 4)
      expect(localePayloads.map((payload) => payload.subject)).toEqual(subjects)
      for (const payload of localePayloads) {
        expect(payload.html).toContain(`<html lang="${locale}">`)
      }
      expect(localePayloads[1]?.html).toContain(`/${locale}/register?invite=`)
      expect(localePayloads[2]?.text).toContain(`/${locale}/verify`)
      expect(localePayloads[3]?.text).toContain(`/${locale}/reset-password`)
    }
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

  it("manages revenue forecasts, variable estimates, and user isolation", async () => {
    const cookie = await createUserSession()
    expect(
      (
        await userApi("/api/revenue-sources", cookie, {
          method: "POST",
          body: revenueBody(),
        })
      ).status
    ).toBe(409)
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })

    const scheduled = await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody(),
    })
    expect(scheduled.status).toBe(201)
    const scheduledBody = await scheduled.json<{
      revenueSource: { id: string; nextPaymentDate: string }
    }>()
    expect(scheduledBody.revenueSource.nextPaymentDate).toBeTruthy()

    const variable = await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody({
        name: "Design clients",
        amountMinor: 50_000,
        scheduleType: "variable",
        cadence: null,
        paymentAnchor: null,
        category: "freelance",
      }),
    })
    expect(variable.status).toBe(201)
    expect(
      (
        await userApi("/api/revenue-sources", cookie, {
          method: "POST",
          body: revenueBody({ scheduleType: "variable" }),
        })
      ).status
    ).toBe(400)

    await expect(
      (
        await userApi("/api/revenue-sources/summary?asOf=2024-01-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      summary: {
        currency: "EUR",
        activeCount: 2,
        variableCount: 1,
        monthlyEquivalentMinor: 266_667,
        annualEquivalentMinor: 3_200_000,
        upcomingCount: 3,
        upcomingTotalMinor: 300_000,
        forecast: {
          months: 6,
          totalMinor: 1_600_000,
          previousMonthMinor: 50_000,
          series: [
            { month: "2024-01", amountMinor: 350_000 },
            { month: "2024-02", amountMinor: 250_000 },
            { month: "2024-03", amountMinor: 250_000 },
            { month: "2024-04", amountMinor: 250_000 },
            { month: "2024-05", amountMinor: 250_000 },
            { month: "2024-06", amountMinor: 250_000 },
          ],
        },
        sourceBreakdown: [
          { name: "Primary job", monthlyEquivalentMinor: 216_667 },
          { name: "Design clients", monthlyEquivalentMinor: 50_000 },
        ],
        upcomingIncome: [
          {
            name: "Primary job",
            scheduleType: "scheduled",
            expectedDate: "2024-01-01",
          },
          {
            name: "Design clients",
            scheduleType: "variable",
            expectedDate: null,
          },
        ],
      },
    })
    expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2024-01-01&months=5",
          cookie
        )
      ).status
    ).toBe(400)
    await expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2024-01-01&months=3",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      summary: {
        forecast: {
          months: 3,
          totalMinor: 850_000,
          series: [
            { month: "2024-01", amountMinor: 350_000 },
            { month: "2024-02", amountMinor: 250_000 },
            { month: "2024-03", amountMinor: 250_000 },
          ],
        },
      },
    })
    await expect(
      (
        await userApi(
          "/api/revenue-sources?scheduleType=variable&category=freelance&asOf=2024-01-01",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      total: 1,
      revenueSources: [
        {
          name: "Design clients",
          cadence: null,
          paymentAnchor: null,
          nextPaymentDate: null,
        },
      ],
    })

    const otherCookie = await createUserSession()
    await expect(
      (await userApi("/api/revenue-sources", otherCookie)).json()
    ).resolves.toMatchObject({ total: 0, revenueSources: [] })
    expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}`,
          otherCookie,
          { method: "PATCH", body: { status: "archived" } }
        )
      ).status
    ).toBe(404)

    await expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}`,
          cookie,
          { method: "PATCH", body: { status: "paused" } }
        )
      ).json()
    ).resolves.toMatchObject({ revenueSource: { status: "paused" } })
    const conflict = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY" },
    })
    await expect(conflict.json()).resolves.toMatchObject({
      error: "currency_change_requires_confirmation",
      revenueSourceCount: 2,
    })
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY", confirmRelabel: true },
    })
    await expect(
      (
        await userApi("/api/revenue-sources?status=all&asOf=2024-01-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      revenueSources: expect.arrayContaining([
        expect.objectContaining({ name: "Primary job", amountMinor: 1000 }),
        expect.objectContaining({ name: "Design clients", amountMinor: 500 }),
      ]),
    })
    expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          `/api/revenue-sources/${scheduledBody.revenueSource.id}?confirm=true`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(204)
  })

  it("forecasts one-time revenue exactly once", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })

    const created = await userApi("/api/revenue-sources", cookie, {
      method: "POST",
      body: revenueBody({
        name: "Signing bonus",
        amountMinor: 120_000,
        cadence: "once",
        paymentAnchor: "2099-02-10",
      }),
    })
    expect(created.status).toBe(201)
    await expect(created.json()).resolves.toMatchObject({
      revenueSource: {
        cadence: "once",
        nextPaymentDate: "2099-02-10",
        annualEquivalentMinor: 120_000,
        monthlyEquivalentMinor: 10_000,
      },
    })

    await expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2099-01-20&months=3",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      summary: {
        activeCount: 1,
        upcomingCount: 1,
        upcomingTotalMinor: 120_000,
        forecast: {
          totalMinor: 120_000,
          previousMonthMinor: 0,
          series: [
            { month: "2099-01", amountMinor: 0 },
            { month: "2099-02", amountMinor: 120_000 },
            { month: "2099-03", amountMinor: 0 },
          ],
        },
        upcomingIncome: [
          {
            name: "Signing bonus",
            cadence: "once",
            expectedDate: "2099-02-10",
          },
        ],
      },
    })

    await expect(
      (
        await userApi(
          "/api/revenue-sources?status=active&asOf=2099-03-01",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      revenueSources: [
        {
          name: "Signing bonus",
          nextPaymentDate: null,
          annualEquivalentMinor: 0,
          monthlyEquivalentMinor: 0,
        },
      ],
    })
    await expect(
      (
        await userApi(
          "/api/revenue-sources/summary?asOf=2099-03-01&months=3",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      summary: {
        activeCount: 1,
        annualEquivalentMinor: 0,
        sourceBreakdown: [],
        upcomingIncome: [],
        forecast: { totalMinor: 0 },
      },
    })
  })

  it("manages expense transactions, budgets, receipts, and user isolation", async () => {
    const cookie = await createUserSession()
    expect(
      (
        await userApi("/api/expenses", cookie, {
          method: "POST",
          body: expenseBody(),
        })
      ).status
    ).toBe(409)
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const savedExpenseSettings = await userApi(
      "/api/expenses/settings",
      cookie,
      {
        method: "PATCH",
        body: {
          monthlyBudgetMinor: 300_000,
          dailyTargetMinor: 10_000,
          budgetPeriod: "monthly",
          resetDay: 15,
          rolloverEnabled: true,
          approachingThreshold: 80,
          limitThreshold: 100,
        },
      }
    )
    expect(savedExpenseSettings.status).toBe(200)
    const rent = await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody(),
    })
    expect(rent.status).toBe(201)
    const rentBody = await rent.json<{
      expense: { id: string; status: string }
    }>()
    expect(rentBody.expense).toMatchObject({
      status: "approved",
    })
    const coffee = await userMultipartApi("/api/expenses", cookie, {
      payload: expenseBody({
        merchant: "Coffee",
        amountMinor: 5_000,
        transactionDate: "2024-01-20",
        category: "food",
        status: "pending",
      }),
      receipt: new File(["%PDF-1.7\nreceipt"], "收据-📄.pdf", {
        type: "application/pdf",
      }),
    })
    expect(coffee.status).toBe(201)
    const coffeeBody = await coffee.json<{
      expense: { id: string; receipt: { name: string } }
    }>()
    expect(coffeeBody.expense.receipt.name).toBe("收据-📄.pdf")
    await userApi("/api/expenses", cookie, {
      method: "POST",
      body: expenseBody({
        merchant: "Declined purchase",
        amountMinor: 50_000,
        status: "declined",
      }),
    })
    expect(
      (
        await userApi("/api/expenses", cookie, {
          method: "POST",
          body: expenseBody({ status: "unknown" }),
        })
      ).status
    ).toBe(400)

    await expect(
      (await userApi("/api/expenses/summary?asOf=2024-01-20", cookie)).json()
    ).resolves.toMatchObject({
      summary: {
        currency: "EUR",
        period: {
          start: "2024-01-15",
          end: "2024-02-14",
          elapsedDays: 6,
          totalDays: 31,
        },
        spentMinor: 105_000,
        pendingCount: 1,
        missingReceiptCount: 1,
        categoryBreakdown: expect.arrayContaining([
          { category: "housing", totalMinor: 100_000 },
          { category: "food", totalMinor: 5_000 },
        ]),
      },
    })
    await expect(
      (
        await userApi(
          "/api/expenses?status=pending&category=food&missingReceipt=false",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      total: 1,
      expenses: [{ merchant: "Coffee", status: "pending" }],
    })
    await expect(
      (
        await userApi(
          "/api/expenses?from=2024-01-15&to=2024-02-14&missingReceipt=true",
          cookie
        )
      ).json()
    ).resolves.toMatchObject({
      total: 1,
      expenses: [{ merchant: "Rent", status: "approved" }],
    })

    const otherCookie = await createUserSession()
    await expect(
      (await userApi("/api/expenses", otherCookie)).json()
    ).resolves.toMatchObject({ total: 0, expenses: [] })
    expect(
      (
        await userApi(`/api/expenses/${rentBody.expense.id}`, otherCookie, {
          method: "PATCH",
          body: { status: "declined" },
        })
      ).status
    ).toBe(404)
    expect(
      (
        await userApi(
          `/api/expenses/${coffeeBody.expense.id}/receipt`,
          otherCookie
        )
      ).status
    ).toBe(404)
    const receipt = await userApi(
      `/api/expenses/${coffeeBody.expense.id}/receipt`,
      cookie
    )
    expect(receipt.status).toBe(200)
    expect(receipt.headers.get("content-type")).toContain("application/pdf")
    expect(receipt.headers.get("content-disposition")).toContain(
      "filename*=UTF-8''%E6%94%B6%E6%8D%AE-%F0%9F%93%84.pdf"
    )
    await expect(
      (
        await userApi(`/api/expenses/${rentBody.expense.id}`, cookie, {
          method: "PATCH",
          body: { status: "pending", reimbursable: true },
        })
      ).json()
    ).resolves.toMatchObject({
      expense: { status: "pending", reimbursable: true },
    })
    await expect(
      (
        await userApi(`/api/expenses/${coffeeBody.expense.id}`, cookie, {
          method: "PATCH",
          body: { removeReceipt: true },
        })
      ).json()
    ).resolves.toMatchObject({ expense: { receipt: null } })
    const conflict = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY" },
    })
    await expect(conflict.json()).resolves.toMatchObject({ expenseCount: 3 })
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "JPY", confirmRelabel: true },
    })
    await expect(
      (await userApi("/api/expenses", cookie)).json()
    ).resolves.toMatchObject({
      expenses: expect.arrayContaining([
        expect.objectContaining({ merchant: "Rent", amountMinor: 1000 }),
        expect.objectContaining({ merchant: "Coffee", amountMinor: 50 }),
      ]),
    })
    await expect(
      (await userApi("/api/expenses/settings", cookie)).json()
    ).resolves.toMatchObject({
      settings: { monthlyBudgetMinor: 3000, dailyTargetMinor: 100 },
    })
    expect(
      (
        await userApi(`/api/expenses/${rentBody.expense.id}`, cookie, {
          method: "DELETE",
        })
      ).status
    ).toBe(400)
    expect(
      (
        await userApi(
          `/api/expenses/${rentBody.expense.id}?confirm=true`,
          cookie,
          { method: "DELETE" }
        )
      ).status
    ).toBe(204)
  })

  it("preserves subscription metadata when archiving and restoring", async () => {
    const cookie = await createUserSession()
    await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR" },
    })
    const created = await userApi("/api/subscriptions", cookie, {
      method: "POST",
      body: subscriptionBody(),
    })
    const id = (await created.json<{ subscription: { id: string } }>())
      .subscription.id

    const archived = await userApi(`/api/subscriptions/${id}`, cookie, {
      method: "PATCH",
      body: { status: "archived" },
    })
    await expect(archived.json()).resolves.toMatchObject({
      subscription: {
        status: "archived",
        websiteUrl: "https://example.com",
        notes: "Team plan",
      },
    })
    await expect(
      (await userApi("/api/subscriptions?status=archived", cookie)).json()
    ).resolves.toMatchObject({
      subscriptions: [
        {
          id,
          websiteUrl: "https://example.com",
          notes: "Team plan",
        },
      ],
    })

    const restored = await userApi(`/api/subscriptions/${id}`, cookie, {
      method: "PATCH",
      body: { status: "active" },
    })
    await expect(restored.json()).resolves.toMatchObject({
      subscription: {
        status: "active",
        websiteUrl: "https://example.com",
        notes: "Team plan",
      },
    })
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

    await expect(
      (
        await userApi("/api/subscriptions/summary?asOf=2024-09-01", cookie)
      ).json()
    ).resolves.toMatchObject({
      summary: {
        upcomingCount: 1,
        upcomingTotalMinor: 2000,
      },
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
    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 86_400_000).toISOString()
    await env.DB.prepare(
      `UPDATE subscription_spend_snapshots SET recorded_at = ?
      WHERE user_id = ?`
    )
      .bind(daysAgo(60), user!.user_id)
      .run()
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO subscription_spend_snapshots
        (id, user_id, currency, monthly_equivalent_minor, recorded_at)
      VALUES (?, ?, 'EUR', 500, ?)`
      ).bind(crypto.randomUUID(), user!.user_id, daysAgo(45)),
      env.DB.prepare(
        `INSERT INTO subscription_spend_snapshots
        (id, user_id, currency, monthly_equivalent_minor, recorded_at)
      VALUES (?, ?, 'JPY', 50, ?)`
      ).bind(crypto.randomUUID(), user!.user_id, daysAgo(90)),
    ])

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

function joinWaitlistWithLocale(
  email: string,
  options: { acceptLanguage?: string; locale?: "en" | "fr" }
) {
  return exports.default.fetch(
    new Request("https://trackfi.test/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Turnstile-Token": "test-token",
        "CF-Connecting-IP": crypto.randomUUID(),
        ...(options.acceptLanguage
          ? { "Accept-Language": options.acceptLanguage }
          : {}),
      },
      body: JSON.stringify({ email, locale: options.locale }),
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

function revenueBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Primary job",
    amountMinor: 100_000,
    scheduleType: "scheduled",
    cadence: "biweekly",
    paymentAnchor: "2024-01-01",
    category: "salary",
    notes: "Net pay",
    ...overrides,
  }
}

function expenseBody(overrides: Record<string, unknown> = {}) {
  return {
    merchant: "Rent",
    amountMinor: 100_000,
    transactionDate: "2024-01-20",
    category: "housing",
    status: "approved",
    reimbursable: false,
    notes: "Apartment",
    ...overrides,
  }
}

function userMultipartApi(
  path: string,
  cookie: string,
  data: { payload: unknown; receipt?: File }
) {
  const form = new FormData()
  form.set("payload", JSON.stringify(data.payload))
  if (data.receipt) form.set("receipt", data.receipt)
  return exports.default.fetch(
    new Request(`https://trackfi.test${path}`, {
      method: "POST",
      headers: { Cookie: cookie, Origin: "http://localhost:5173" },
      body: form,
    })
  )
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
