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
