import pytest
from unittest.mock import MagicMock, patch
from app.services.intelligence_engine import AcademicIntelligenceEngine
from app.schemas.intelligence import IntelligenceRequest

VALID_EVENTS_JSON = '{"extracted_events": [{"title": "Midterm", "date": "2026-09-15", "type": "exam", "subject": "Math", "location": null}]}'
MALFORMED_JSON = "Here are the events: sorry I forgot the JSON!"
EMPTY_EVENTS = '{"extracted_events": []}'

@pytest.fixture
def engine():
    with patch("app.services.intelligence_engine.GroqClient") as MockGroq, \
         patch("app.services.intelligence_engine.PromptManager"):
        mock_groq = MockGroq.return_value
        e = AcademicIntelligenceEngine()
        e._groq = mock_groq
        yield e, mock_groq

class TestNoticeProcessing:
    def test_valid_notice_returns_intelligence_response(self, engine):
        eng, mock_groq = engine
        mock_groq.generate_json.return_value = VALID_EVENTS_JSON
        request = IntelligenceRequest(input_type="notice", data={"text": "Midterm on Sept 15"})
        result = eng.process_notice(request)
        assert result is not None
        assert len(result.extracted_events) == 1
        assert result.extracted_events[0].title == "Midterm"

    def test_malformed_ai_response_does_not_raise(self, engine):
        eng, mock_groq = engine
        mock_groq.generate_json.return_value = MALFORMED_JSON
        request = IntelligenceRequest(input_type="notice", data={"text": "some notice text"})
        # Should not raise \u2014 fallback to empty events
        result = eng.process_notice(request)
        assert result is not None

    def test_empty_events_triggers_zero_risk(self, engine):
        eng, mock_groq = engine
        mock_groq.generate_json.return_value = EMPTY_EVENTS
        request = IntelligenceRequest(input_type="notice", data={"text": "Nothing happening"})
        result = eng.process_notice(request)
        assert result.extracted_events == []

    def test_groq_exception_returns_fallback_not_500(self, engine):
        eng, mock_groq = engine
        mock_groq.generate_json.side_effect = RuntimeError("Groq is down")
        request = IntelligenceRequest(input_type="notice", data={"text": "An exam is coming"})
        # The engine should catch and return a degraded result, not crash
        result = eng.process_notice(request)
        assert result is not None

    def test_report_id_is_populated(self, engine):
        eng, mock_groq = engine
        mock_groq.generate_json.return_value = VALID_EVENTS_JSON
        request = IntelligenceRequest(input_type="notice", data={"text": "Exam on Sept 15"})
        result = eng.process_notice(request)
        assert result.report_id is not None and result.report_id != ""
