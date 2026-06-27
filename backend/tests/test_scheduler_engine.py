import pytest
from datetime import date, timedelta
from unittest.mock import patch
from app.services.scheduler_engine import SchedulerEngine
from app.schemas.intelligence import ExtractedEvent

engine = SchedulerEngine()

def make_event(title: str, days_from_now: int, event_type: str = "exam", subject: str = "Math") -> ExtractedEvent:
    d = (date.today() + timedelta(days=days_from_now)).isoformat()
    return ExtractedEvent(title=title, date=d, type=event_type, subject=subject)

class TestScheduleGeneration:
    def test_past_events_are_skipped(self):
        past_event = ExtractedEvent(title="Old Exam", date="2020-01-01", type="exam", subject="History")
        schedule = engine.generate_schedule([past_event])
        assert schedule == []

    def test_future_exam_generates_sessions_before_it(self):
        event = make_event("Calculus Final", days_from_now=7)
        with patch.object(engine, '_estimate_hours_with_ai', return_value=4.0):
            schedule = engine.generate_schedule([event])
        assert len(schedule) > 0
        event_date = date.today() + timedelta(days=7)
        for block in schedule:
            assert date.fromisoformat(block.date) < event_date

    def test_no_sessions_exceed_max_daily_hours(self):
        events = [make_event(f"Exam {i}", days_from_now=5) for i in range(5)]
        with patch.object(engine, '_estimate_hours_with_ai', return_value=6.0):
            schedule = engine.generate_schedule(events, days_ahead=14)
        from collections import defaultdict
        daily = defaultdict(float)
        for block in schedule:
            daily[block.date] += block.duration_hours
        for day, total in daily.items():
            assert total <= engine.MAX_HOURS_PER_DAY, f"Day {day} exceeded max: {total}h"

    def test_schedule_is_sorted_by_date(self):
        events = [make_event("Event A", 10), make_event("Event B", 5), make_event("Event C", 8)]
        with patch.object(engine, '_estimate_hours_with_ai', return_value=2.0):
            schedule = engine.generate_schedule(events)
        dates = [block.date for block in schedule]
        assert dates == sorted(dates)

    def test_exam_sessions_have_revision_type(self):
        event = make_event("Finals", days_from_now=5, event_type="exam")
        with patch.object(engine, '_estimate_hours_with_ai', return_value=2.0):
            schedule = engine.generate_schedule([event])
        assert all(b.session_type == "revision" for b in schedule)

    def test_assignment_sessions_have_study_type(self):
        event = make_event("Report Due", days_from_now=5, event_type="assignment")
        with patch.object(engine, '_estimate_hours_with_ai', return_value=2.0):
            schedule = engine.generate_schedule([event])
        assert all(b.session_type == "study" for b in schedule)

    def test_parse_date_handles_invalid_input(self):
        assert engine._parse_date("not-a-date") is None
        assert engine._parse_date("") is None
        assert engine._parse_date(None) is None
