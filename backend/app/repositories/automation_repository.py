"""
AutomationRepository
Data access layer for the automation_logs table.
"""


class AutomationRepository:

    def log(self, user_id: str, report_id: str | None,
            workflow_type: str, payload: dict) -> str:
        """Create an automation log entry. Returns log_id. TODO: Implement."""
        pass

    def update_status(self, log_id: str, status: str, response: dict) -> None:
        """Update log status after n8n webhook completes. TODO: Implement."""
        pass

    def get_recent_by_user(self, user_id: str, limit: int = 10) -> list:
        """Fetch recent automation logs for a user. TODO: Implement."""
        pass

