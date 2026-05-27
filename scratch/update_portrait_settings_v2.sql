-- Add all new customizable fields to Portrait_Settings
ALTER TABLE "Portrait_Settings"
ADD COLUMN IF NOT EXISTS "Custom_Questions"     TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "Style_Heading"        TEXT,
ADD COLUMN IF NOT EXISTS "Style_Description"    TEXT,
ADD COLUMN IF NOT EXISTS "Style_Bullets"        TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "Style_Photo_URL"      TEXT,
ADD COLUMN IF NOT EXISTS "Packages"             TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "Whats_Next_Heading"   TEXT,
ADD COLUMN IF NOT EXISTS "Whats_Next_Sub"       TEXT,
ADD COLUMN IF NOT EXISTS "Whats_Next_Steps"     TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "Payment_Methods"      TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "Payment_Instructions" TEXT,
ADD COLUMN IF NOT EXISTS "Venmo_Handle"         TEXT,
ADD COLUMN IF NOT EXISTS "Paypal_Link"          TEXT,
ADD COLUMN IF NOT EXISTS "Zelle_Contact"        TEXT;
ALTER TABLE "Portrait_Settings" ADD COLUMN IF NOT EXISTS "Budget_Ranges" TEXT DEFAULT '[]';
