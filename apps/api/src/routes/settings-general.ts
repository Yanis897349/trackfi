import type { Hono } from "hono"
import { z } from "zod"
import { supportedLocales } from "@trackfi/localization"

import { requireUser, requireUserMutation } from "../authorization"
import { subscriptionSpendSnapshotStatement } from "../subscription-database"
import type { AppEnv } from "../types"
import {
  currencyRelabelStatements,
  getCurrencyRelabelCounts,
  isSupportedCurrency,
} from "./settings-currency"

const settingsSchema = z.object({
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .refine(isSupportedCurrency),
  confirmRelabel: z.boolean().optional(),
  locale: z.enum(supportedLocales).optional(),
})

export function registerGeneralSettingsRoutes(app: Hono<AppEnv>) {
  app.get("/api/settings", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const settings = await context.env.DB.prepare(
      `SELECT s.currency, s.updated_at, u.locale
      FROM "user" u
      LEFT JOIN user_settings s ON s.user_id = u.id
      WHERE u.id = ?`
    )
      .bind(user.id)
      .first<{
        currency: string | null
        locale: "en" | "fr"
        updated_at: string | null
      }>()

    return context.json({
      settings: {
        currency: settings?.currency ?? null,
        locale: settings?.locale ?? user.locale,
        updatedAt: settings?.updated_at ?? null,
      },
    })
  })

  app.patch("/api/settings", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user

    const parsed = settingsSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const [existing, storedUser] = await Promise.all([
      context.env.DB.prepare(
        "SELECT currency FROM user_settings WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ currency: string }>(),
      context.env.DB.prepare('SELECT locale FROM "user" WHERE id = ?')
        .bind(user.id)
        .first<{ locale: "en" | "fr" }>(),
    ])

    if (
      existing &&
      existing.currency !== parsed.data.currency &&
      !parsed.data.confirmRelabel
    ) {
      const counts = await getCurrencyRelabelCounts(context.env.DB, user.id)
      if (counts.subscriptions + counts.expenses + counts.revenueSources > 0) {
        return context.json(
          {
            error: "currency_change_requires_confirmation",
            subscriptionCount: counts.subscriptions,
            expenseCount: counts.expenses,
            revenueSourceCount: counts.revenueSources,
          },
          409
        )
      }
    }

    const now = new Date().toISOString()
    const locale = parsed.data.locale ?? storedUser?.locale ?? user.locale
    const saveSettings = context.env.DB.prepare(
      `INSERT INTO user_settings (user_id, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        currency = excluded.currency,
        updated_at = excluded.updated_at`
    ).bind(user.id, parsed.data.currency, now, now)
    const saveLocale = context.env.DB.prepare(
      `UPDATE "user" SET locale = ?, updatedAt = ? WHERE id = ?`
    ).bind(locale, Date.now(), user.id)

    if (existing && existing.currency !== parsed.data.currency) {
      await context.env.DB.batch([
        ...currencyRelabelStatements(
          context.env.DB,
          user.id,
          existing.currency,
          parsed.data.currency
        ),
        saveSettings,
        saveLocale,
        subscriptionSpendSnapshotStatement(
          context.env.DB,
          user.id,
          parsed.data.currency,
          now
        ),
      ])
    } else if (!existing) {
      await context.env.DB.batch([
        saveSettings,
        saveLocale,
        subscriptionSpendSnapshotStatement(
          context.env.DB,
          user.id,
          parsed.data.currency,
          now
        ),
      ])
    } else {
      await context.env.DB.batch([saveSettings, saveLocale])
    }

    return context.json({
      settings: { currency: parsed.data.currency, locale, updatedAt: now },
    })
  })
}
