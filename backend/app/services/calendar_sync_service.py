import logging
from typing import List
from app.repositories.user_repository import UserRepository
from app.integrations.calendar import GoogleCalendarClient
from app.schemas.tasks import TaskCreate
from app.schemas.intelligence import ExtractedEvent, ScheduleBlock

logger = logging.getLogger(__name__)

class CalendarSyncService:
    """
    Handles syncing extracted tasks and study schedules to Google Calendar.
    Designed to be run in background threads.
    """
    def __init__(self):
        self.user_repo = UserRepository()
        self.calendar_client = GoogleCalendarClient()
        
    def get_busy_periods(self, user_id: str, days: int = 14) -> str:
        """
        Returns a formatted string of busy periods for the LLM to avoid scheduling conflicts.
        """
        profile = self.user_repo.get_automation_profile(user_id)
        if not profile or not profile.get("google_calendar_connected"):
            return "No calendar connected."
            
        refresh_token = profile.get("google_refresh_token")
        if not refresh_token:
            return "No calendar connected."
            
        try:
            from datetime import datetime, timedelta, timezone
            now = datetime.now(timezone.utc)
            end = now + timedelta(days=days)
            
            busy_slots = self.calendar_client.get_free_busy(
                refresh_token=refresh_token,
                time_min=now.isoformat(),
                time_max=end.isoformat()
            )
            
            if not busy_slots:
                return "The user has no busy periods. You can schedule anytime."
                
            formatted = []
            for slot in busy_slots:
                start = datetime.fromisoformat(slot["start"]).strftime("%Y-%m-%d %H:%M")
                end_time = datetime.fromisoformat(slot["end"]).strftime("%Y-%m-%d %H:%M")
                formatted.append(f"Busy from {start} to {end_time}")
                
            return "\n".join(formatted)
        except Exception as e:
            logger.error(f"Failed to fetch busy periods: {e}")
            return "Failed to fetch calendar. Assume flexible schedule."

    def sync_events_background(self, user_id: str, events: List[ExtractedEvent]) -> None:
        """Syncs extracted events/tasks to Google Calendar."""
        profile = self.user_repo.get_automation_profile(user_id)
        if not profile:
            logger.info(f"Sync skipped: Profile not found for {user_id}")
            return
            
        refresh_token = profile.get("google_refresh_token")
        if not profile.get("google_calendar_connected") or not refresh_token:
            logger.info(f"Sync skipped: Google Calendar not connected for {user_id}")
            return
            
        for event in events:
            try:
                # If there's a specific date, we create an all-day event
                # In the future, we could add time extraction logic here too.
                if event.date and event.date != "unknown":
                    desc = f"Type: {event.type}"
                    if getattr(event, "subject", None):
                        desc += f"\nSubject: {event.subject}"
                    if getattr(event, "location", None):
                        desc += f"\nLocation: {event.location}"
                        
                    self.calendar_client.create_all_day_event(
                        refresh_token=refresh_token,
                        title=event.title,
                        event_date=event.date,
                        description=desc
                    )
            except Exception as e:
                logger.error(f"Failed to sync event {event.title} to calendar: {e}")

    def _find_free_slot(self, date_str: str, duration_hours: float, busy_slots: list, already_scheduled: list) -> str:
        """Finds a free time slot starting from 09:00 that fits duration_hours."""
        from datetime import datetime, time, timedelta
        
        start_time = datetime.strptime(f"{date_str} 09:00", "%Y-%m-%d %H:%M")
        end_of_day = datetime.strptime(f"{date_str} 22:00", "%Y-%m-%d %H:%M")
        
        # Combine external busy slots and our newly scheduled blocks
        all_busy = []
        for b in busy_slots:
            try:
                # parse RFC3339
                b_start = datetime.fromisoformat(b["start"].replace('Z', '+00:00'))
                b_end = datetime.fromisoformat(b["end"].replace('Z', '+00:00'))
                # Just comparing local naive time for simplicity
                all_busy.append((b_start.replace(tzinfo=None), b_end.replace(tzinfo=None)))
            except:
                pass
                
        all_busy.extend(already_scheduled)
        all_busy.sort(key=lambda x: x[0])
        
        current = start_time
        while current + timedelta(hours=duration_hours) <= end_of_day:
            proposed_end = current + timedelta(hours=duration_hours)
            conflict = False
            for (b_start, b_end) in all_busy:
                # If proposed slot overlaps with busy slot
                if (current < b_end and proposed_end > b_start):
                    conflict = True
                    # Jump current to the end of this busy block
                    current = b_end
                    break
            
            if not conflict:
                return current.strftime("%H:%M")
                
            # If no conflict, we would have returned. Otherwise loop continues.
            # If current didn't jump past a busy block (e.g. edge case), advance by 30 mins
            if conflict and current < proposed_end:
                current += timedelta(minutes=30)
                
        return "09:00" # Fallback if no slot found

    def sync_schedules_background(self, user_id: str, schedules: List[ScheduleBlock]) -> None:
        """Syncs study schedule blocks to Google Calendar in free slots."""
        profile = self.user_repo.get_automation_profile(user_id)
        if not profile:
            logger.info(f"Sync skipped: Profile not found for {user_id}")
            return
            
        refresh_token = profile.get("google_refresh_token")
        if not profile.get("google_calendar_connected") or not refresh_token:
            logger.info(f"Sync skipped: Google Calendar not connected for {user_id}")
            return
            
        # Group schedules by date
        from collections import defaultdict
        schedules_by_date = defaultdict(list)
        for block in schedules:
            if block.date and block.date != "unknown":
                schedules_by_date[block.date].append(block)
                
        for date_str, blocks in schedules_by_date.items():
            try:
                from datetime import datetime, timedelta, timezone
                # Fetch freebusy for this specific date
                start_dt = datetime.fromisoformat(f"{date_str}T00:00:00").replace(tzinfo=timezone.utc)
                end_dt = start_dt + timedelta(days=1)
                
                busy_slots = self.calendar_client.get_free_busy(
                    refresh_token=refresh_token,
                    time_min=start_dt.isoformat(),
                    time_max=end_dt.isoformat()
                )
                
                already_scheduled = []
                
                for block in blocks:
                    duration_hours = block.duration_minutes / 60.0
                    start_time = self._find_free_slot(date_str, duration_hours, busy_slots, already_scheduled)
                    
                    # Track this new block so next blocks don't overlap
                    b_start = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M")
                    b_end = b_start + timedelta(hours=duration_hours)
                    already_scheduled.append((b_start, b_end))
                    
                    self.calendar_client.create_timed_event(
                        refresh_token=refresh_token,
                        title=f"Study: {block.focus_topic}",
                        event_date=date_str,
                        duration_hours=duration_hours,
                        start_time=start_time,
                        description=f"Generated by Academix AI.\nSubject: {block.subject}"
                    )
            except Exception as e:
                logger.error(f"Failed to sync schedule for {date_str}: {e}")
