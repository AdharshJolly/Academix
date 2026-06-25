"""
Automations Router
Receives Make.com callbacks and exposes automation logs.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.security import verify_token
from app.core.settings import settings
from app.repositories.automation_repository import AutomationRepository
from app.schemas.automation import (
    AutomationCallbackResponse,
    AutomationLogCallback,
    AutomationLogResponse,
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/automations", tags=["automations"])
automation_repo = AutomationRepository()


@router.post("/log", response_model=AutomationCallbackResponse)
def log_automation_callback(
    request: AutomationLogCallback,
    authorization: str | None = Header(default=None),
):
    """Callback endpoint called by Make.com after Twilio WhatsApp delivery."""
    expected = f"Bearer {settings.AUTOMATION_CALLBACK_SECRET}"
    if not settings.AUTOMATION_CALLBACK_SECRET or authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid automation callback secret",
        )

    automation_repo.update_status(
        log_id=request.log_id,
        status=request.status,
        response={
            "workflow_type": request.workflow_type,
            "user_id": request.user_id,
            "whatsapp_status": request.status,
            "whatsapp_message_id": request.whatsapp_message_id,
            "error": request.error,
        },
    )
    return AutomationCallbackResponse(logged=True)


@router.get("/logs", response_model=APIResponse[list[AutomationLogResponse]])
def list_automation_logs(
    limit: int = 20,
    user: dict = Depends(verify_token),
):
    """Return recent automation logs for the authenticated user."""
    safe_limit = max(1, min(limit, 100))
    logs = [
        AutomationLogResponse(
            id=row["id"],
            workflow_type=row["workflow_type"],
            status=row["status"],
            triggered_at=row["triggered_at"],
            completed_at=row.get("completed_at"),
            payload=row.get("payload") or {},
            response=row.get("response") or {},
        )
        for row in automation_repo.get_recent_by_user(user["id"], limit=safe_limit)
    ]
    return APIResponse(success=True, message="Automation logs retrieved", data=logs)
