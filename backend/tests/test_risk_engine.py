import pytest
from app.services.risk_engine import RiskEngine

engine = RiskEngine()

@pytest.mark.parametrize("days,tasks,events,high,expected_level", [
    (1,  10, 5, 5, "critical"),
    (3,   5, 3, 2, "high"),
    (7,   3, 1, 0, "medium"),
    (30,  0, 0, 0, "low"),
])
def test_risk_levels(days, tasks, events, high, expected_level):
    result = engine.calculate_risk_score(days, tasks, events, high)
    assert result.risk_level == expected_level
    assert 0.0 <= result.risk_score <= 1.0
