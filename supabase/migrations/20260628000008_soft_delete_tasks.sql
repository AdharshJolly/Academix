-- Add deleted_at column to tasks table for soft deletion
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create an index to quickly filter out deleted tasks
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- Update RLS policies to enforce deleted_at IS NULL
-- We must recreate or alter the policies so that users only see their non-deleted tasks.
-- Since Supabase policies don't have an "ALTER POLICY USING" shortcut, we drop and recreate.

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE
    USING (auth.uid() = user_id);
