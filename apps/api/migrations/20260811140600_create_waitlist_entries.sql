CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE COLLATE NOCASE,
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (
    "status" IN ('pending', 'approved', 'registered')
  ),
  "created_at" TEXT NOT NULL,
  "approved_at" TEXT,
  "approved_by_user_id" TEXT REFERENCES "user" ("id") ON DELETE SET NULL,
  "invite_token_hash" TEXT UNIQUE,
  "invite_expires_at" TEXT,
  "invite_sent_at" TEXT,
  "invite_delivery_status" TEXT NOT NULL DEFAULT 'not_sent' CHECK (
    "invite_delivery_status" IN ('not_sent', 'sending', 'sent', 'failed')
  ),
  "registered_at" TEXT
);

CREATE INDEX IF NOT EXISTS "waitlist_entries_status_created_at_idx"
ON "waitlist_entries" ("status", "created_at" DESC);
