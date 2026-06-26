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
    IncomingMessageWebhook,
    IncomingMessageResponse,
)
from app.schemas.common import APIResponse
from app.schemas.intelligence import IntelligenceRequest
from app.schemas.tasks import TaskCreate
from app.services.intelligence_engine import AcademicIntelligenceEngine
from app.repositories.task_repository import TaskRepository
from app.db.client import get_supabase
import logging

logger = logging.getLogger(__name__)

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
    IncomingMessageWebhook,
    IncomingMessageResponse,
)
from app.schemas.common import APIResponse
from app.schemas.intelligence import IntelligenceRequest
from app.schemas.tasks import TaskCreate
from app.services.intelligence_engine import AcademicIntelligenceEngine
from app.repositories.task_repository import TaskRepository
from app.db.client import get_supabase
import logging

logger = logging.getLogger(__name__)

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


@router.post("/incoming", response_model=IncomingMessageResponse)
def handle_incoming_message(
    request: IncomingMessageWebhook,
    authorization: str | None = Header(default=None),
):
    """
    Webhook for incoming forwarded messages via Telegram/WhatsApp (via Make.com).
    Extracts events using Groq and creates tasks in the user's workspace.
    """
    expected = f"Bearer {settings.AUTOMATION_CALLBACK_SECRET}"
    if not settings.AUTOMATION_CALLBACK_SECRET or authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret",
        )

    # 1. Look up user by platform sender_id
    db = get_supabase()
    
    user_id = None
    newly_linked = False

    if request.platform == "telegram":
        # First try chat_id
        user_res = db.table("users").select("id").eq("telegram_chat_id", request.sender_id).execute()
        if user_res.data:
            user_id = user_res.data[0]["id"]
        elif request.sender_username:
            # Fallback to username matching (handles people with @ and without @)
            username_clean = request.sender_username.strip("@")
            user_by_name = db.table("users").select("id, telegram_username").execute()
            
            for row in (user_by_name.data or []):
                db_username = (row.get("telegram_username") or "").strip("@")
                if db_username and db_username.lower() == username_clean.lower():
                    user_id = row["id"]
                    # We found them! Update their chat_id so we have it for future
                    db.table("users").update({"telegram_chat_id": request.sender_id}).eq("id", user_id).execute()
                    newly_linked = True
                    break
    else:
        # WhatsApp logic
        user_res = db.table("users").select("id").eq("whatsapp_number", request.sender_id).execute()
        if user_res.data:
            user_id = user_res.data[0]["id"]
    
    if not user_id:
        return IncomingMessageResponse(
            success=False,
            message="Looks like this account isn't linked to CampusFlow yet! Ensure your username is set in the web dashboard Settings first."
        )

    text_clean = request.text.strip().lower()
    if text_clean == "/start" or newly_linked:
        return IncomingMessageResponse(
            success=True,
            message="✅ Telegram linked successfully! You can now forward any class announcements, notices, or deadlines here, and I'll add them to your CampusFlow workspace and Google Calendar automatically."
        )

    # 2. Extract using Intelligence Engine
    engine = AcademicIntelligenceEngine()
    try:
        intel_req = IntelligenceRequest(
            input_type="notice",
            data={"text": request.text, "pending_task_count": 0}
        )
        intel_res = engine.process_notice(intel_req)
        events = intel_res.extracted_events
    except Exception as e:
        logger.error(f"Intelligence extraction failed: {e}")
        return IncomingMessageResponse(
            success=False,
            message="Sorry, I had trouble analyzing that message. Make sure it's a clear text announcement."
        )

    if not events:
        return IncomingMessageResponse(
            success=True,
            message="I read the message, but couldn't find any actionable deadlines, exams, or events in it."
        )

    # 3. Create Tasks
    task_repo = TaskRepository()
    added = 0
    for event in events:
        try:
            # We assume event.date is YYYY-MM-DD string that Pydantic can parse
            desc = f"Type: {event.type}"
            if event.subject:
                desc += f"\\nSubject: {event.subject}"
            if event.location:
                desc += f"\\nLocation: {event.location}"

            task_data = TaskCreate(
                title=event.title,
                description=desc,
                due_date=event.date if event.date and event.date != "unknown" else None,
                priority="high" if event.type in ["exam", "assignment"] else "medium"
            )
            task_repo.create(user_id=user_id, data=task_data)
            added += 1
        except Exception as e:
            logger.error(f"Failed to create task from event {event}: {e}")

    return IncomingMessageResponse(
        success=True,
        message=f"✅ I extracted {added} event(s) from your message and added them to your workspace."
    )
