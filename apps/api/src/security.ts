import type { Context } from "hono"

import { getAppOrigin, getTurnstileSecret } from "./config"
import type { AppVariables, Bindings } from "./types"

interface TurnstileResponse {
  success: boolean
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  )

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

export function createInvitationToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  )
}

export async function verifyTurnstile(
  context: Context<{ Bindings: Bindings; Variables: AppVariables }>
) {
  const token = context.req.header("x-turnstile-token")
  if (!token) return false

  const body = new FormData()
  body.set("secret", getTurnstileSecret(context.env))
  body.set("response", token)
  const remoteIp = context.req.header("cf-connecting-ip")
  if (remoteIp) body.set("remoteip", remoteIp)

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    )
    if (!response.ok) return false

    const result = await response.json<TurnstileResponse>()
    return result.success
  } catch {
    return false
  }
}

export function hasTrustedOrigin(
  context: Context<{ Bindings: Bindings; Variables: AppVariables }>
) {
  return context.req.header("Origin") === getAppOrigin(context.env)
}

export async function isAnonymousRequestAllowed(
  context: Context<{ Bindings: Bindings; Variables: AppVariables }>,
  scope: string
) {
  const client =
    context.req.header("cf-connecting-ip") ??
    context.req.header("x-forwarded-for") ??
    "local"
  const result = await context.env.WAITLIST_RATE_LIMITER.limit({
    key: `${scope}:${client}`,
  })
  return result.success
}
