"""
Intelligence Router
ONE endpoint only: POST /intelligence/process

All AI capabilities (notice understanding, event extraction,
risk analysis, schedule generation, recommendations) are INTERNAL
to AcademicIntelligenceEngine. Do NOT add more endpoints here.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks, UploadFile, File
from slowapi import Limiter
import uuid

from app.core.security import verify_token
from app.repositories.intelligence_repository import IntelligenceRepository
from app.schemas.common import APIResponse
from app.schemas.intelligence import IntelligenceRequest, IntelligenceResponse
from app.services.automation_service import AutomationService
from app.services.intelligence_engine import AcademicIntelligenceEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intelligence", tags=["intelligence"])

def get_auth_token_or_ip(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth.split(" ")[1]
    from slowapi.util import get_remote_address
    return get_remote_address(request)

limiter = Limiter(key_func=get_auth_token_or_ip)



from app.api.dependencies import get_intelligence_engine, get_intelligence_repo, get_automation_service


import asyncio
from app.core.ws_manager import manager

async def run_pipeline(
    report_id: str,
    request: IntelligenceRequest,
    user_id: str,
):
    try:
        engine = get_intelligence_engine()
        repo = get_intelligence_repo()
        automation = get_automation_service()
        
        from app.repositories.user_repository import UserRepository
        user_repo = UserRepository()
        user_profile = await asyncio.to_thread(user_repo.get_by_id, user_id)
        
        if isinstance(request.data, str):
            request.data = {"text": request.data}
        elif request.data is None:
            request.data = {}
            
        if user_profile and getattr(user_profile, 'attendance_percent', None) is not None:
            request.data["attendance_percent"] = user_profile.attendance_percent
        
        result = await asyncio.to_thread(engine.process_notice, request)
        result.report_id = report_id # ensure ID matches what we returned
        
        await asyncio.to_thread(repo.save, user_id=user_id, response=result, raw_input=str(request.data))
        await asyncio.to_thread(automation.run_for_intelligence, user_id=user_id, report=result)
        
        # Push completed report to connected WebSocket clients
        await manager.send(user_id, {
            "type": "INTELLIGENCE_REPORT_COMPLETE",
            "report_id": report_id,
            "report": result.model_dump()
        })
        
    except Exception as e:
        logger.error(f"Background AI pipeline failed: {e}")
        # Send error to client via WS
        await manager.send(user_id, {
            "type": "INTELLIGENCE_REPORT_FAILED",
            "report_id": report_id,
            "error": str(e)
        })
@router.post("/process")
@limiter.limit("10/minute")
def process_intelligence(
    request: Request,
    payload: IntelligenceRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_token),
):
    """
    Unified AI processing endpoint. Returns a report_id immediately.
    """
    report_id = str(uuid.uuid4())
    background_tasks.add_task(run_pipeline, report_id, payload, user["id"])
    return APIResponse(success=True, message="Processing started", data={"report_id": report_id, "status": "processing"})

@router.get("/status/{report_id}")
def get_report_status(
    report_id: str,
    user: dict = Depends(verify_token),
    intelligence_repo: IntelligenceRepository = Depends(get_intelligence_repo)
):
    # Wait for the background task to insert the report
    report = intelligence_repo.get_by_id(report_id, user["id"])
    if not report:
        return APIResponse(success=True, message="Processing", data={"status": "processing"})
    return APIResponse(success=True, message="Completed", data={"status": "completed", "report": report})

@router.post("/upload")
@limiter.limit("10/minute")
async def upload_notice(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(verify_token),
):
    """
    Process an uploaded image or PDF directly into an intelligence report.
    Returns immediately, pushes result via WebSocket.
    """
    contents = await file.read()
    
    if file.content_type == "application/pdf":
        from app.services.ai.document_processor import DocumentProcessor
        doc_processor = DocumentProcessor()
        text = doc_processor.extract_text_from_pdf(contents)
    else:
        from app.services.ai.vision_extractor import VisionExtractor
        vision_extractor = VisionExtractor()
        mime_type = file.content_type or "image/jpeg"
        text = await vision_extractor.extract_text_from_image(contents, mime_type)
        
    request_schema = IntelligenceRequest(input_type="notice", data={"text": text})
    report_id = str(uuid.uuid4())
    background_tasks.add_task(run_pipeline, report_id, request_schema, user["id"])
    return APIResponse(success=True, message="Processing started", data={"report_id": report_id, "status": "processing"})

@router.post("/upload/timetable")
@limiter.limit("10/minute")
async def upload_timetable(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(verify_token),
):
    """
    Parse a timetable image/PDF and register the subjects to the Attendance Tracker.
    """
    contents = await file.read()
    from app.services.ai.vision_extractor import VisionExtractor
    from app.repositories.attendance_repository import AttendanceRepository
    from app.schemas.attendance import AttendanceRecordCreate
    
    vision = VisionExtractor()
    mime = file.content_type or "image/jpeg"
    subjects = await vision.extract_timetable_subjects(contents, mime)
    
    if not subjects:
        return APIResponse(success=False, message="No subjects could be extracted from this image.")
        
    repo = AttendanceRepository()
    for sub in subjects:
        repo.create(user["id"], AttendanceRecordCreate(
            semester="Current Semester",
            subject_code=None,
            subject_name=sub,
            hours_conducted=0,
            hours_attended=0,
            target_percentage=75.0
        ))
    return APIResponse(success=True, message="Timetable processed", data={"subjects": subjects})

@router.post("/upload/material")
@limiter.limit("20/minute")
async def upload_study_material(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(verify_token),
):
    """
    Process a PDF and embed chunks into pgvector study_materials table.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are supported for study materials right now.")
        
    contents = await file.read()
    from app.services.ai.document_processor import DocumentProcessor
    doc_processor = DocumentProcessor()
    
    try:
        chunks_stored = await doc_processor.process_and_store(user["id"], file.filename or "unknown.pdf", contents)
        return APIResponse(success=True, message=f"Processed and stored {chunks_stored} chunks.", data={"chunks": chunks_stored})
    except Exception as e:
        logger.error(f"Failed to process study material: {e}")
        raise HTTPException(500, "Failed to process and store document.")

