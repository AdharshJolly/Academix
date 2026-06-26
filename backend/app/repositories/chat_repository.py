import logging
from typing import List, Dict
from app.db.client import get_supabase

logger = logging.getLogger(__name__)

class ChatRepository:
    """
    Manages conversational memory in Supabase.
    Table: conversation_history
    """
    def __init__(self):
        self.db = get_supabase()

    def add_message(self, user_id: str, role: str, content: str) -> None:
        """
        Save a message to the history.
        Role must be 'user' or 'assistant'.
        """
        if role not in ("user", "assistant"):
            raise ValueError("Role must be 'user' or 'assistant'")
            
        try:
            self.db.table("conversation_history").insert({
                "user_id": user_id,
                "role": role,
                "content": content
            }).execute()
        except Exception as e:
            logger.error(f"Failed to save chat message: {e}")

    def get_recent_messages(self, user_id: str, limit: int = 10) -> List[Dict]:
        """
        Fetch the most recent N messages for a user, ordered chronologically.
        Returns a list of dicts: [{"role": "user", "content": "..."}, ...]
        """
        try:
            # We fetch ordering by created_at DESC to get the latest,
            # then we must reverse the list so they are in chronological order for the LLM.
            res = self.db.table("conversation_history")\
                .select("role, content")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
                
            messages = res.data or []
            messages.reverse()
            return messages
        except Exception as e:
            logger.error(f"Failed to fetch chat messages: {e}")
            return []
