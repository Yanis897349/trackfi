CREATE TABLE IF NOT EXISTS "revenue_sources" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" > 0),
  "schedule_type" TEXT NOT NULL CHECK (
    "schedule_type" IN ('scheduled', 'variable')
  ),
  "cadence" TEXT CHECK (
    "cadence" IS NULL OR "cadence" IN (
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'semiannual',
      'yearly'
    )
  ),
  "payment_anchor" TEXT,
  "category" TEXT NOT NULL CHECK (
    "category" IN (
      'salary',
      'freelance',
      'business',
      'rental',
      'investments',
      'benefits',
      'pension',
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
    ("schedule_type" = 'scheduled' AND "cadence" IS NOT NULL AND "payment_anchor" IS NOT NULL)
    OR
    ("schedule_type" = 'variable' AND "cadence" IS NULL AND "payment_anchor" IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS "revenue_sources_user_status_idx"
ON "revenue_sources" ("user_id", "status", "updated_at" DESC);
