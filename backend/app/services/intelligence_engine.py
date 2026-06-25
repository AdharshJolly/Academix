"""
AcademicIntelligenceEngine
The ONLY public AI service in CampusFlow.

Pipeline (notice input):
  1. Load prompt template (PromptManager)
  2. Call Groq AI (GroqClient)
  3. Extract JSON (JSONParser)
  4. Validate schema (ResponseValidator)
  5. Calculate risk deterministically (RiskEngine)
  6. Generate study schedule (SchedulerEngine)
  7. Format recommendations (RecommendationEngine)
  8. Return IntelligenceResponse

All internal engines (risk, scheduler, recommendation) are private.
Only process_notice() is exposed to the API layer.
"""
import json
import logging
import uuid
from datetime import date

from app.schemas.intelligence import (
    ExtractedEvent,
    IntelligenceRequest,
    IntelligenceResponse,
    Recommendation,
    RiskAssessment,
    RiskFactor,
    ScheduleBlock,
)
from app.services.ai.json_parser import JSONParser
from app.services.ai.prompt_manager import PromptManager
from app.services.ai.response_validator import ResponseValidator
from app.services.groq_client import GroqClient
from app.services.recommendation_engine import RecommendationEngine
from app.services.risk_engine import RiskEngine
from app.services.scheduler_engine import SchedulerEngine

logger = logging.getLogger(__name__)


