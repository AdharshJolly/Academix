"""
IntelligenceRepository
Data access layer for the intelligence_reports table.
All AI output is stored here — no separate AI tables.
"""
from app.schemas.intelligence import IntelligenceResponse


class IntelligenceRepository:

    def save(self, user_id: str, task_id: str | None, response: IntelligenceResponse) -> str:
        """Persist an intelligence report. Returns the generated report_id. TODO: Implement."""
        pass

    def get_latest_by_user(self, user_id: str) -> IntelligenceResponse | None:
        """Fetch the most recent intelligence report for a user. TODO: Implement."""
        pass

    def get_by_id(self, report_id: str, user_id: str) -> IntelligenceResponse:
        """Fetch a specific intelligence report. TODO: Implement."""
        pass

