CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" > 0),
  "cadence" TEXT NOT NULL CHECK (
    "cadence" IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'yearly')
  ),
  "billing_anchor" TEXT NOT NULL,
  "category" TEXT NOT NULL CHECK (
    "category" IN (
      'software',
      'entertainment',
      'utilities',
      'finance',
      'health',
      'education',
      'shopping',
      'other'
    )
  ),
  "website_url" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active' CHECK (
    "status" IN ('active', 'paused', 'archived')
  ),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "subscriptions_user_status_idx"
ON "subscriptions" ("user_id", "status", "updated_at" DESC);
