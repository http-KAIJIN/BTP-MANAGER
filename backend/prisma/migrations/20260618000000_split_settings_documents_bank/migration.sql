ALTER TABLE "company_profile"
ADD COLUMN IF NOT EXISTS "account_info" TEXT,
ADD COLUMN IF NOT EXISTS "default_notes" TEXT;
