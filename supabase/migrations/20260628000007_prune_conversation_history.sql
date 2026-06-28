-- Prune old messages from conversation_history to prevent unbounded growth
-- Keep only the most recent 100 messages per user

CREATE OR REPLACE FUNCTION enforce_conversation_history_limit()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM conversation_history
    WHERE user_id = NEW.user_id
    AND id NOT IN (
        SELECT id
        FROM conversation_history
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 100
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prune_conversation_history_trigger ON conversation_history;

CREATE TRIGGER prune_conversation_history_trigger
AFTER INSERT ON conversation_history
FOR EACH ROW EXECUTE FUNCTION enforce_conversation_history_limit();
