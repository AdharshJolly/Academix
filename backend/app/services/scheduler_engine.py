"""
SchedulerEngine
Converts structured AI-extracted events into a concrete study schedule.
No AI involved — pure date arithmetic and slot allocation.
"""
from datetime import date, timedelta
from app.schemas.intelligence import ExtractedEvent, ScheduleBlock


class SchedulerEngine:
    """Allocates study sessions before each extracted academic event."""

    # How many study hours to plan per event type
    HOURS_BY_TYPE: dict[str, float] = {
        "exam":       6.0,
        "assignment": 3.0,
        "quiz":       2.0,
        "lecture":    1.0,
        "other":      2.0,
    }

    # Max study hours per day
    MAX_HOURS_PER_DAY = 6.0

    def generate_schedule(
        self,
        events: list[ExtractedEvent],
        days_ahead: int = 14,
    ) -> list[ScheduleBlock]:
        """
        Build a study schedule from extracted events.

        Strategy:
          For each event, work backwards from its deadline and
          allocate 2-hour study blocks, starting 1 day before the event.
          Skip days that already have 6+ hours allocated.

        Args:
            events:     List of ExtractedEvent with date fields
            days_ahead: Maximum days to plan into the future

        Returns:
            List of ScheduleBlock objects sorted by date
        """
        today = date.today()
        day_load: dict[date, float] = {}
        schedule: list[ScheduleBlock] = []

        # Sort events by date (closest first)
        sorted_events = sorted(
            events,
            key=lambda e: self._parse_date(e.date) or date.max,
        )

        for event in sorted_events:
            event_date = self._parse_date(event.date)
            if not event_date or event_date <= today:
                continue

            event_type = (event.type or "other").lower()
            total_hours = self.HOURS_BY_TYPE.get(event_type, 2.0)
            session_type = "revision" if event_type == "exam" else "study"
            session_hours = 2.0  # Each session = 2 hours
            sessions_needed = int(total_hours / session_hours)

            # Work backwards from event_date - 1
            current_day = min(event_date - timedelta(days=1), today + timedelta(days=days_ahead))
            sessions_placed = 0

            while sessions_placed < sessions_needed and current_day >= today:
                existing_load = day_load.get(current_day, 0.0)

                if existing_load + session_hours <= self.MAX_HOURS_PER_DAY:
                    schedule.append(ScheduleBlock(
                        date=current_day.isoformat(),
                        subject=event.subject or event.title,
                        duration_hours=session_hours,
                        session_type=session_type,
                    ))
                    day_load[current_day] = existing_load + session_hours
                    sessions_placed += 1

                current_day -= timedelta(days=1)

        # Sort final schedule by date
        schedule.sort(key=lambda b: b.date)
        return schedule

    @staticmethod
    def _parse_date(date_str: str) -> date | None:
        """Parse ISO 8601 date string (YYYY-MM-DD) into a date object."""
        try:
            return date.fromisoformat(date_str)
        except (ValueError, TypeError):
            return None
