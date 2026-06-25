"""
Intelligence Schemas

There is ONLY ONE public AI contract: IntelligenceRequest / IntelligenceResponse.
process_notice(), extract_event(), analyze_risk(), generate_schedule(),
generate_recommendations() are INTERNAL methods of AcademicIntelligenceEngine.

DO NOT create separate endpoints for risk, notices, or schedules.
"""
from pydantic import BaseModel
from typing import List, Optional, Literal


# ── Input ────────────────────────────────────────────────────────────────────

class IntelligenceRequest(BaseModel):
    """
    Unified AI input contract.
    input_type controls which internal engine methods are invoked.
    """
    input_type: Literal["notice", "risk", "schedule"]
    data: dict  # Flexible payload; validated internally by engine


# ── Sub-models ───────────────────────────────────────────────────────────────

class ExtractedEvent(BaseModel):
    title: str
    date: str           # ISO 8601: YYYY-MM-DD
    type: str           # exam | assignment | lecture | other
    subject: Optional[str] = None
    location: Optional[str] = None


class RiskFactor(BaseModel):
    factor: str
    weight: float


class RiskAssessment(BaseModel):
    risk_score: float                # 0.0 – 1.0 (deterministic, not AI)
    risk_level: str                  # low | medium | high | critical
    factors: List[RiskFactor]


class Recommendation(BaseModel):
    action: str
    priority: int       # 1 = highest
    rationale: Optional[str] = None


class ScheduleBlock(BaseModel):
    date: str           # ISO 8601
    subject: str
    duration_hours: float
    session_type: str   # study | revision | practice


# ── Output ───────────────────────────────────────────────────────────────────

class IntelligenceResponse(BaseModel):
    """Full AI pipeline output stored in intelligence_reports."""
    report_id: str
    input_type: str
    extracted_events: List[ExtractedEvent]
    risk_assessment: RiskAssessment
    recommendations: List[Recommendation]
    study_schedule: List[ScheduleBlock]

