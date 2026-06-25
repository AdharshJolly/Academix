"""
IntelligenceRepository
Data access layer for the intelligence_reports table.
All AI pipeline outputs are stored here.
"""
import json
import logging
from app.db.client import get_supabase
from app.schemas.intelligence import IntelligenceResponse

logger = logging.getLogger(__name__)

TABLE = "intelligence_reports"


class IntelligenceRepository:

    def save(
        self,
        user_id: str,
        response: IntelligenceResponse,
        task_id: str | None = None,
    ) -> str:
        """
        Persist a full IntelligenceResponse to the database.
        Returns the report_id.
        """
        db = get_supabase()
        payload = {
            "id": response.report_id,
            "user_id": user_id,
            "task_id": task_id,
            "input_type": response.input_type,
            "extracted_events": json.dumps(
                [e.model_dump() for e in response.extracted_events]
            ),
            "risk_assessment": json.dumps(response.risk_assessment.model_dump()),
            "recommendations": json.dumps(
                [r.model_dump() for r in response.recommendations]
            ),
            "study_schedule": json.dumps(
                [s.model_dump() for s in response.study_schedule]
            ),
        }
        db.table(TABLE).insert(payload).execute()
        return response.report_id

    def get_latest_by_user(self, user_id: str) -> IntelligenceResponse | None:
        """Fetch the most recent intelligence report for a user."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return self._deserialize(response.data[0])

    def get_by_id(self, report_id: str, user_id: str) -> IntelligenceResponse | None:
        """Fetch a specific intelligence report by ID, scoped to user."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("*")
            .eq("id", report_id)
            .eq("user_id", user_id)
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
            extracted_events=json.loads(row.get("extracted_events") or "[]"),
            risk_assessment=json.loads(row.get("risk_assessment") or "{}"),
            recommendations=json.loads(row.get("recommendations") or "[]"),
            study_schedule=json.loads(row.get("study_schedule") or "[]"),
        )
