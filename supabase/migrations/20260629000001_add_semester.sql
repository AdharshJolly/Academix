ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS semester VARCHAR(50) NOT NULL DEFAULT 'Current Semester';
