"""
Automations Router
Triggers Make.com workflows for academic task, notice, and schedule automations.
All workflow executions are logged in automation_logs.
"""
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_token
from app.integrations.make import MakeClient
from app.repositories.automation_repository import AutomationRepository
from app.schemas.automation import TriggerRequest, TriggerResponse
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/automations", tags=["automations"])

make_client = MakeClient()
automation_repo = AutomationRepository()


def _trigger(
    workflow_type: str,
    request: TriggerRequest,
    user: dict,
) -> APIResponse[TriggerResponse]:
    """Shared logic for all trigger endpoints."""
    user_id = user["id"]
    log_id = None

    try:
        # 1. Create a pending log entry
        log_id = automation_repo.log(
            user_id=user_id,
            workflow_type=workflow_type,
            payload=request.payload,
        )

        # 2. Trigger Make workflow
        make_payload = {
            "user_id": user_id,
            "log_id": log_id,
            "workflow_type": workflow_type,
            **request.payload,
        }
        make_response = make_client.trigger_workflow(workflow_type, make_payload)

        # 3. Mark as success
        automation_repo.update_status(log_id, "success", make_response)

        return APIResponse(
            success=True,
            message=f"{workflow_type.capitalize()} automation triggered successfully",
            data=TriggerResponse(
                workflow_type=workflow_type,
                status="success",
                log_id=log_id,
                message=f"Make.com {workflow_type} workflow triggered",
            ),
        )

    except RuntimeError as e:
        # Make.com connection failed — update log and return error
        if log_id:
            automation_repo.update_status(log_id, "failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        if log_id:
            automation_repo.update_status(log_id, "failed")
        logger.error(f"Automation [{workflow_type}] error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Automation failed: {str(e)}",
        )


@router.post("/task-trigger", response_model=APIResponse[TriggerResponse])
def trigger_task(
    request: TriggerRequest,
    user: dict = Depends(verify_token),
):
    """Trigger the Make.com task automation workflow (Calendar + WhatsApp for a task)."""
    return _trigger("task", request, user)


@router.post("/notice-trigger", response_model=APIResponse[TriggerResponse])
def trigger_notice(
    request: TriggerRequest,
    user: dict = Depends(verify_token),
):
    """Trigger the Make.com notice automation workflow (Calendar + WhatsApp from a notice report)."""
    return _trigger("notice", request, user)


@router.post("/schedule-trigger", response_model=APIResponse[TriggerResponse])
def trigger_schedule(
    request: TriggerRequest,
    user: dict = Depends(verify_token),
):
    """Trigger the Make.com schedule automation workflow (push study blocks to Calendar)."""
    return _trigger("schedule", request, user)