class AcademicIntelligenceEngine:
    """
    Orchestrates the full academic intelligence pipeline.
    One public method: process_notice(request) → IntelligenceResponse
    """

    def __init__(self):
        self._groq = GroqClient()
        self._prompt_manager = PromptManager()
        self._json_parser = JSONParser()
        self._validator = ResponseValidator()
        self._risk_engine = RiskEngine()
        self._scheduler = SchedulerEngine()
        self._recommender = RecommendationEngine()

    # ─── Public API ──────────────────────────────────────────────────────────

    def process_notice(self, request: IntelligenceRequest) -> IntelligenceResponse:
        """
        Main entry point. Routes to internal methods based on input_type.
        Always returns a fully populated IntelligenceResponse.
        """
        logger.info(f"Processing intelligence request: input_type={request.input_type}")

        input_type = request.input_type
        data = request.data or {}

        if input_type == "notice":
            return self._handle_notice(data)
        elif input_type == "risk":
            return self._handle_risk(data)
        elif input_type == "schedule":
            return self._handle_schedule(data)
        else:
            raise ValueError(f"Unknown input_type: {input_type}")

    # ─── Internal Handlers ───────────────────────────────────────────────────

    def _handle_notice(self, data: dict) -> IntelligenceResponse:
        """Full pipeline: notice text → events → risk → schedule → recommendations."""
        notice_text = data.get("text") or data.get("notice") or ""
        if not notice_text.strip():
            raise ValueError("Notice text is required in data.text")

        # Step 1: Extract events from notice
        events = self.extract_event(notice_text)

        # Step 2: Calculate risk
        pending_tasks = int(data.get("pending_task_count", 3))
        risk = self.analyze_risk(events, pending_tasks)

        # Step 3: Generate study schedule
        schedule = self.generate_schedule(events)

        # Step 4: Generate recommendations
        recommendations = self.generate_recommendations(risk, events)

        return IntelligenceResponse(
            report_id=str(uuid.uuid4()),
            input_type="notice",
            extracted_events=events,
            risk_assessment=risk,
            recommendations=recommendations,
            study_schedule=schedule,
        )

    def _handle_risk(self, data: dict) -> IntelligenceResponse:
        """Risk-only pipeline: no notice, just task/event counts."""
        days_to_deadline = int(data.get("days_to_deadline", 7))
        pending_tasks = int(data.get("pending_task_count", 0))
        event_count = int(data.get("event_count", 0))
        high_priority = int(data.get("high_priority_count", 0))

        risk = self._risk_engine.calculate_risk_score(
            days_to_nearest_deadline=days_to_deadline,
            pending_task_count=pending_tasks,
            event_count=event_count,
            high_priority_count=high_priority,
        )

        recommendations = self.generate_recommendations(risk, [])

        return IntelligenceResponse(
            report_id=str(uuid.uuid4()),
            input_type="risk",
            extracted_events=[],
            risk_assessment=risk,
            recommendations=recommendations,
            study_schedule=[],
        )

    def _handle_schedule(self, data: dict) -> IntelligenceResponse:
        """Schedule-only pipeline: takes pre-known events and generates a plan."""
        raw_events = data.get("events", [])
        events = [ExtractedEvent(**e) for e in raw_events if isinstance(e, dict)]
        days_ahead = int(data.get("days_ahead", 14))

        schedule = self._scheduler.generate_schedule(events, days_ahead=days_ahead)
        risk = self.analyze_risk(events, pending_task_count=len(events))
        recommendations = self.generate_recommendations(risk, events)

        return IntelligenceResponse(
            report_id=str(uuid.uuid4()),
            input_type="schedule",
            extracted_events=events,
            risk_assessment=risk,
            recommendations=recommendations,
            study_schedule=schedule,
        )

    # ─── Internal Engine Methods ──────────────────────────────────────────────

    def extract_event(self, raw_text: str) -> list[ExtractedEvent]:
        """
        Extract structured academic events from raw notice text using Groq AI.
        Validates output against ExtractedEvent schema.
        """
        system = self._prompt_manager.get_system_prompt()
        prompt = self._prompt_manager.get_notice_extraction_prompt(raw_text)

        raw_output = self._groq.generate_json(prompt, system=system)
        parsed = self._json_parser.safe_extract(raw_output, fallback={})

        # Handle both {"extracted_events": [...]} and direct array
        events_data = parsed.get("extracted_events") or parsed.get("events") or []
        if not isinstance(events_data, list):
            events_data = []

        events: list[ExtractedEvent] = []
        for item in events_data:
            try:
                events.append(self._validator.validate(item, ExtractedEvent))
            except (ValueError, Exception) as e:
                logger.warning(f"Skipping invalid event: {e}")
                continue

        return events

    def analyze_risk(
        self,
        events: list[ExtractedEvent],
        pending_task_count: int = 0,
    ) -> RiskAssessment:
        """
        Calculate deterministic academic risk score.
        Delegates entirely to RiskEngine — no AI involved.
        """
        from datetime import date

        # Find days to nearest event deadline
        today = date.today()
        days_to_nearest = 30  # default: assume no immediate deadline

        for event in events:
            try:
                event_date = date.fromisoformat(event.date)
                delta = (event_date - today).days
                if 0 < delta < days_to_nearest:
                    days_to_nearest = delta
            except (ValueError, TypeError):
                continue

        high_priority_count = sum(
            1 for e in events if (e.type or "").lower() in ("exam", "quiz")
        )

        return self._risk_engine.calculate_risk_score(
            days_to_nearest_deadline=days_to_nearest,
            pending_task_count=pending_task_count,
            event_count=len(events),
            high_priority_count=high_priority_count,
        )

    def generate_schedule(
        self,
        events: list[ExtractedEvent],
        days_ahead: int = 14,
    ) -> list[ScheduleBlock]:
        """Generate study schedule from events. Delegates to SchedulerEngine."""
        return self._scheduler.generate_schedule(events, days_ahead=days_ahead)

    def generate_recommendations(
        self,
        risk: RiskAssessment,
        events: list[ExtractedEvent],
    ) -> list[Recommendation]:
        """
        Generate recommendations via AI, then format via RecommendationEngine.
        Falls back to deterministic recommendations if AI fails.
        """
        # Try AI recommendations
        ai_recs_raw: list[dict] = []
        try:
            system = self._prompt_manager.get_system_prompt()
            prompt = self._prompt_manager.get_recommendation_prompt(
                risk_score=risk.risk_score,
                risk_level=risk.risk_level,
                risk_factors_json=json.dumps(
                    [f.model_dump() for f in risk.factors], indent=2
                ),
                events_json=json.dumps(
                    [e.model_dump() for e in events], indent=2
                ),
            )
            raw_output = self._groq.generate_json(prompt, system=system)
            parsed = self._json_parser.safe_extract(raw_output, fallback={})
            ai_recs_raw = parsed.get("recommendations") or []
        except Exception as e:
            logger.warning(f"AI recommendation generation failed: {e}. Using fallback.")

        return self._recommender.format_recommendations(ai_recs_raw, risk, events)
