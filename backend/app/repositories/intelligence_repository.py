"""
IntelligenceRepository
Data access layer for the intelligence_reports table.
All AI pipeline outputs are stored here.
"""
import logging
from app.db.client import get_supabase_admin, ScopedTable
from app.schemas.intelligence import IntelligenceResponse

logger = logging.getLogger(__name__)

TABLE = "intelligence_reports"


from app.core.cache import invalidate_dashboard_cache

class IntelligenceRepository:

    def save(
        self,
        user_id: str,
        response: IntelligenceResponse,
        raw_input: str,
        task_id: str | None = None,
    ) -> str:
        """
        Persist a full IntelligenceResponse to the database.
        Returns the report_id.
        """
        db = ScopedTable(TABLE, user_id)
        payload = {
            "id": response.report_id,
            "task_id": task_id,
            "input_type": response.input_type,
            "raw_input": raw_input,
            "extracted_events": [e.model_dump() for e in response.extracted_events],
            "risk_assessment": response.risk_assessment.model_dump(),
            "recommendations": [r.model_dump() for r in response.recommendations],
            "study_schedule": [s.model_dump() for s in response.study_schedule],
            "risk_score": response.risk_assessment.risk_score,
        }
        db.insert(payload).execute()
        invalidate_dashboard_cache(user_id)
        return response.report_id

    def get_latest_by_user(self, user_id: str) -> IntelligenceResponse | None:
        """Fetch the most recent intelligence report for a user."""
        db = ScopedTable(TABLE, user_id)
        response = (
            db.select("*")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return self._deserialize(response.data[0])

    def get_by_id(self, report_id: str, user_id: str) -> IntelligenceResponse | None:
        """Fetch a specific intelligence report by ID, scoped to user."""
        db = ScopedTable(TABLE, user_id)
        response = (
            db.select("*")
            .eq("id", report_id)
            .single()
            .execute()
        )
        if not response.data:
            return None
        return self._deserialize(response.data)

    @staticmethod
    def _deserialize(row: dict) -> IntelligenceResponse:
        """Convert a database row back into an IntelligenceResponse."""
        return IntelligenceResponse(
            report_id=row["id"],
            input_type=row["input_type"],
            extracted_events=row.get("extracted_events") or [],
            risk_assessment=row.get("risk_assessment") or {},
            recommendations=row.get("recommendations") or [],
            study_schedule=row.get("study_schedule") or [],
        )
