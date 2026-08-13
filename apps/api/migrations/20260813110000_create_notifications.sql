CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK (
    "type" IN ('expense_budget_approaching', 'expense_budget_limit')
  ),
  "expense_period_start" TEXT NOT NULL,
  "expense_period_end" TEXT NOT NULL,
  "spent_minor" INTEGER NOT NULL CHECK ("spent_minor" >= 0),
  "budget_minor" INTEGER NOT NULL CHECK ("budget_minor" > 0),
  "currency" TEXT NOT NULL CHECK (
    length("currency") = 3 AND "currency" = upper("currency")
  ),
  "threshold_percent" INTEGER NOT NULL CHECK (
    "threshold_percent" BETWEEN 1 AND 200
  ),
  "read_at" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  UNIQUE (
    "user_id", "type", "expense_period_start", "expense_period_end"
  )
);

CREATE INDEX IF NOT EXISTS "notifications_user_created_idx"
ON "notifications" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "notifications_user_read_idx"
ON "notifications" ("user_id", "read_at", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "notification_id" TEXT NOT NULL
    REFERENCES "notifications" ("id") ON DELETE CASCADE,
  "channel" TEXT NOT NULL CHECK ("channel" = 'email'),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (
    "status" IN ('pending', 'queued', 'sending', 'sent', 'failed')
  ),
  "attempt_count" INTEGER NOT NULL DEFAULT 0 CHECK ("attempt_count" >= 0),
  "provider_message_id" TEXT,
  "last_error" TEXT,
  "enqueued_at" TEXT,
  "last_attempt_at" TEXT,
  "sent_at" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("notification_id", "channel")
);

CREATE INDEX IF NOT EXISTS "notification_deliveries_status_idx"
ON "notification_deliveries" ("status", "updated_at");

CREATE TABLE IF NOT EXISTS "notification_reconciliation_state" (
  "id" INTEGER PRIMARY KEY NOT NULL CHECK ("id" = 1),
  "last_user_id" TEXT,
  "last_completed_at" TEXT,
  "updated_at" TEXT NOT NULL
);

INSERT OR IGNORE INTO "notification_reconciliation_state" (
  "id", "last_user_id", "last_completed_at", "updated_at"
) VALUES (1, NULL, NULL, '1970-01-01T00:00:00.000Z');
