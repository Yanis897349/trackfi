import type { Hono } from "hono"
import { z } from "zod"

import { requireUser, requireUserMutation } from "../authorization"
import { subscriptionSpendSnapshotStatement } from "../subscription-database"
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
      const [subscriptions, expenses, revenueSources] = await Promise.all([
        context.env.DB.prepare(
          "SELECT COUNT(*) AS count FROM subscriptions WHERE user_id = ?"
        )
          .bind(user.id)
          .first<{ count: number }>(),
        context.env.DB.prepare(
          "SELECT COUNT(*) AS count FROM expense_transactions WHERE user_id = ?"
        )
          .bind(user.id)
          .first<{ count: number }>(),
        context.env.DB.prepare(
          "SELECT COUNT(*) AS count FROM revenue_sources WHERE user_id = ?"
        )
          .bind(user.id)
          .first<{ count: number }>(),
      ])
      if (
        (subscriptions?.count ?? 0) +
          (expenses?.count ?? 0) +
          (revenueSources?.count ?? 0) >
        0
      ) {
        return context.json(
          {
            error: "currency_change_requires_confirmation",
            subscriptionCount: subscriptions?.count ?? 0,
            expenseCount: expenses?.count ?? 0,
            revenueSourceCount: revenueSources?.count ?? 0,
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
      const relabelRevenueSources = context.env.DB.prepare(
        `UPDATE revenue_sources
        SET amount_minor = MAX(
          1,
          CAST(ROUND(amount_minor * ?) AS INTEGER)
        )
        WHERE user_id = ?`
      ).bind(nextScale / previousScale, user.id)
      const relabelExpenses = context.env.DB.prepare(
        `UPDATE expense_transactions
        SET amount_minor = MAX(
          1,
          CAST(ROUND(amount_minor * ?) AS INTEGER)
        )
        WHERE user_id = ?`
      ).bind(nextScale / previousScale, user.id)
      const relabelExpenseSettings = context.env.DB.prepare(
        `UPDATE expense_settings SET
          monthly_budget_minor = CASE
            WHEN monthly_budget_minor IS NULL THEN NULL
            ELSE MAX(1, CAST(ROUND(monthly_budget_minor * ?) AS INTEGER))
          END,
          daily_target_minor = CASE
            WHEN daily_target_minor IS NULL THEN NULL
            ELSE MAX(1, CAST(ROUND(daily_target_minor * ?) AS INTEGER))
          END
        WHERE user_id = ?`
      ).bind(nextScale / previousScale, nextScale / previousScale, user.id)

      await context.env.DB.batch([
        relabelSubscriptions,
        relabelExpenses,
        relabelExpenseSettings,
        relabelRevenueSources,
        saveSettings,
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
        subscriptionSpendSnapshotStatement(
          context.env.DB,
          user.id,
          parsed.data.currency,
          now
        ),
      ])
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
