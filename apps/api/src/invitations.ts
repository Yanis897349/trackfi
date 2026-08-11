import { sendInvitation } from "./email"
import { createInvitationToken, sha256 } from "./security"
import type { AppContext, Bindings } from "./types"

export async function issueInvitation(env: Bindings, entryId: string) {
  const entry = await env.DB.prepare(
    "SELECT email FROM waitlist_entries WHERE id = ? AND status = 'approved'"
  )
    .bind(entryId)
    .first<{ email: string }>()
  if (!entry) throw new Error("Approved waitlist entry not found")

  const token = createInvitationToken()
  const tokenHash = await sha256(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare(
    `UPDATE waitlist_entries SET invite_token_hash = ?, invite_expires_at = ?,
      invite_delivery_status = 'sending' WHERE id = ?`
  )
    .bind(tokenHash, expiresAt, entryId)
    .run()

  try {
    await sendInvitation(env, entry.email, token)
    await env.DB.prepare(
      `UPDATE waitlist_entries SET invite_sent_at = ?,
        invite_delivery_status = 'sent' WHERE id = ?`
    )
      .bind(new Date().toISOString(), entryId)
      .run()
  } catch (error) {
    await env.DB.prepare(
      "UPDATE waitlist_entries SET invite_delivery_status = 'failed' WHERE id = ?"
    )
      .bind(entryId)
      .run()
    throw error
  }
}

export async function sendInvitationResponse(
  context: AppContext,
  entryId: string
) {
  try {
    await issueInvitation(context.env, entryId)
    return context.json({ sent: true })
  } catch {
    return context.json({ error: "email_delivery_failed", approved: true }, 502)
  }
}
