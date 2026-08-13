import type { Context, Hono } from "hono"
import { z } from "zod"
import { preferredLocale } from "@trackfi/localization"

import { isAdminEmail } from "../config"
import {
  findWaitlistEntryByToken,
  isInvitationUsable,
  isWaitlistModeEnabled,
} from "../database"
import { sendWaitlistConfirmation } from "../email"
import { issueInvitation } from "../invitations"
import { isAnonymousRequestAllowed, sha256, verifyTurnstile } from "../security"
import type { AppEnv } from "../types"

const emailSchema = z.string().trim().toLowerCase().email().max(320)
const invitationSchema = z.object({ token: z.string().min(32).max(256) })

function healthResponse(context: Context<AppEnv>) {
  context.header("Cache-Control", "no-store")
  return context.json({ status: "ok", service: "trackfi-api" })
}

export function registerPublicRoutes(app: Hono<AppEnv>) {
  app.get("/", healthResponse)
  app.get("/health", healthResponse)

  app.get("/api/config", async (context) => {
    context.header("Cache-Control", "no-store")
    return context.json({
      waitlistMode: await isWaitlistModeEnabled(context.env),
    })
  })

  app.post("/api/waitlist", async (context) => {
    if (!(await isAnonymousRequestAllowed(context, "waitlist"))) {
      return context.json({ error: "rate_limited" }, 429)
    }
    if (!(await verifyTurnstile(context))) {
      return context.json({ error: "turnstile_failed" }, 400)
    }

    const parsed = z
      .object({ email: emailSchema, locale: z.enum(["en", "fr"]).optional() })
      .safeParse(await context.req.json().catch(() => null))
    if (!parsed.success) return context.json({ error: "invalid_email" }, 400)

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const locale =
      parsed.data.locale ??
      preferredLocale(context.req.header("accept-language"))
    const isAdmin = isAdminEmail(context.env, parsed.data.email)
    const insert = await context.env.DB.prepare(
      `INSERT OR IGNORE INTO waitlist_entries
        (id, email, locale, status, created_at, approved_at)
      VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        parsed.data.email,
        locale,
        isAdmin ? "approved" : "pending",
        now,
        isAdmin ? now : null
      )
      .run()

    if (insert.meta.changes > 0) {
      const email = isAdmin
        ? issueInvitation(context.env, id)
        : sendWaitlistConfirmation(context.env, parsed.data.email, locale)
      context.executionCtx.waitUntil(email)
    } else {
      await context.env.DB.prepare(
        "UPDATE waitlist_entries SET locale = ? WHERE email = ?"
      )
        .bind(locale, parsed.data.email)
        .run()
    }

    return context.json({ accepted: true }, 202)
  })

  app.post("/api/invitations/validate", async (context) => {
    if (!(await isAnonymousRequestAllowed(context, "invitation"))) {
      return context.json({ error: "rate_limited" }, 429)
    }

    const parsed = invitationSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ valid: false }, 400)

    const entry = await findWaitlistEntryByToken(
      context.env,
      await sha256(parsed.data.token)
    )
    if (!isInvitationUsable(entry)) {
      return context.json({ valid: false }, 404)
    }

    return context.json({ valid: true, email: entry!.email })
  })
}
