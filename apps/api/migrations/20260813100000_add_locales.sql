ALTER TABLE "user"
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en'
CHECK ("locale" IN ('en', 'fr'));

ALTER TABLE "waitlist_entries"
ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en'
CHECK ("locale" IN ('en', 'fr'));
