CREATE TABLE IF NOT EXISTS "subscription_spend_snapshots" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "currency" TEXT NOT NULL,
  "monthly_equivalent_minor" INTEGER NOT NULL CHECK (
    "monthly_equivalent_minor" >= 0
  ),
  "recorded_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "subscription_spend_snapshots_lookup_idx"
ON "subscription_spend_snapshots" (
  "user_id",
  "recorded_at" DESC
);

INSERT INTO "subscription_spend_snapshots" (
  "id",
  "user_id",
  "currency",
  "monthly_equivalent_minor",
  "recorded_at"
)
SELECT
  'backfill-' || settings.user_id,
  settings.user_id,
  settings.currency,
  CAST(
    ROUND(
      COALESCE(
        SUM(
          CASE
            WHEN subscriptions.status != 'active' THEN 0
            WHEN subscriptions.cadence = 'weekly' THEN subscriptions.amount_minor * 52
            WHEN subscriptions.cadence = 'monthly' THEN subscriptions.amount_minor * 12
            WHEN subscriptions.cadence = 'quarterly' THEN subscriptions.amount_minor * 4
            WHEN subscriptions.cadence = 'semiannual' THEN subscriptions.amount_minor * 2
            ELSE subscriptions.amount_minor
          END
        ),
        0
      ) / 12.0
    ) AS INTEGER
  ),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM user_settings AS settings
LEFT JOIN subscriptions ON subscriptions.user_id = settings.user_id
GROUP BY settings.user_id, settings.currency;
