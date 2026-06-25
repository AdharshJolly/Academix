"""
Dashboard Router
Returns a single aggregated, UI-ready DashboardResponse.
Never exposes raw database rows.
"""
import logging
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_token
from app.repositories.automation_repository import AutomationRepository
from app.repositories.intelligence_repository import IntelligenceRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.common import APIResponse
from app.schemas.dashboard import (
    AcademicHealthCard,
    CalendarEvent,
    DashboardResponse,
    NextRecommendedAction,
    RecentAutomation,
    TodayScheduleItem,
    UpcomingDeadline,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

task_repo = TaskRepository()
intelligence_repo = IntelligenceRepository()
automation_repo = AutomationRepository()


@router.get("", response_model=APIResponse[DashboardResponse])
async def get_dashboard(user: dict = Depends(verify_token)):
    """
    Aggregate and return the full dashboard presentation model.
    Assembles from: tasks, intelligence_reports, automation_logs.
    """
    try:
        user_id = user["id"]
        today = date.today()

        # ── 1. Upcoming deadlines from tasks ──────────────────────────────
        upcoming_tasks = task_repo.get_upcoming(user_id, limit=5)
        upcoming_deadlines: list[UpcomingDeadline] = []

        for task in upcoming_tasks:
            if task.due_date:
                try:
                    task_date = task.due_date if isinstance(task.due_date, date) else date.fromisoformat(str(task.due_date))
                    days_remaining = (task_date - today).days
                except (ValueError, TypeError):
                    days_remaining = 0

                upcoming_deadlines.append(UpcomingDeadline(
                    task_id=task.id,
                    title=task.title,
                    due_date=str(task.due_date),
                    priority=task.priority,
                    days_remaining=max(0, days_remaining),
                ))

        # ── 2. Academic health from latest intelligence report ────────────
        latest_report = intelligence_repo.get_latest_by_user(user_id)

        if latest_report and latest_report.risk_assessment:
            risk = latest_report.risk_assessment
            academic_health = AcademicHealthCard(
                risk_level=risk.risk_level,
                risk_score=risk.risk_score,
                summary=_risk_summary(risk.risk_level, risk.risk_score),
            )
        else:
            academic_health = AcademicHealthCard(
                risk_level="low",
                risk_score=0.0,
                summary="No intelligence report yet. Process a notice to see your academic health.",
            )

        # ── 3. Next recommended action ────────────────────────────────────
        next_action: NextRecommendedAction | None = None
        if latest_report and latest_report.recommendations:
            top = latest_report.recommendations[0]
            next_action = NextRecommendedAction(
                action=top.action,
                priority=top.priority,
            )

        # ── 4. Today's study schedule ─────────────────────────────────────
        today_schedule: list[TodayScheduleItem] = []
        if latest_report and latest_report.study_schedule:
            today_str = today.isoformat()
            today_schedule = [
                TodayScheduleItem(
                    subject=block.subject,
                    duration_hours=block.duration_hours,
                    session_type=block.session_type,
                )
                for block in latest_report.study_schedule
                if block.date == today_str
            ]

        # ── 5. Calendar preview (next 7 days of events) ───────────────────
        calendar_preview: list[CalendarEvent] = []
        if latest_report and latest_report.extracted_events:
            for event in latest_report.extracted_events[:5]:
                calendar_preview.append(CalendarEvent(
                    title=event.title,
                    date=event.date,
                    type=event.type,
                ))

        # ── 6. Recent automations ─────────────────────────────────────────
        automation_logs = automation_repo.get_recent_by_user(user_id, limit=5)
        recent_automations = [
            RecentAutomation(
                id=log["id"],
                workflow_type=log["workflow_type"],
                status=log["status"],
                triggered_at=log["triggered_at"],
            )
            for log in automation_logs
        ]

        dashboard = DashboardResponse(
            academic_health=academic_health,
            next_recommended_action=next_action,
            upcoming_deadlines=upcoming_deadlines,
            today_schedule=today_schedule,
            calendar_preview=calendar_preview,
            recent_automations=recent_automations,
        )

        return APIResponse(
            success=True,
            message="Dashboard loaded",
            data=dashboard,
        )

    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard: {str(e)}",
        )


def _risk_summary(level: str, score: float) -> str:
    """Generate a human-readable risk summary sentence."""
    pct = int(score * 100)
    summaries = {
        "low": f"Academic load is manageable ({pct}% risk). Keep up the good work.",
        "medium": f"Moderate academic pressure detected ({pct}% risk). Stay on track.",
        "high": f"High academic risk ({pct}%). Immediate action recommended.",
        "critical": f"Critical academic risk ({pct}%)! Take action now to avoid falling behind.",
    }
    return summaries.get(level, f"Academic risk score: {pct}%")
