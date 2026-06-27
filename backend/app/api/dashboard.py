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

def get_task_repo() -> TaskRepository:
    return TaskRepository()

def get_intelligence_repo() -> IntelligenceRepository:
    return IntelligenceRepository()

def get_automation_repo() -> AutomationRepository:
    return AutomationRepository()


@router.get("", response_model=APIResponse[DashboardResponse])
async def get_dashboard(
    user: dict = Depends(verify_token),
    task_repo: TaskRepository = Depends(get_task_repo),
    intelligence_repo: IntelligenceRepository = Depends(get_intelligence_repo),
    automation_repo: AutomationRepository = Depends(get_automation_repo)
):
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

        # ── 2. Academic health from current tasks (DYNAMIC) ────────────
        from app.services.risk_engine import RiskEngine
        risk_engine = RiskEngine()
        
        pending_task_count = len(upcoming_tasks)
        high_priority_count = sum(1 for t in upcoming_tasks if t.priority == 'high')
        event_count = sum(1 for t in upcoming_tasks if t.priority in ['high', 'critical'])
        
        if upcoming_deadlines:
            # Assumes upcoming_deadlines is sorted
            days_to_nearest = upcoming_deadlines[0].days_remaining
        else:
            days_to_nearest = 14 # default low risk
            
        risk = risk_engine.calculate_risk_score(
            days_to_nearest_deadline=days_to_nearest,
            pending_task_count=pending_task_count,
            event_count=event_count,
            high_priority_count=high_priority_count
        )
        
        academic_health = AcademicHealthCard(
            risk_level=risk.risk_level,
            risk_score=risk.risk_score,
            summary=_risk_summary(risk.risk_level, risk.risk_score),
        )

        # ── 3. Next recommended action (DYNAMIC) ────────────────────────────────────
        next_action: NextRecommendedAction | None = None
        if upcoming_deadlines:
            top_task = upcoming_deadlines[0] # Closest deadline
            
            action_text = f"Start working on '{top_task.title}'"
            if top_task.days_remaining <= 1:
                action_text = f"Urgent: Finish '{top_task.title}' today!"
                
            next_action = NextRecommendedAction(
                action=action_text,
                priority=top_task.days_remaining,
                due_in_hours=top_task.days_remaining * 24
            )

        # ── 4. Today's study schedule ─────────────────────────────────────
        today_schedule: list[TodayScheduleItem] = []
        latest_report = intelligence_repo.get_latest_by_user(user_id)
        
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
