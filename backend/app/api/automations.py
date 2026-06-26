"""
Automations Router
Receives Make.com callbacks and exposes automation logs.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status, Request

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
from app.integrations.telegram import TelegramClient
from app.services.ai.vision_extractor import VisionExtractor
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


@router.post("/test-telegram")
def test_telegram_connection(
    payload: dict,
    user: dict = Depends(verify_token),
):
    """
    Called from the frontend to test Telegram connectivity.
    Normally, the backend doesn't send messages directly (Make.com does).
    We just verify the username is linked or trigger a Make.com webhook if configured.
    For now, we return success so the frontend UI can show it works.
    """
    db = get_supabase()
    username = payload.get("telegram_username")
    if not username:
        return APIResponse(success=False, message="No username provided.")
        
    username_clean = username.strip("@")
    
    # We update the username in the DB first
    db.table("users").update({"telegram_username": username_clean}).eq("id", user["id"]).execute()
    
    return APIResponse(success=True, message="Backend confirmed! Now send /ping to the Telegram bot to test the full loop.")


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
    db_username = None

    if request.platform == "telegram":
        # First try chat_id
        user_res = db.table("users").select("id, telegram_username").eq("telegram_chat_id", request.sender_id).execute()
        if user_res.data:
            user_id = user_res.data[0]["id"]
            db_username = user_res.data[0].get("telegram_username")
        elif request.sender_username:
            # Fallback to username matching (handles people with @ and without @)
            username_clean = request.sender_username.strip("@")
            user_by_name = db.table("users").select("id, telegram_username").execute()
            
            for row in (user_by_name.data or []):
                db_uname = (row.get("telegram_username") or "").strip("@")
                if db_uname and db_uname.lower() == username_clean.lower():
                    user_id = row["id"]
                    db_username = db_uname
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
            message="Looks like this account isn't linked to Academix yet! Ensure your username is set in the web dashboard Settings first."
        )

    text_clean = request.text.strip().lower()
    
    if text_clean == "/ping":
        display_name = f"@{db_username}" if db_username else "your account"
        return IncomingMessageResponse(
            success=True,
            message=f"Pong! 🏓\nYour Telegram is successfully linked to {display_name} in Academix."
        )
        
    if text_clean == "/start" or newly_linked:
        return IncomingMessageResponse(
            success=True,
            message="✅ Telegram linked successfully! You can now forward any class announcements, notices, or deadlines here, and I'll add them to your Academix workspace and Google Calendar automatically."
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

@router.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    """
    Direct Telegram Webhook. 
    Replaces Make.com entirely. Handles text and images (via Gemini).
    """
    try:
        update = await request.json()
    except Exception:
        return {"ok": True}
        
    message = update.get("message", {})
    if not message:
        return {"ok": True}
        
    chat_id = str(message.get("chat", {}).get("id", ""))
    username = message.get("from", {}).get("username", "")
    
    if not chat_id:
        return {"ok": True}

    telegram_client = TelegramClient()
    
    # --- 1. Look up user early ---
    db = get_supabase()
    user_id = None
    
    user_res = db.table("users").select("id").eq("telegram_chat_id", chat_id).execute()
    if user_res.data:
        user_id = user_res.data[0]["id"]
    elif username:
        # Fallback to username
        username_clean = username.strip("@")
        user_by_name = db.table("users").select("id, telegram_username").execute()
        for row in (user_by_name.data or []):
            db_uname = (row.get("telegram_username") or "").strip("@")
            if db_uname and db_uname.lower() == username_clean.lower():
                user_id = row["id"]
                # Update their chat_id
                db.table("users").update({"telegram_chat_id": chat_id}).eq("id", user_id).execute()
                break
                
    if not user_id:
        await telegram_client.send_message(chat_id, "Looks like this account isn't linked to Academix yet! Ensure your username is set in the web dashboard Settings first.")
        return {"ok": True}
        
    text = message.get("text", "")
    
    # --- 2. Check for Documents (PDFs for RAG) ---
    document = message.get("document")
    if document:
        filename = document.get("file_name", "uploaded_doc.pdf")
        if filename.endswith(".pdf"):
            file_id = document.get("file_id")
            await telegram_client.send_message(chat_id, f"📥 Downloading {filename} and extracting knowledge...")
            
            doc_bytes = await telegram_client.get_file_bytes(file_id)
            if doc_bytes:
                try:
                    from app.services.ai.document_processor import DocumentProcessor
                    processor = DocumentProcessor()
                    chunks = await processor.process_and_store(user_id, filename, doc_bytes)
                    await telegram_client.send_message(chat_id, f"✅ Successfully processed {filename} into {chunks} chunks! You can now ask me questions about it.")
                    return {"ok": True}
                except Exception as e:
                    logger.error(f"Document processing failed: {e}")
                    await telegram_client.send_message(chat_id, "I couldn't read that PDF. Make sure it contains extractable text!")
                    return {"ok": True}
        else:
            await telegram_client.send_message(chat_id, "I currently only support .pdf files for study materials.")
            return {"ok": True}

    # --- 3. Check for Photos (Posters) ---
    photos = message.get("photo", [])
    if photos:
        best_photo = photos[-1]
        file_id = best_photo.get("file_id")
        
        img_bytes = await telegram_client.get_file_bytes(file_id)
        if img_bytes:
            try:
                vision = VisionExtractor()
                extracted_text = await vision.extract_text_from_image(img_bytes)
                text = f"[Image Uploaded] {extracted_text}"
            except Exception as e:
                logger.error(f"Vision extraction failed: {e}")
                await telegram_client.send_message(chat_id, "I received your image, but my vision sensors are offline right now!")
                return {"ok": True}
        else:
            await telegram_client.send_message(chat_id, "I couldn't download the image from Telegram. Try again later.")
            return {"ok": True}
            
    if not text:
        return {"ok": True}
        
    text_clean = text.strip().lower()
    if text_clean == "/start":
        await telegram_client.send_message(chat_id, "✅ Telegram linked successfully! You can now forward any class announcements, notices, or deadlines here, and I'll add them to your Academix workspace and Google Calendar automatically.")
        return {"ok": True}
    if text_clean == "/ping":
        await telegram_client.send_message(chat_id, "Pong! 🏓\nYour Telegram is successfully linked to Academix.")
        return {"ok": True}

    try:
        from app.services.ai.supervisor_agent import SupervisorAgent
        supervisor = SupervisorAgent()
        response_text = await supervisor.process_message(user_id=user_id, message=text)
        await telegram_client.send_message(chat_id, response_text)
    except Exception as e:
        logger.error(f"Error handling direct webhook message: {e}")
        await telegram_client.send_message(chat_id, "Oops, something went wrong inside Academix while processing that message.")

    # Always return 200 OK to Telegram so it doesn't retry
    return {"ok": True}
