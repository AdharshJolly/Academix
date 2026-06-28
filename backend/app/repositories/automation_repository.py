"""
AutomationRepository
Data access layer for the automation_logs table.
"""
import logging
from datetime import datetime, timezone

from app.db.client import get_supabase, ScopedTable

logger = logging.getLogger(__name__)

TABLE = "automation_logs"


class AutomationRepository:
    def log(
        self,
        user_id: str,
        workflow_type: str,
        payload: dict,
        intelligence_report_id: str | None = None,
        status: str = "pending",
        response: dict | None = None,
    ) -> str:
        """Create an automation log entry and return the generated log_id."""
        db = ScopedTable(TABLE, user_id)
        insert_payload = {
            "intelligence_report_id": intelligence_report_id,
            "workflow_type": workflow_type,
            "status": status,
            "payload": payload,
            "response": response or {},
        }
        if status in ("success", "failed"):
            insert_payload["completed_at"] = self._now()

        result = db.insert(insert_payload).execute()
        return result.data[0]["id"]

    def update_status(
        self,
        log_id: str,
        status: str,
        response: dict | None = None,
    ) -> None:
        """Update log status after Calendar or callback work."""
        from typing import Any
        db = get_supabase()
        update_payload: dict[str, Any] = {"status": status}
        if status in ("success", "failed"):
            update_payload["completed_at"] = self._now()
        if response is not None:
            update_payload["response"] = response

        db.table(TABLE).update(update_payload).eq("id", log_id).execute()

    def get_recent_by_user(self, user_id: str, limit: int = 10) -> list[dict]:
        """Fetch recent automation logs for dashboard display."""
        db = ScopedTable(TABLE, user_id)
        result = (
            db.select("id, workflow_type, status, payload, response, triggered_at, completed_at")
            .order("triggered_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()
