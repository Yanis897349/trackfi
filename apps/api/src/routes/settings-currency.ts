import { currencyMinorUnitScale } from "../intl"

const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"))

export function isSupportedCurrency(currency: string) {
  return supportedCurrencies.has(currency)
}

export async function getCurrencyRelabelCounts(
  database: D1Database,
  userId: string
) {
  const [subscriptions, expenses, revenueSources] = await Promise.all([
    database
      .prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE user_id = ?")
      .bind(userId)
      .first<{ count: number }>(),
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM expense_transactions WHERE user_id = ?"
      )
      .bind(userId)
      .first<{ count: number }>(),
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM revenue_sources WHERE user_id = ?"
      )
      .bind(userId)
      .first<{ count: number }>(),
  ])
  return {
    subscriptions: subscriptions?.count ?? 0,
    expenses: expenses?.count ?? 0,
    revenueSources: revenueSources?.count ?? 0,
  }
}

export function currencyRelabelStatements(
  database: D1Database,
  userId: string,
  previousCurrency: string,
  nextCurrency: string
) {
  const scale =
    currencyMinorUnitScale(nextCurrency) /
    currencyMinorUnitScale(previousCurrency)
  return [
    database
      .prepare(
        `UPDATE subscriptions
        SET amount_minor = MAX(1, CAST(ROUND(amount_minor * ?) AS INTEGER))
        WHERE user_id = ?`
      )
      .bind(scale, userId),
    database
      .prepare(
        `UPDATE expense_transactions
        SET amount_minor = MAX(1, CAST(ROUND(amount_minor * ?) AS INTEGER))
        WHERE user_id = ?`
      )
      .bind(scale, userId),
    database
      .prepare(
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
      )
      .bind(scale, scale, userId),
    database
      .prepare(
        `UPDATE revenue_sources
        SET amount_minor = MAX(1, CAST(ROUND(amount_minor * ?) AS INTEGER))
        WHERE user_id = ?`
      )
      .bind(scale, userId),
  ]
}
