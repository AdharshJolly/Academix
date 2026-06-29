-- Enable pg_cron extension if not already enabled (requires supabase superuser/postgres)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cleanup function
CREATE OR REPLACE FUNCTION delete_old_conversation_history()
RETURNS void AS $$
BEGIN
    DELETE FROM conversation_history
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule the job to run daily at 3:00 AM
SELECT cron.schedule(
    'prune-conversation-history-daily',
    '0 3 * * *',
    'SELECT delete_old_conversation_history()'
);
