import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { createUserSession, userApi } from "../support/requests"

import "../support/setup"

describe("settings", () => {
  it("saves locale and currency together while preserving currency-only callers", async () => {
    const cookie = await createUserSession()

    const initial = await (
      await userApi("/api/settings", cookie)
    ).json<{
      settings: { currency: string | null; locale: string }
    }>()
    expect(initial.settings).toMatchObject({ currency: null, locale: "en" })

    const updated = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "EUR", locale: "fr" },
    })
    expect(updated.status).toBe(200)
    expect(await updated.json()).toMatchObject({
      settings: { currency: "EUR", locale: "fr" },
    })

    const compatible = await userApi("/api/settings", cookie, {
      method: "PATCH",
      body: { currency: "USD" },
    })
    expect(compatible.status).toBe(200)
    expect(await compatible.json()).toMatchObject({
      settings: { currency: "USD", locale: "fr" },
    })
  })

  it("defaults budget emails on and validates persisted preference updates", async () => {
    const cookie = await createUserSession()

    expect(
      await (await userApi("/api/settings/notifications", cookie)).json()
    ).toEqual({
      preferences: { budgetAlertsEnabled: true, updatedAt: null },
    })

    const invalid = await userApi("/api/settings/notifications", cookie, {
      method: "PATCH",
      body: { budgetAlertsEnabled: "no" },
    })
    expect(invalid.status).toBe(400)

    const updated = await userApi("/api/settings/notifications", cookie, {
      method: "PATCH",
      body: { budgetAlertsEnabled: false },
    })
    expect(updated.status).toBe(200)
    expect(await updated.json()).toMatchObject({
      preferences: { budgetAlertsEnabled: false },
    })
  })

  it("enforces the settings password policy and starts verified email changes", async () => {
    const cookie = await createUserSession()
    const session = await (
      await userApi("/api/auth/get-session", cookie)
    ).json<{ user: { email: string; id: string } }>()

    const weakPassword = await userApi("/api/auth/change-password", cookie, {
      method: "POST",
      body: {
        currentPassword: "correct-horse-battery-staple",
        newPassword: "too-short",
        revokeOtherSessions: false,
      },
    })
    expect(weakPassword.status).toBe(400)
    expect(await weakPassword.json()).toEqual({ code: "PASSWORD_POLICY" })

    const changedPassword = await userApi("/api/auth/change-password", cookie, {
      method: "POST",
      body: {
        currentPassword: "correct-horse-battery-staple",
        newPassword: "new-password-12!",
        revokeOtherSessions: false,
      },
    })
    expect(changedPassword.status).toBe(200)

    const newEmail = `changed-${crypto.randomUUID()}@example.com`
    const changeEmail = await userApi("/api/auth/change-email", cookie, {
      method: "POST",
      body: {
        newEmail,
        callbackURL: "/dashboard/settings?tab=security",
      },
    })
    expect(changeEmail.status).toBe(200)
    expect(
      await env.DB.prepare('SELECT email FROM "user" WHERE id = ?')
        .bind(session.user.id)
        .first<{ email: string }>()
    ).toEqual({ email: session.user.email })
  })
})