from pydantic import BaseModel
class ChatMessage(BaseModel):
    content: str

@router.get("/chat/history")
def get_chat_history(
    user: dict = Depends(verify_token),
):
    """Retrieve the recent chat history."""
    from app.repositories.chat_repository import ChatRepository
    chat_repo = ChatRepository()
    messages = chat_repo.get_recent_messages(user["id"], limit=50)
    return APIResponse(success=True, message="Chat history retrieved", data=messages)

@router.post("/chat")
def post_chat_message(
    message: ChatMessage,
    user: dict = Depends(verify_token),
):
    """Post a new message and get an AI response."""
    from app.repositories.chat_repository import ChatRepository
    from app.services.groq_client import GroqClient
    import os
    
    chat_repo = ChatRepository()
    # Save user message
    chat_repo.add_message(user["id"], "user", message.content)
    
    # Fetch recent context
    history = chat_repo.get_recent_messages(user["id"], limit=10)
    
    # Format for Groq
    groq_messages = [{"role": "system", "content": "You are Academix Copilot, a helpful AI academic assistant. Keep answers brief and conversational."}]
    for msg in history:
        groq_messages.append({"role": msg["role"], "content": msg["content"]})
        
    try:
        groq_client = GroqClient(api_key=os.getenv("GROQ_API_KEY"))
        ai_response_text = groq_client.generate_completion(groq_messages)
        # Save AI response
        chat_repo.add_message(user["id"], "assistant", ai_response_text)
        return APIResponse(success=True, message="Success", data={"role": "assistant", "content": ai_response_text})
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get AI response")
