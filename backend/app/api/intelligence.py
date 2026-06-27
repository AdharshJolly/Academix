"""
Intelligence Router
ONE endpoint only: POST /intelligence/process

All AI capabilities (notice understanding, event extraction,
risk analysis, schedule generation, recommendations) are INTERNAL
to AcademicIntelligenceEngine. Do NOT add more endpoints here.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
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



def get_intelligence_engine() -> AcademicIntelligenceEngine:
    return AcademicIntelligenceEngine()

def get_intelligence_repo() -> IntelligenceRepository:
    return IntelligenceRepository()

def get_automation_service() -> AutomationService:
    return AutomationService()


def run_pipeline(
    report_id: str,
    request: IntelligenceRequest,
    user_id: str,
):
    try:
        engine = AcademicIntelligenceEngine()
        repo = IntelligenceRepository()
        automation = AutomationService()
        
        result = engine.process_notice(request)
        result.report_id = report_id # ensure ID matches what we returned
        
        repo.save(user_id=user_id, response=result, raw_input=str(request.data))
        automation.run_for_intelligence(user_id=user_id, report=result)
        
    except Exception as e:
        logger.error(f"Background AI pipeline failed: {e}")
        # Ideally we'd save a failed status in the DB so the frontend knows it failed

@router.post("/process")
@limiter.limit("10/minute")
def process_intelligence(
    request_obj: Request,
    request: IntelligenceRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_token),
):
    """
    Unified AI processing endpoint. Returns a report_id immediately.
    """
    report_id = str(uuid.uuid4())
    background_tasks.add_task(run_pipeline, report_id, request, user["id"])
    return APIResponse(success=True, data={"report_id": report_id, "status": "processing"})

@router.get("/status/{report_id}")
def get_report_status(
    report_id: str,
    user: dict = Depends(verify_token),
    intelligence_repo: IntelligenceRepository = Depends(get_intelligence_repo)
):
    # Wait for the background task to insert the report
    report = intelligence_repo.get_by_id(report_id, user["id"])
    if not report:
        return APIResponse(success=True, data={"status": "processing"})
    return APIResponse(success=True, data={"status": "completed", "report": report})
