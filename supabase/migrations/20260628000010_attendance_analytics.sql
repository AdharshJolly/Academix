-- Create attendance logs table for tracking streaks and trends
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('attended', 'missed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by record and user
CREATE INDEX IF NOT EXISTS idx_attendance_logs_record_id ON attendance_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);

-- Enable RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attendance logs" ON attendance_logs;
CREATE POLICY "Users can view their own attendance logs" ON attendance_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attendance logs" ON attendance_logs;
CREATE POLICY "Users can insert their own attendance logs" ON attendance_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a view for aggregate attendance stats
CREATE OR REPLACE VIEW user_attendance_stats AS
SELECT 
    user_id,
    COALESCE(SUM(hours_conducted), 0) AS total_hours_conducted,
    COALESCE(SUM(hours_attended), 0) AS total_hours_attended,
    CASE 
        WHEN SUM(hours_conducted) > 0 THEN 
            ROUND((SUM(hours_attended)::NUMERIC / SUM(hours_conducted)::NUMERIC) * 100, 2)
        ELSE 0.00
    END AS overall_percentage,
    COUNT(*) AS total_subjects,
    COUNT(*) FILTER (WHERE hours_conducted > 0 AND (hours_attended::NUMERIC / hours_conducted::NUMERIC) * 100 < target_percentage) AS subjects_at_risk
FROM attendance_records
GROUP BY user_id;

-- Function to auto-log attendance changes
CREATE OR REPLACE FUNCTION log_attendance_changes()
RETURNS TRIGGER AS $$
DECLARE
    conducted_diff INT;
    attended_diff INT;
    i INT;
BEGIN
    conducted_diff := NEW.hours_conducted - OLD.hours_conducted;
    attended_diff := NEW.hours_attended - OLD.hours_attended;

    -- Only log if conducted hours increased
    IF conducted_diff > 0 THEN
        -- Log attended classes
        FOR i IN 1..attended_diff LOOP
            INSERT INTO attendance_logs (record_id, user_id, date, status)
            VALUES (NEW.id, NEW.user_id, CURRENT_DATE, 'attended');
        END LOOP;

        -- Log missed classes
        FOR i IN 1..(conducted_diff - attended_diff) LOOP
            INSERT INTO attendance_logs (record_id, user_id, date, status)
            VALUES (NEW.id, NEW.user_id, CURRENT_DATE, 'missed');
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_attendance_changes ON attendance_records;
CREATE TRIGGER trigger_log_attendance_changes
AFTER UPDATE ON attendance_records
FOR EACH ROW
WHEN (NEW.hours_conducted > OLD.hours_conducted)
EXECUTE FUNCTION log_attendance_changes();
