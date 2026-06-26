"""
AutomationService
Coordinates Calendar creation, Make.com WhatsApp delivery, and automation logs.
"""
from __future__ import annotations

import logging

from app.integrations.calendar import GoogleCalendarClient
from app.integrations.make import MakeClient
from app.repositories.automation_repository import AutomationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.intelligence import ExtractedEvent, IntelligenceResponse, ScheduleBlock
from app.schemas.tasks import TaskResponse

logger = logging.getLogger(__name__)


class AutomationService:
    def __init__(self):
        self._automation_repo = AutomationRepository()
        self._user_repo = UserRepository()
        self._calendar = GoogleCalendarClient()
        self._make = MakeClient()

    def run_for_task(
        self, 
        user_id: str, 
        task: TaskResponse, 
        add_to_calendar: bool = True, 
        reminder_time: str | None = "24h"
    ) -> None:
        message = self._task_message(task)
        base_payload = {
            "task_id": task.id,
            "title": task.title,
            "due_date": str(task.due_date) if task.due_date else None,
            "priority": task.priority,
            "reminder_time": reminder_time,
        }
        self._run(
            user_id=user_id,
            workflow_type="task",
            base_payload=base_payload,
            message=message,
            calendar_callback=lambda refresh_token: self._create_task_event(refresh_token, task) if add_to_calendar else {"calendar_status": "skipped", "reason": "user_opt_out"},
            skip_whatsapp=(reminder_time == "none"),
        )

    def run_for_intelligence(self, user_id: str, report: IntelligenceResponse) -> None:
        if report.input_type == "notice":
            message = (
                f"Notice Alert!\n"
                f"{len(report.extracted_events)} academic events have been extracted and added to your Google Calendar.\n"
                "Check your calendar for deadlines! - Academix"
            )
            self._run(
                user_id=user_id,
                workflow_type="notice",
                intelligence_report_id=report.report_id,
                base_payload={
                    "report_id": report.report_id,
                    "events_count": len(report.extracted_events),
                    "extracted_events": [event.model_dump() for event in report.extracted_events],
                },
                message=message,
                calendar_callback=lambda refresh_token: self._create_notice_events(refresh_token, report.extracted_events),
            )
        elif report.input_type == "schedule":
            message = (
                f"Study Plan Ready!\n"
                f"{len(report.study_schedule)} study blocks added to your Google Calendar.\n"
                "Stay on track! - Academix"
            )
            self._run(
                user_id=user_id,
                workflow_type="schedule",
                intelligence_report_id=report.report_id,
                base_payload={
                    "report_id": report.report_id,
                    "blocks_count": len(report.study_schedule),
                    "study_schedule": [block.model_dump() for block in report.study_schedule],
                },
                message=message,
                calendar_callback=lambda refresh_token: self._create_schedule_blocks(refresh_token, report.study_schedule),
            )

    def _run(
        self,
        user_id: str,
        workflow_type: str,
        base_payload: dict,
        message: str,
        calendar_callback,
        intelligence_report_id: str | None = None,
        skip_whatsapp: bool = False,
    ) -> None:
        profile = self._user_repo.get_automation_profile(user_id)
        if not profile:
            logger.warning("Skipping automation for missing user profile: %s", user_id)
            return

        payload = {
            **base_payload,
            "calendar_status": "pending",
            "whatsapp_status": "pending",
        }
        log_id = self._automation_repo.log(
            user_id=user_id,
            workflow_type=workflow_type,
            payload=payload,
            intelligence_report_id=intelligence_report_id,
        )

        calendar_response: dict = {}
        refresh_token = profile.get("google_refresh_token")
        if profile.get("google_calendar_connected") and refresh_token:
            try:
                calendar_response = calendar_callback(refresh_token)
                payload["calendar_status"] = "success"
                payload["calendar_result"] = calendar_response
            except Exception as exc:
                logger.error("Calendar automation failed [%s]: %s", workflow_type, exc)
                payload["calendar_status"] = "failed"
                self._automation_repo.update_status(
                    log_id,
                    "failed",
                    {**payload, "error": str(exc), "whatsapp_status": "skipped"},
                )
                return
        else:
            payload["calendar_status"] = "not_connected"

        if skip_whatsapp:
            payload["whatsapp_status"] = "skipped"
            self._automation_repo.update_status(log_id, "success", payload)
            return

        whatsapp_number = profile.get("whatsapp_number")
        if not whatsapp_number:
            payload["whatsapp_status"] = "not_configured"
            self._automation_repo.update_status(log_id, "success", payload)
            return

        make_payload = {
            "user_id": user_id,
            "log_id": log_id,
            "whatsapp_number": whatsapp_number,
            "message": message,
        }
        try:
            make_response = self._make.send_whatsapp(workflow_type, make_payload)
            payload["whatsapp_status"] = "sent_to_make"
            payload["make_response"] = make_response
            self._automation_repo.update_status(log_id, "pending", payload)
        except Exception as exc:
            logger.error("Make.com automation failed [%s]: %s", workflow_type, exc)
            payload["whatsapp_status"] = "failed"
            self._automation_repo.update_status(log_id, "failed", {**payload, "error": str(exc)})

    def _create_task_event(self, refresh_token: str, task: TaskResponse) -> dict:
        if not task.due_date:
            return {"calendar_status": "skipped", "reason": "task_has_no_due_date"}
        result = self._calendar.create_all_day_event(
            refresh_token=refresh_token,
            title=task.title,
            event_date=str(task.due_date),
            description="Tracked by Academix",
        )
        return {"event_ids": [result.get("id")], "links": [result.get("htmlLink")]}

    def _create_notice_events(self, refresh_token: str, events: list[ExtractedEvent]) -> dict:
        created = []
        for event in events:
            title = f"[{event.subject}] {event.title}" if event.subject else event.title
            result = self._calendar.create_all_day_event(
                refresh_token=refresh_token,
                title=title,
                event_date=event.date,
                description=f"Generated by Academix. Type: {event.type}",
            )
            created.append({"id": result.get("id"), "link": result.get("htmlLink")})
        return {"events_created": len(created), "events": created}

    def _create_schedule_blocks(self, refresh_token: str, blocks: list[ScheduleBlock]) -> dict:
        created = []
        for block in blocks:
            result = self._calendar.create_timed_event(
                refresh_token=refresh_token,
                title=f"Study: {block.subject}",
                event_date=block.date,
                duration_hours=block.duration_hours,
                description=f"Academix study block: {block.session_type}",
            )
            created.append({"id": result.get("id"), "link": result.get("htmlLink")})
        return {"blocks_created": len(created), "blocks": created}

    @staticmethod
    def _task_message(task: TaskResponse) -> str:
        due = str(task.due_date) if task.due_date else "No due date set"
        return (
            "Task Added!\n"
            f'"{task.title}" is due on {due}.\n'
            "Your Google Calendar has been updated! - Academix"
        )
