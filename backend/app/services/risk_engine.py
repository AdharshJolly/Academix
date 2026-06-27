"""
RiskEngine — Deterministic Academic Risk Calculator
NO AI used here. Formula is pure arithmetic.

Formula:
  risk_score = (deadline_density * 0.4) + (task_load * 0.4) + (event_pressure * 0.2)

Score range: 0.0 (no risk) → 1.0 (critical risk)
"""
from app.schemas.intelligence import RiskAssessment, RiskFactor
from app.core.constants import RISK_LOW, RISK_MEDIUM, RISK_HIGH, RISK_CRITICAL


class RiskEngine:
    """
    Computes a deterministic academic risk score.
    Inputs are simple integers — no AI involved.
    """

    def calculate_risk_score(
        self,
        days_to_nearest_deadline: int,
        pending_task_count: int,
        event_count: int,
        high_priority_count: int,
        attendance_percent: float | None = None,
    ) -> RiskAssessment:
        """
        Calculate academic risk score and return a full RiskAssessment.
        """
        factors: list[RiskFactor] = []

        # --- Factor 1: Deadline density (weight 0.35) ---
        if days_to_nearest_deadline <= 1:
            deadline_score = 1.0
        elif days_to_nearest_deadline <= 3:
            deadline_score = 0.8
        elif days_to_nearest_deadline <= 7:
            deadline_score = 0.5
        elif days_to_nearest_deadline <= 14:
            deadline_score = 0.25
        else:
            deadline_score = 0.1

        factors.append(RiskFactor(
            factor=f"Nearest deadline in {days_to_nearest_deadline} day(s)",
            weight=round(deadline_score * 0.35, 3),
        ))

        # --- Factor 2: Task load (weight 0.35) ---
        task_score = min(pending_task_count / 10.0, 1.0)
        factors.append(RiskFactor(
            factor=f"{pending_task_count} pending task(s)",
            weight=round(task_score * 0.35, 3),
        ))

        # --- Factor 3: Event pressure (weight 0.15) ---
        event_score = min(event_count / 5.0, 1.0)
        if high_priority_count > 0:
            event_score = min(event_score + (high_priority_count * 0.1), 1.0)
        factors.append(RiskFactor(
            factor=f"{event_count} upcoming event(s), {high_priority_count} high-priority",
            weight=round(event_score * 0.15, 3),
        ))

        # --- Factor 4: Attendance risk (weight 0.15) ---
        attendance_score = 0.0
        if attendance_percent is not None:
            if attendance_percent < 75:
                attendance_score = 1.0
            elif attendance_percent < 85:
                attendance_score = 0.5
            else:
                attendance_score = 0.1

            factors.append(RiskFactor(
                factor=f"Attendance at {attendance_percent:.0f}%",
                weight=round(attendance_score * 0.15, 3),
            ))

        # --- Final Score ---
        score = round(
            (deadline_score * 0.35) + (task_score * 0.35) + (event_score * 0.15) + (attendance_score * 0.15),
            3,
        )
        score = max(0.0, min(1.0, score))  # clamp to [0, 1]
        level = self.classify_risk_level(score)

        return RiskAssessment(
            risk_score=score,
            risk_level=level,
            factors=factors,
        )

    def classify_risk_level(self, score: float) -> str:
        """
        Map numeric score to a risk level string.
          < 0.30  → low
          < 0.60  → medium
          < 0.85  → high
          >= 0.85 → critical
        """
        if score < 0.30:
            return RISK_LOW
        elif score < 0.60:
            return RISK_MEDIUM
        elif score < 0.85:
            return RISK_HIGH
        else:
            return RISK_CRITICAL
