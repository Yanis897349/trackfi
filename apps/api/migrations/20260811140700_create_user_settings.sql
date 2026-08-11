CREATE TABLE IF NOT EXISTS "user_settings" (
  "user_id" TEXT PRIMARY KEY NOT NULL
    REFERENCES "user" ("id") ON DELETE CASCADE,
  "currency" TEXT NOT NULL CHECK (
    length("currency") = 3 AND "currency" = upper("currency")
  ),
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);
