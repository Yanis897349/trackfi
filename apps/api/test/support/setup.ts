import { env } from "cloudflare:workers"
import { afterEach, beforeAll, beforeEach, vi } from "vitest"

import accountsMigration from "../../migrations/20260811140200_create_accounts.sql?raw"
import featureFlagsMigration from "../../migrations/20260811140500_create_feature_flags.sql?raw"
import rateLimitsMigration from "../../migrations/20260811140400_create_rate_limits.sql?raw"
import sessionsMigration from "../../migrations/20260811140100_create_sessions.sql?raw"
import usersMigration from "../../migrations/20260811140000_create_users.sql?raw"
import verificationsMigration from "../../migrations/20260811140300_create_verifications.sql?raw"
import waitlistMigration from "../../migrations/20260811140600_create_waitlist_entries.sql?raw"
import userSettingsMigration from "../../migrations/20260811140700_create_user_settings.sql?raw"
import subscriptionsMigration from "../../migrations/20260811140800_create_subscriptions.sql?raw"
import subscriptionSnapshotsMigration from "../../migrations/20260811140900_create_subscription_spend_snapshots.sql?raw"
import revenueSourcesMigration from "../../migrations/20260812120000_create_revenue_sources.sql?raw"
import oneTimeRevenueMigration from "../../migrations/20260812130000_add_one_time_revenue_cadence.sql?raw"
import expensesMigration from "../../migrations/20260812140000_create_expenses.sql?raw"
import expenseTransactionsMigration from "../../migrations/20260812150000_create_expense_transactions.sql?raw"
import localesMigration from "../../migrations/20260813100000_add_locales.sql?raw"
import notificationsMigration from "../../migrations/20260813110000_create_notifications.sql?raw"

const migrationQueries = [
  usersMigration,
  sessionsMigration,
  accountsMigration,
  verificationsMigration,
  rateLimitsMigration,
  featureFlagsMigration,
  waitlistMigration,
  userSettingsMigration,
  subscriptionsMigration,
  subscriptionSnapshotsMigration,
  revenueSourcesMigration,
  oneTimeRevenueMigration,
  expensesMigration,
  expenseTransactionsMigration,
  localesMigration,
  notificationsMigration,
].flatMap((sql) =>
  sql
    .split(";")
    .map((query) => query.trim())
    .filter(Boolean)
)

beforeAll(async () => {
  await env.DB.batch(migrationQueries.map((query) => env.DB.prepare(query)))
})

beforeEach(async () => {
  await env.DB.prepare(
    "UPDATE feature_flags SET enabled = 1 WHERE key = 'waitlist_mode'"
  ).run()
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("challenges.cloudflare.com/turnstile")) {
        return Response.json({ success: true })
      }
      throw new Error(`Unexpected outbound request: ${url}`)
    })
  )
})

afterEach(() => vi.unstubAllGlobals())
