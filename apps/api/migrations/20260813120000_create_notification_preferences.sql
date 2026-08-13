CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "user_id" TEXT PRIMARY KEY NOT NULL
    REFERENCES "user" ("id") ON DELETE CASCADE,
  "budget_alerts_enabled" INTEGER NOT NULL DEFAULT 1 CHECK (
    "budget_alerts_enabled" IN (0, 1)
  ),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);
