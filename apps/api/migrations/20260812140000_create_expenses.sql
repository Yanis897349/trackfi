CREATE TABLE IF NOT EXISTS "expenses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" > 0),
  "schedule_type" TEXT NOT NULL CHECK (
    "schedule_type" IN ('scheduled', 'variable')
  ),
  "cadence" TEXT CHECK (
    "cadence" IS NULL OR "cadence" IN (
      'once',
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'semiannual',
      'yearly'
    )
  ),
  "expense_anchor" TEXT,
  "category" TEXT NOT NULL CHECK (
    "category" IN (
      'housing',
      'food',
      'transport',
      'utilities',
      'health',
      'entertainment',
      'shopping',
      'software',
      'finance',
      'education',
      'travel',
      'other'
    )
  ),
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active' CHECK (
    "status" IN ('active', 'paused', 'archived')
  ),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CHECK (
    ("schedule_type" = 'scheduled' AND "cadence" IS NOT NULL AND "expense_anchor" IS NOT NULL)
    OR
    ("schedule_type" = 'variable' AND "cadence" IS NULL AND "expense_anchor" IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS "expenses_user_status_idx"
ON "expenses" ("user_id", "status", "updated_at" DESC);
