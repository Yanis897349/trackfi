import type { Hono } from "hono"

import { createAuth } from "../auth"
import {
  findWaitlistEntryByToken,
  isInvitationUsable,
  isWaitlistModeEnabled,
} from "../database"
import { sha256, verifyTurnstile } from "../security"
import type { AppEnv } from "../types"

const protectedByTurnstile = new Set([
  "/sign-in/email",
  "/sign-up/email",
  "/request-password-reset",
  "/forget-password",
])

export function registerAuthRoutes(app: Hono<AppEnv>) {
  app.use("/api/auth/*", async (context, next) => {
    context.set("inviteEntryId", null)
    context.set("inviteUserExisted", false)
    const path = context.req.path.replace("/api/auth", "")

    if (
      context.req.method === "POST" &&
      protectedByTurnstile.has(path) &&
      !(await verifyTurnstile(context))
    ) {
      return context.json({ code: "TURNSTILE_FAILED" }, 400)
    }

    if (
      context.req.method === "POST" &&
      path === "/sign-up/email" &&
      (await isWaitlistModeEnabled(context.env))
    ) {
      const inviteToken = context.req.header("x-invite-token")
      if (!inviteToken) {
        return context.json({ code: "INVITATION_REQUIRED" }, 403)
      }

      const body = await context.req.raw
        .clone()
        .json<{ email?: string }>()
        .catch(() => null)
      const entry = await findWaitlistEntryByToken(
        context.env,
        await sha256(inviteToken)
      )
      if (
        !isInvitationUsable(entry) ||
        !body?.email ||
        entry!.email !== body.email.trim().toLowerCase()
      ) {
        return context.json({ code: "INVITATION_INVALID" }, 403)
      }

      context.set("inviteEntryId", entry!.id)
      const existingUser = await context.env.DB.prepare(
        'SELECT id FROM "user" WHERE email = ?'
      )
        .bind(entry!.email)
        .first<{ id: string }>()
      context.set("inviteUserExisted", Boolean(existingUser))
    }

    await next()

    const inviteEntryId = context.get("inviteEntryId")
    if (
      inviteEntryId &&
      !context.get("inviteUserExisted") &&
      context.res.status >= 200 &&
      context.res.status < 300
    ) {
      await context.env.DB.prepare(
        `UPDATE waitlist_entries
        SET status = 'registered', registered_at = ?, invite_token_hash = NULL,
          invite_expires_at = NULL
        WHERE id = ? AND status = 'approved'
          AND EXISTS (
            SELECT 1 FROM "user"
            WHERE "user".email = waitlist_entries.email
          )`
      )
        .bind(new Date().toISOString(), inviteEntryId)
        .run()
    }
  })

  app.on(["POST", "GET"], "/api/auth/*", (context) =>
    createAuth(context.env, context.executionCtx).handler(context.req.raw)
  )
}
