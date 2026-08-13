import { env, exports } from "cloudflare:workers"
import { describe, expect, it, vi } from "vitest"

import { sha256 } from "../../src/security"
import {
  joinWaitlist,
  joinWaitlistWithLocale,
  signUp,
  validateInvitation,
} from "../support/requests"

import "../support/setup"

describe("public API, waitlist, and invitations", () => {
  it.each(["/", "/health"])("reports its health at %s", async (path) => {
    const response = await exports.default.fetch(
      new Request(`https://trackfi.test${path}`)
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

  it("returns 404 for unknown routes", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/unknown")
    )
    expect(response.status).toBe(404)
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
})
