"""
AutomationRepository
Data access layer for the automation_logs table.
All n8n workflow executions are logged here.
"""
import json
import logging
from datetime import datetime
from app.db.client import get_supabase

logger = logging.getLogger(__name__)

TABLE = "automation_logs"


class AutomationRepository:

    def log(
        self,
        user_id: str,
        workflow_type: str,
        payload: dict,
        report_id: str | None = None,
    ) -> str:
        """
        Create an automation log entry with status 'pending'.
        Returns the generated log_id.
        """
        db = get_supabase()
        insert_payload = {
            "user_id": user_id,
            "report_id": report_id,
            "workflow_type": workflow_type,
            "status": "pending",
            "payload": json.dumps(payload),
        }
        response = db.table(TABLE).insert(insert_payload).execute()
        return response.data[0]["id"]

    def update_status(
        self,
        log_id: str,
        status: str,
        n8n_response: dict | None = None,
    ) -> None:
        """
        Update log status after n8n webhook completes.
        status: 'success' | 'failed'
        """
        db = get_supabase()
        update_payload = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat(),
        }
        if n8n_response:
            update_payload["n8n_response"] = json.dumps(n8n_response)

        db.table(TABLE).update(update_payload).eq("id", log_id).execute()

    def get_recent_by_user(self, user_id: str, limit: int = 10) -> list[dict]:
        """
        Fetch recent automation logs for dashboard display.
        Returns raw dicts for flexibility (converted in service layer).
        """
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("id, workflow_type, status, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
