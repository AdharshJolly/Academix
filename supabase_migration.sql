-- ============================================================
-- CampusFlow — Full Users Table Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Add ALL missing columns (safe — IF NOT EXISTS won't error if already there)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash            TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number          TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url               TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token     TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at               TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Drop the Supabase Auth foreign key (blocks our custom inserts)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 3: Verify — you should see all columns listed below
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
