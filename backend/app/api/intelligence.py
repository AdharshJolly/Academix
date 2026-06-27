"""
Intelligence Router
ONE endpoint only: POST /intelligence/process

All AI capabilities (notice understanding, event extraction,
risk analysis, schedule generation, recommendations) are INTERNAL
to AcademicIntelligenceEngine. Do NOT add more endpoints here.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_token
from app.repositories.intelligence_repository import IntelligenceRepository
from app.schemas.common import APIResponse
from app.schemas.intelligence import IntelligenceRequest, IntelligenceResponse
from app.services.automation_service import AutomationService
from app.services.intelligence_engine import AcademicIntelligenceEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/intelligence", tags=["intelligence"])

def get_intelligence_engine() -> AcademicIntelligenceEngine:
    return AcademicIntelligenceEngine()

def get_intelligence_repo() -> IntelligenceRepository:
    return IntelligenceRepository()

def get_automation_service() -> AutomationService:
    return AutomationService()


@router.post("/process", response_model=APIResponse[IntelligenceResponse])
def process_intelligence(
    request: IntelligenceRequest,
    user: dict = Depends(verify_token),
    intelligence_engine: AcademicIntelligenceEngine = Depends(get_intelligence_engine),
    intelligence_repo: IntelligenceRepository = Depends(get_intelligence_repo),
    automation_service: AutomationService = Depends(get_automation_service)
):
    """
    Unified AI processing endpoint.
    Routes internally based on request.input_type:
      - 'notice'   → extract events, risk, schedule, recommendations
      - 'risk'     → compute risk score + recommendations only
      - 'schedule' → generate study schedule from pre-known events
    """
    try:
        result = intelligence_engine.process_notice(request)

        # Persist the report
        intelligence_repo.save(user_id=user["id"], response=result, raw_input=str(request.data))
        automation_service.run_for_intelligence(user_id=user["id"], report=result)

        return APIResponse(
            success=True,
            message="Intelligence report generated",
            data=result,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"AI engine runtime error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service temporarily unavailable: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Intelligence processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process intelligence request: {str(e)}",
        )
