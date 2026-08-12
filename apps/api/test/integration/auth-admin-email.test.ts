import { env, exports } from "cloudflare:workers"
import { describe, expect, it, vi } from "vitest"

import { createAuth } from "../../src/auth"
import {
  sendInvitation,
  sendPasswordReset,
  sendVerificationEmail,
  sendWaitlistConfirmation,
} from "../../src/email"
import type { Bindings } from "../../src/types"
import {
  adminMutation,
  createAdminSession,
  invitationHash,
  preflight,
} from "../support/requests"

import "../support/setup"

describe("authentication, administration, and email", () => {
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

  it("rejects admin endpoints without a session", async () => {
    const response = await exports.default.fetch(
      new Request("https://trackfi.test/api/admin/feature-flags")
    )
    expect(response.status).toBe(401)
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
})
