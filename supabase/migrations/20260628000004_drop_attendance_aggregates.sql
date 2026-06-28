-- Migration to drop redundant attendance aggregate columns from users table

ALTER TABLE public.users
DROP COLUMN IF EXISTS attendance_percent,
DROP COLUMN IF EXISTS attendance_total_hours,
DROP COLUMN IF EXISTS attendance_attended_hours;
