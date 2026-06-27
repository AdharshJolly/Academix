"""
Calendar Router
Provides read and write access to the user's connected Google Calendar.
Requires the user to have completed the Google OAuth flow first.
"""
import logging
from datetime import datetime, timedelta, timezone
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from typing import Optional
from pydantic import BaseModel

from app.core.security import verify_token
from app.integrations.calendar import GoogleCalendarClient
from app.repositories.user_repository import UserRepository
from app.schemas.common import APIResponse
from app.core.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calendar", tags=["calendar"])
def get_user_repo() -> UserRepository:
    return UserRepository()

def get_calendar_client() -> GoogleCalendarClient:
    return GoogleCalendarClient()


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


def _get_month_bounds(y: int, m: int):
    time_min = datetime(y, m, 1, tzinfo=timezone.utc).isoformat()
    if m == 12:
        time_max = datetime(y + 1, 1, 1, tzinfo=timezone.utc).isoformat()
    else:
        time_max = datetime(y, m + 1, 1, tzinfo=timezone.utc).isoformat()
    return time_min, time_max


def _fetch_and_cache_month(client: GoogleCalendarClient, refresh_token: str, user_id: str, y: int, m: int):
    cache_key = f"cal:{user_id}:{y}-{m}"
    if cache and cache.get(cache_key):
        return

    time_min, time_max = _get_month_bounds(y, m)
    try:
        events = client.list_events(refresh_token, time_min, time_max, 100)
        if cache:
            cache.setex(cache_key, 7200, json.dumps(events))  # 2 hours
        return events
    except Exception as e:
        logger.error(f"Calendar prefetch error for {y}-{m}: {e}")
        return []


def prefetch_surrounding_months(user_id: str, refresh_token: str, y: int, m: int):
    client = GoogleCalendarClient()
    
    # Prev month
    prev_m = 12 if m == 1 else m - 1
    prev_y = y - 1 if m == 1 else y
    _fetch_and_cache_month(client, refresh_token, user_id, prev_y, prev_m)
    
    # Next month
    next_m = 1 if m == 12 else m + 1
    next_y = y + 1 if m == 12 else y
    _fetch_and_cache_month(client, refresh_token, user_id, next_y, next_m)


@router.get("/events", response_model=APIResponse[list])
def get_calendar_events(
    background_tasks: BackgroundTasks,
    year: int = Query(default=None, description="Year to fetch events for"),
    month: int = Query(default=None, description="Month to fetch events for (1-12)"),
    user: dict = Depends(verify_token),
    user_repo: UserRepository = Depends(get_user_repo),
    calendar_client: GoogleCalendarClient = Depends(get_calendar_client),
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
    
    cache_key = f"cal:{user['id']}:{y}-{m}"
    
    events = None
    if cache:
        try:
            cached = cache.get(cache_key)
            if cached:
                events = json.loads(cached)
        except Exception as e:
            logger.error(f"Cache read error for calendar: {e}")

    if events is None:
        time_min, time_max = _get_month_bounds(y, m)
        try:
            events = calendar_client.list_events(
                refresh_token=profile["google_refresh_token"],
                time_min=time_min,
                time_max=time_max,
                max_results=100,
            )
            if cache:
                try:
                    cache.setex(cache_key, 7200, json.dumps(events))
                except Exception as e:
                    logger.error(f"Cache write error for calendar: {e}")
        except Exception as e:
            logger.error(f"Google Calendar list_events error for user {user['id']}: {e}")
            events = []

    # Fire off background prefetch for surrounding months
    background_tasks.add_task(
        prefetch_surrounding_months,
        user["id"],
        profile["google_refresh_token"],
        y,
        m
    )

    return APIResponse(
        success=True,
        message=f"Fetched {len(events)} calendar events",
        data=events,
    )

@router.post("/prefetch", response_model=APIResponse[dict])
def prefetch_calendar(
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_token),
    user_repo: UserRepository = Depends(get_user_repo),
):
    """
    Triggered on login to prefetch and cache the current, prev, and next month.
    Returns immediately.
    """
    profile = user_repo.get_automation_profile(user["id"])
    if not profile or not profile.get("google_refresh_token"):
        return APIResponse(success=True, message="Not connected")

    now = datetime.now(timezone.utc)
    
    # Cache current month immediately in background
    client = GoogleCalendarClient()
    background_tasks.add_task(
        _fetch_and_cache_month, 
        client, 
        profile["google_refresh_token"], 
        user["id"], 
        now.year, 
        now.month
    )
    # Then prefetch surrounding
    background_tasks.add_task(
        prefetch_surrounding_months,
        user["id"],
        profile["google_refresh_token"],
        now.year,
        now.month
    )
    
    return APIResponse(success=True, message="Prefetching started", data={"status": "prefetching"})

@router.post("/events", response_model=APIResponse[dict])
def create_calendar_event(
    request: CreateEventRequest,
    user: dict = Depends(verify_token),
    user_repo: UserRepository = Depends(get_user_repo),
    calendar_client: GoogleCalendarClient = Depends(get_calendar_client),
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
