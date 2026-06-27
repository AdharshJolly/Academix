"""
Dashboard Schemas

DashboardResponse is a PRESENTATION MODEL.
It must never expose raw database rows.
Every field is UI-ready.
"""
from pydantic import BaseModel
from typing import List, Optional


class AcademicHealthCard(BaseModel):
    risk_level: str          # low | medium | high | critical
    risk_score: float        # 0.0 – 1.0
    summary: str             # Human-readable summary sentence


class NextRecommendedAction(BaseModel):
    action: str
    priority: int
    due_in_hours: Optional[float] = None


class UpcomingDeadline(BaseModel):
    task_id: str
    title: str
    due_date: str
    priority: str
    days_remaining: int


class TodayScheduleItem(BaseModel):
    subject: str
    duration_hours: float
    session_type: str        # study | revision | practice
    start_time: Optional[str] = None


class CalendarEvent(BaseModel):
    title: str
    date: str
    type: str                # exam | assignment | lecture | other


class RecentAutomation(BaseModel):
    id: str
    workflow_type: str       # task | notice | schedule
    status: str              # pending | success | failed
    triggered_at: str


class CrunchWindow(BaseModel):
    start_date: str
    end_date: str
    deadline_count: int
    severity: str            # high | critical

class DashboardResponse(BaseModel):
    """
    Aggregated, UI-ready model returned by GET /api/v1/dashboard.
    Assembled from tasks, intelligence_reports, and automation_logs.
    """
    academic_health: AcademicHealthCard
    next_recommended_action: Optional[NextRecommendedAction] = None
    upcoming_deadlines: List[UpcomingDeadline]
    crunch_windows: List[CrunchWindow] = []
    today_schedule: List[TodayScheduleItem]
    calendar_preview: List[CalendarEvent]
    recent_automations: List[RecentAutomation]

