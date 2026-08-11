import type { Bindings, WaitlistEntryRow } from "./types"

export const WAITLIST_FLAG = "waitlist_mode"

export async function isWaitlistModeEnabled(env: Bindings) {
  const row = await env.DB.prepare(
    "SELECT enabled FROM feature_flags WHERE key = ?"
  )
    .bind(WAITLIST_FLAG)
    .first<{ enabled: number }>()

  return row?.enabled !== 0
}

export async function findWaitlistEntryByToken(
  env: Bindings,
  tokenHash: string
) {
  return env.DB.prepare(
    `SELECT id, email, status, created_at, approved_at, invite_expires_at,
      invite_sent_at, invite_delivery_status, registered_at
    FROM waitlist_entries
    WHERE invite_token_hash = ?`
  )
    .bind(tokenHash)
    .first<WaitlistEntryRow>()
}

export function isInvitationUsable(entry: WaitlistEntryRow | null) {
  return Boolean(
    entry &&
    entry.status === "approved" &&
    entry.invite_expires_at &&
    new Date(entry.invite_expires_at).getTime() > Date.now()
  )
}
