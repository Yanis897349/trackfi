import type { Context } from "hono"

export interface Bindings {
  DB: D1Database
  BRAND_LOGO_RATE_LIMITER: RateLimit
  WAITLIST_RATE_LIMITER: RateLimit
  ADMIN_EMAILS?: string
  APP_ORIGIN?: string
  AUTH_BASE_URL?: string
  BETTER_AUTH_SECRET?: string
  BRANDFETCH_CLIENT_ID?: string
  EMAIL_FROM?: string
  RESEND_API_KEY?: string
  TURNSTILE_SECRET_KEY?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "user"
}

export interface AppVariables {
  inviteEntryId: string | null
  inviteUserExisted: boolean
  user: AuthUser | null
}

export type AppEnv = { Bindings: Bindings; Variables: AppVariables }
export type AppContext = Context<AppEnv>

export interface WaitlistEntryRow {
  id: string
  email: string
  status: "approved" | "pending" | "registered"
  created_at: string
  approved_at: string | null
  invite_expires_at: string | null
  invite_sent_at: string | null
  invite_delivery_status: "failed" | "not_sent" | "sending" | "sent"
  registered_at: string | null
}
