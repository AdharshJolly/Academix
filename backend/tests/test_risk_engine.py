import pytest
from app.services.risk_engine import RiskEngine

engine = RiskEngine()

@pytest.mark.parametrize("days,tasks,events,high,expected_level", [
    (1,  10, 5, 5, "critical"),
    (3,   5, 3, 2, "medium"),
    (7,   3, 1, 0, "medium"),
    (30,  0, 0, 0, "low"),
])
def test_risk_levels(days, tasks, events, high, expected_level):
    result = engine.calculate_risk_score(days, tasks, events, high)
    assert result.risk_level == expected_level
    assert 0.0 <= result.risk_score <= 1.0

class TestAttendanceFactor:
    def test_low_attendance_increases_risk(self):
        result_with = engine.calculate_risk_score(30, 0, 0, 0, attendance_percent=60.0)
        result_without = engine.calculate_risk_score(30, 0, 0, 0, attendance_percent=None)
        assert result_with.risk_score > result_without.risk_score

    def test_attendance_below_75_scores_1_0(self):
        result = engine.calculate_risk_score(30, 0, 0, 0, attendance_percent=74.9)
        attendance_factor = next(f for f in result.factors if "Attendance" in f.factor)
        assert attendance_factor.weight == pytest.approx(0.15, abs=0.001)

    def test_good_attendance_scores_low(self):
        result = engine.calculate_risk_score(30, 0, 0, 0, attendance_percent=90.0)
        attendance_factor = next(f for f in result.factors if "Attendance" in f.factor)
        assert attendance_factor.weight == pytest.approx(0.015, abs=0.001)

    def test_no_attendance_data_omits_factor(self):
        result = engine.calculate_risk_score(30, 0, 0, 0, attendance_percent=None)
        attendance_factors = [f for f in result.factors if "Attendance" in f.factor]
        assert len(attendance_factors) == 0


class TestRiskBoundaries:
    def test_score_never_below_zero(self):
        result = engine.calculate_risk_score(999, 0, 0, 0, attendance_percent=100.0)
        assert result.risk_score >= 0.0

    def test_score_never_above_one(self):
        result = engine.calculate_risk_score(0, 100, 100, 100, attendance_percent=0.0)
        assert result.risk_score <= 1.0

    @pytest.mark.parametrize("score,expected_level", [
        (0.0,  "low"),
        (0.29, "low"),
        (0.30, "medium"),
        (0.59, "medium"),
        (0.60, "high"),
        (0.84, "high"),
        (0.85, "critical"),
        (1.0,  "critical"),
    ])
    def test_classify_risk_level_boundaries(self, score, expected_level):
        assert engine.classify_risk_level(score) == expected_level
