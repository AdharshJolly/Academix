"""
Calendar Router
Provides read and write access to the user's connected Google Calendar.
Requires the user to have completed the Google OAuth flow first.
"""
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional

from app.core.security import verify_token
from app.integrations.calendar import GoogleCalendarClient
from app.repositories.user_repository import UserRepository
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calendar", tags=["calendar"])
user_repo = UserRepository()
calendar_client = GoogleCalendarClient()


class CreateEventRequest(BaseModel):
    title: str
    date: str                       # YYYY-MM-DD
    description: Optional[str] = ""
    all_day: bool = True
    start_time: Optional[str] = "09:00"   # HH:MM — used only if all_day=False
    duration_hours: Optional[float] = 1.0


class CalendarEventOut(BaseModel):
    id: Optional[str] = None
    title: str
    date: str
    description: Optional[str] = ""
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    all_day: bool = True
    type: str = "Google Calendar"
    source: str = "google"


@router.get("/events", response_model=APIResponse[list])
def get_calendar_events(
    year: int = Query(default=None, description="Year to fetch events for"),
    month: int = Query(default=None, description="Month to fetch events for (1-12)"),
    user: dict = Depends(verify_token),
):
    """
    Fetch events from the user's connected Google Calendar.
    Defaults to current month if year/month not specified.
    Returns empty list (not error) if calendar is not connected.
    """
    profile = user_repo.get_automation_profile(user["id"])

    if not profile or not profile.get("google_refresh_token"):
        # Not connected — return empty list gracefully so calendar still renders
        return APIResponse(
            success=True,
            message="Google Calendar not connected",
            data=[],
        )

    now = datetime.now(timezone.utc)
    y = year or now.year
    m = month or now.month

    # Fetch from start of the month to end of next month so navigation works
    time_min = datetime(y, m, 1, tzinfo=timezone.utc).isoformat()
    # End of next month
    if m == 12:
        time_max = datetime(y + 1, 2, 1, tzinfo=timezone.utc).isoformat()
    else:
        next_m = m + 1
        next_y = y
        if next_m == 13:
            next_m = 1
            next_y += 1
        # Two months ahead so prev/next nav has data ready
        if next_m + 1 > 12:
            end_y, end_m = next_y + 1, 1
        else:
            end_y, end_m = next_y, next_m + 1
        time_max = datetime(end_y, end_m, 1, tzinfo=timezone.utc).isoformat()

    try:
        events = calendar_client.list_events(
            refresh_token=profile["google_refresh_token"],
            time_min=time_min,
            time_max=time_max,
            max_results=100,
        )
        return APIResponse(
            success=True,
            message=f"Fetched {len(events)} calendar events",
            data=events,
        )
    except Exception as e:
        logger.error(f"Google Calendar list_events error for user {user['id']}: {e}")
        # Return empty — don't break the UI just because Google had a hiccup
        return APIResponse(
            success=True,
            message="Could not fetch Google Calendar events",
            data=[],
        )


@router.post("/events", response_model=APIResponse[dict])
def create_calendar_event(
    request: CreateEventRequest,
    user: dict = Depends(verify_token),
):
    """
    Create a new event in the user's connected Google Calendar.
    If calendar is not connected, returns a clear error message.
    """
    profile = user_repo.get_automation_profile(user["id"])

    if not profile or not profile.get("google_refresh_token"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Calendar is not connected. Go to Settings → Connect Google Calendar.",
        )

    try:
        if request.all_day:
            result = calendar_client.create_all_day_event(
                refresh_token=profile["google_refresh_token"],
                title=request.title,
                event_date=request.date,
                description=request.description or "",
            )
        else:
            result = calendar_client.create_timed_event(
                refresh_token=profile["google_refresh_token"],
                title=request.title,
                event_date=request.date,
                duration_hours=request.duration_hours or 1.0,
                start_time=request.start_time or "09:00",
                description=request.description or "",
            )

        start = result.get("start", {})
        return APIResponse(
            success=True,
            message="Event created in Google Calendar",
            data={
                "id": result.get("id"),
                "title": result.get("summary"),
                "date": start.get("date") or (start.get("dateTime") or "")[:10],
                "google_link": result.get("htmlLink"),
                "source": "google",
            },
        )
    except Exception as e:
        logger.error(f"Create calendar event error for user {user['id']}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create calendar event: {str(e)}",
        )
