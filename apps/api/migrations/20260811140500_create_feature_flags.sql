CREATE TABLE IF NOT EXISTS "feature_flags" (
  "key" TEXT PRIMARY KEY NOT NULL,
  "enabled" INTEGER NOT NULL DEFAULT 0 CHECK ("enabled" IN (0, 1)),
  "description" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  "updated_by_user_id" TEXT REFERENCES "user" ("id") ON DELETE SET NULL
);
INSERT OR IGNORE INTO "feature_flags" (
  "key",
  "enabled",
  "description",
  "updated_at"
)
VALUES (
  'waitlist_mode',
  1,
  'Restrict registration to approved waitlist invitations.',
  CURRENT_TIMESTAMP
);
