"""
Intelligence Router

There is EXACTLY ONE AI endpoint: POST /intelligence/process.

All AI capabilities (notice understanding, event extraction,
risk analysis, schedule generation, recommendations) are INTERNAL
methods of AcademicIntelligenceEngine.

DO NOT add endpoints for:
  - /risk/analyze
  - /notices/process
  - /schedule/generate
"""
from fastapi import APIRouter
from app.schemas.intelligence import IntelligenceRequest, IntelligenceResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


@router.post("/process", response_model=APIResponse[IntelligenceResponse])
def process_intelligence(request: IntelligenceRequest):
    """
    Unified AI processing endpoint.
    Routes internally based on request.input_type: notice | risk | schedule
    TODO: Instantiate AcademicIntelligenceEngine and call process_notice(request)
    """
    pass

