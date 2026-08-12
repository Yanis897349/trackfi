CREATE TABLE IF NOT EXISTS "expense_transactions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "merchant" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" > 0),
  "transaction_date" TEXT NOT NULL,
  "category" TEXT NOT NULL CHECK (
    "category" IN (
      'housing', 'food', 'transport', 'utilities', 'health',
      'entertainment', 'shopping', 'software', 'infrastructure',
      'finance', 'education', 'travel', 'other'
    )
  ),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (
    "status" IN ('pending', 'approved', 'declined')
  ),
  "reimbursable" INTEGER NOT NULL DEFAULT 0 CHECK ("reimbursable" IN (0, 1)),
  "notes" TEXT,
  "receipt_key" TEXT,
  "receipt_name" TEXT,
  "receipt_content_type" TEXT,
  "receipt_size" INTEGER,
  "legacy_expense_id" TEXT UNIQUE,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "expense_transactions_user_date_idx"
ON "expense_transactions" ("user_id", "transaction_date" DESC, "created_at" DESC);

CREATE INDEX IF NOT EXISTS "expense_transactions_user_status_idx"
ON "expense_transactions" ("user_id", "status", "transaction_date" DESC);

CREATE TABLE IF NOT EXISTS "expense_settings" (
  "user_id" TEXT PRIMARY KEY NOT NULL
    REFERENCES "user" ("id") ON DELETE CASCADE,
  "monthly_budget_minor" INTEGER CHECK ("monthly_budget_minor" > 0),
  "daily_target_minor" INTEGER CHECK ("daily_target_minor" > 0),
  "budget_period" TEXT NOT NULL DEFAULT 'monthly' CHECK ("budget_period" = 'monthly'),
  "reset_day" INTEGER NOT NULL DEFAULT 1 CHECK ("reset_day" BETWEEN 1 AND 28),
  "rollover_enabled" INTEGER NOT NULL DEFAULT 0 CHECK ("rollover_enabled" IN (0, 1)),
  "approaching_threshold" INTEGER NOT NULL DEFAULT 80 CHECK ("approaching_threshold" BETWEEN 1 AND 199),
  "limit_threshold" INTEGER NOT NULL DEFAULT 100 CHECK ("limit_threshold" BETWEEN 2 AND 200),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CHECK ("approaching_threshold" < "limit_threshold")
);

INSERT OR IGNORE INTO "expense_transactions" (
  "id", "user_id", "merchant", "amount_minor", "transaction_date",
  "category", "status", "reimbursable", "notes", "legacy_expense_id",
  "created_at", "updated_at"
)
SELECT
  "id", "user_id", "name", "amount_minor",
  COALESCE("expense_anchor", substr("created_at", 1, 10)),
  "category",
  CASE "status"
    WHEN 'active' THEN 'approved'
    WHEN 'paused' THEN 'pending'
    ELSE 'declined'
  END,
  0, "notes", "id", "created_at", "updated_at"
FROM "expenses";
