import type { ExpenseSettingsInput } from "./expense-validation"
import type { ExpenseSettingsRow } from "./expense-database-types"

export function readExpenseSettings(database: D1Database, userId: string) {
  return database
    .prepare(
      `SELECT user_id, monthly_budget_minor, daily_target_minor, budget_period,
      reset_day, rollover_enabled, approaching_threshold, limit_threshold,
      created_at, updated_at FROM expense_settings WHERE user_id = ?`
    )
    .bind(userId)
    .first<ExpenseSettingsRow>()
}

export async function saveExpenseSettings(
  database: D1Database,
  userId: string,
  settings: ExpenseSettingsInput
) {
  const now = new Date().toISOString()
  await database
    .prepare(
      `INSERT INTO expense_settings
      (user_id, monthly_budget_minor, daily_target_minor, budget_period,
        reset_day, rollover_enabled, approaching_threshold, limit_threshold,
        created_at, updated_at)
      VALUES (?, ?, ?, 'monthly', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        monthly_budget_minor = excluded.monthly_budget_minor,
        daily_target_minor = excluded.daily_target_minor,
        reset_day = excluded.reset_day,
        rollover_enabled = excluded.rollover_enabled,
        approaching_threshold = excluded.approaching_threshold,
        limit_threshold = excluded.limit_threshold,
        updated_at = excluded.updated_at`
    )
    .bind(
      userId,
      settings.monthlyBudgetMinor,
      settings.dailyTargetMinor,
      settings.resetDay,
      settings.rolloverEnabled ? 1 : 0,
      settings.approachingThreshold,
      settings.limitThreshold,
      now,
      now
    )
    .run()
  return (await readExpenseSettings(database, userId))!
}

export function serializeExpenseSettings(row: ExpenseSettingsRow | null) {
  return row
    ? {
        monthlyBudgetMinor: row.monthly_budget_minor,
        dailyTargetMinor: row.daily_target_minor,
        budgetPeriod: row.budget_period,
        resetDay: row.reset_day,
        rolloverEnabled: Boolean(row.rollover_enabled),
        approachingThreshold: row.approaching_threshold,
        limitThreshold: row.limit_threshold,
        updatedAt: row.updated_at,
      }
    : {
        monthlyBudgetMinor: null,
        dailyTargetMinor: null,
        budgetPeriod: "monthly" as const,
        resetDay: 1,
        rolloverEnabled: false,
        approachingThreshold: 80,
        limitThreshold: 100,
        updatedAt: null,
      }
}
