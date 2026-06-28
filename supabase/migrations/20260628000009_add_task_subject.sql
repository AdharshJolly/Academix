-- Add subject column to tasks table to link with attendance_records
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create an index to quickly filter tasks by subject
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject);
