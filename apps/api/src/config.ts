import type { Bindings } from "./types"

const LOCAL_APP_ORIGIN = "http://localhost:5173"
const LOCAL_AUTH_BASE_URL = "http://localhost:8787"
const LOCAL_AUTH_SECRET = "trackfi-local-development-secret-change-me"
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA"

export function getAppOrigin(env: Bindings) {
  return env.APP_ORIGIN ?? LOCAL_APP_ORIGIN
}

export function getAuthBaseUrl(env: Bindings) {
  return env.AUTH_BASE_URL ?? LOCAL_AUTH_BASE_URL
}

export function getAuthSecret(env: Bindings) {
  if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET
  if (getAuthBaseUrl(env).includes("localhost")) return LOCAL_AUTH_SECRET
  throw new Error("BETTER_AUTH_SECRET is required outside local development")
}

export function getTurnstileSecret(env: Bindings) {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY
  if (getAuthBaseUrl(env).includes("localhost")) return TURNSTILE_TEST_SECRET
  throw new Error("TURNSTILE_SECRET_KEY is required outside local development")
}

export function getAdminEmails(env: Bindings) {
  return new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isAdminEmail(env: Bindings, email: string) {
  return getAdminEmails(env).has(email.trim().toLowerCase())
}
