"""
Automations Router
Triggers n8n workflows for task, notice, and schedule automation.
"""
from fastapi import APIRouter
from app.schemas.automation import TriggerRequest, TriggerResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/automations", tags=["automations"])


@router.post("/task-trigger", response_model=APIResponse[TriggerResponse])
def trigger_task(request: TriggerRequest):
    """Trigger the n8n task automation workflow."""
    # TODO: Call n8n integration with task payload
    pass


@router.post("/notice-trigger", response_model=APIResponse[TriggerResponse])
def trigger_notice(request: TriggerRequest):
    """Trigger the n8n notice automation workflow."""
    # TODO: Call n8n integration with notice/report payload
    pass


@router.post("/schedule-trigger", response_model=APIResponse[TriggerResponse])
def trigger_schedule(request: TriggerRequest):
    """Trigger the n8n schedule automation workflow."""
    # TODO: Call n8n integration with schedule payload
    pass

