"""
RiskEngine — Deterministic Academic Risk Calculator
NO AI used here. Risk is always deterministic.
Formula: weighted sum of academic pressure factors.
"""


class RiskEngine:

    def calculate_risk_score(
        self,
        days_to_deadline: int,
        pending_task_count: int,
        event_count: int,
        high_priority_count: int,
    ) -> float:
        """
        Calculate a deterministic risk score between 0.0 and 1.0.
        Higher score = higher academic risk.
        TODO: Implement weighted formula
        """
        pass

    def classify_risk_level(self, score: float) -> str:
        """
        Map numeric score to risk level string.
        < 0.3  → low
        < 0.6  → medium
        < 0.85 → high
        >= 0.85→ critical
        TODO: Implement classification
        """
        pass

