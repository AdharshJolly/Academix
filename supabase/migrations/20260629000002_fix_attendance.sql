DROP TABLE IF EXISTS attendance_records CASCADE;

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester VARCHAR(50) NOT NULL DEFAULT 'Current Semester',
    subject_code VARCHAR(50),
    subject_name VARCHAR(255) NOT NULL,
    hours_conducted NUMERIC NOT NULL DEFAULT 0.0,
    hours_attended NUMERIC NOT NULL DEFAULT 0.0,
    target_percentage NUMERIC NOT NULL DEFAULT 75.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own attendance records" ON attendance_records;
CREATE POLICY "Users can manage own attendance records" ON attendance_records
  FOR ALL USING (auth.uid() = user_id);
