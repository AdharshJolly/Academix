"""
Dashboard Router
Returns a single aggregated, UI-ready DashboardResponse.
Never exposes raw database rows.
"""
from fastapi import APIRouter, Depends
from app.schemas.dashboard import DashboardResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=APIResponse[DashboardResponse])
def get_dashboard():
    """
    Aggregate and return the full dashboard presentation model.
    Includes: academic health, upcoming deadlines, today's schedule,
    calendar preview, recent automations.
    TODO: Inject authenticated user via Depends(get_current_user)
    TODO: Assemble from TaskRepository, IntelligenceRepository, AutomationRepository
    """
    pass

