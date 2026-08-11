import type { Hono } from "hono"
import { z } from "zod"

import { requireUser, requireUserMutation } from "../authorization"
import type { AppEnv } from "../types"

const settingsSchema = z.object({
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .refine(isSupportedCurrency),
  confirmRelabel: z.boolean().optional(),
})

const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"))

export function registerSettingsRoutes(app: Hono<AppEnv>) {
  app.get("/api/settings", async (context) => {
    const user = await requireUser(context)
    if (user instanceof Response) return user

    const settings = await context.env.DB.prepare(
      "SELECT currency, updated_at FROM user_settings WHERE user_id = ?"
    )
      .bind(user.id)
      .first<{ currency: string; updated_at: string }>()

    return context.json({
      settings: settings
        ? { currency: settings.currency, updatedAt: settings.updated_at }
        : { currency: null, updatedAt: null },
    })
  })

  app.patch("/api/settings", async (context) => {
    const user = await requireUserMutation(context)
    if (user instanceof Response) return user

    const parsed = settingsSchema.safeParse(
      await context.req.json().catch(() => null)
    )
    if (!parsed.success) return context.json({ error: "invalid_request" }, 400)

    const existing = await context.env.DB.prepare(
      "SELECT currency FROM user_settings WHERE user_id = ?"
    )
      .bind(user.id)
      .first<{ currency: string }>()

    if (
      existing &&
      existing.currency !== parsed.data.currency &&
      !parsed.data.confirmRelabel
    ) {
      const subscriptions = await context.env.DB.prepare(
        "SELECT COUNT(*) AS count FROM subscriptions WHERE user_id = ?"
      )
        .bind(user.id)
        .first<{ count: number }>()
      if ((subscriptions?.count ?? 0) > 0) {
        return context.json(
          {
            error: "currency_change_requires_confirmation",
            subscriptionCount: subscriptions!.count,
          },
          409
        )
      }
    }

    const now = new Date().toISOString()
    const saveSettings = context.env.DB.prepare(
      `INSERT INTO user_settings (user_id, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        currency = excluded.currency,
        updated_at = excluded.updated_at`
    ).bind(user.id, parsed.data.currency, now, now)

    if (existing && existing.currency !== parsed.data.currency) {
      const previousScale = currencyMinorUnitScale(existing.currency)
      const nextScale = currencyMinorUnitScale(parsed.data.currency)
      const relabelSubscriptions = context.env.DB.prepare(
        `UPDATE subscriptions
        SET amount_minor = MAX(
          1,
          CAST(ROUND(amount_minor * ?) AS INTEGER)
        )
        WHERE user_id = ?`
      ).bind(nextScale / previousScale, user.id)

      await context.env.DB.batch([relabelSubscriptions, saveSettings])
    } else {
      await saveSettings.run()
    }

    return context.json({
      settings: { currency: parsed.data.currency, updatedAt: now },
    })
  })
}

function isSupportedCurrency(currency: string) {
  return supportedCurrencies.has(currency)
}

function currencyMinorUnitScale(currency: string) {
  const fractionDigits =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  return 10 ** fractionDigits
}
