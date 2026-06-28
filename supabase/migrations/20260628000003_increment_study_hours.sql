-- Migration to safely increment study hours atomically

CREATE OR REPLACE FUNCTION increment_study_hours(p_user_id UUID, hours NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET study_hours = COALESCE(study_hours, 0) + hours
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
