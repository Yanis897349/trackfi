import { env, exports } from "cloudflare:workers"

import { createAuth } from "../../src/auth"
import type { Bindings } from "../../src/types"

export function joinWaitlist(
  email: string,
  clientIp: string = crypto.randomUUID()
) {
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

export function joinWaitlistWithLocale(
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

export function validateInvitation(token: string) {
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

export function signUp({
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

export async function createAdminSession() {
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

export async function createUserSession() {
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

export function userApi(
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

export function userMultipartApi(
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

export function adminMutation(path: string, cookie: string) {
  return exports.default.fetch(
    new Request(`https://trackfi.test${path}`, {
      method: "POST",
      headers: { Cookie: cookie, Origin: "http://localhost:5173" },
    })
  )
}

export async function invitationHash(entryId: string) {
  const row = await env.DB.prepare(
    "SELECT invite_token_hash FROM waitlist_entries WHERE id = ?"
  )
    .bind(entryId)
    .first<{ invite_token_hash: string | null }>()
  return row?.invite_token_hash ?? null
}

export function preflight(origin: string) {
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
