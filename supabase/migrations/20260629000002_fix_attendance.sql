-- Add columns if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='semester') THEN
        ALTER TABLE attendance_records ADD COLUMN semester VARCHAR(50) NOT NULL DEFAULT 'Current Semester';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own attendance records" ON attendance_records;
CREATE POLICY "Users can manage own attendance records" ON attendance_records
  FOR ALL USING (auth.uid() = user_id);
