CREATE TABLE "revenue_sources_with_one_time" (
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

INSERT INTO "revenue_sources_with_one_time" (
  "id",
  "user_id",
  "name",
  "amount_minor",
  "schedule_type",
  "cadence",
  "payment_anchor",
  "category",
  "notes",
  "status",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  "user_id",
  "name",
  "amount_minor",
  "schedule_type",
  "cadence",
  "payment_anchor",
  "category",
  "notes",
  "status",
  "created_at",
  "updated_at"
FROM "revenue_sources";

DROP TABLE "revenue_sources";

ALTER TABLE "revenue_sources_with_one_time" RENAME TO "revenue_sources";

CREATE INDEX "revenue_sources_user_status_idx"
ON "revenue_sources" ("user_id", "status", "updated_at" DESC);
