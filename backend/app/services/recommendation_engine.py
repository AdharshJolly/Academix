"""
RecommendationEngine
Formats Recommendation objects from risk assessment and events.
The content of recommendations comes from AI (via GroqClient).
This engine structures and ranks that AI output.
"""
from app.schemas.intelligence import RiskAssessment, ExtractedEvent, Recommendation


class RecommendationEngine:
    """Formats and ranks AI-generated recommendation text into Recommendation objects."""

    def format_recommendations(
        self,
        ai_recommendations: list[dict],
        risk: RiskAssessment,
        events: list[ExtractedEvent],
    ) -> list[Recommendation]:
        """
        Convert raw AI recommendation dicts into ranked Recommendation objects.

        Args:
            ai_recommendations: Raw list from AI JSON output
                Expected format: [{"action": "...", "priority": 1, "rationale": "..."}]
            risk:   RiskAssessment (used to prepend critical risk warnings)
            events: ExtractedEvent list (used to add event-specific reminders)

        Returns:
            Sorted list of Recommendation objects (priority 1 = most urgent)
        """
        recommendations: list[Recommendation] = []

        # 1. Add AI-generated recommendations
        for item in ai_recommendations:
            if not isinstance(item, dict):
                continue
            action = item.get("action") or item.get("text") or str(item)
            if not action:
                continue
            recommendations.append(Recommendation(
                action=str(action),
                priority=int(item.get("priority", 5)),
                rationale=item.get("rationale") or item.get("reason"),
            ))

        # 2. Prepend a critical risk warning if risk is high/critical
        if risk.risk_level in ("high", "critical") and not any(
            "risk" in r.action.lower() for r in recommendations
        ):
            recommendations.insert(0, Recommendation(
                action=f"Academic risk is {risk.risk_level.upper()} ({risk.risk_score:.0%}). Take immediate action.",
                priority=0,
                rationale="System-generated risk alert",
            ))

        # 3. Fallback: if AI returned nothing, generate basic recommendations
        if not recommendations:
            recommendations = self._generate_fallback_recommendations(risk, events)

        # Sort by priority (0 = most urgent)
        recommendations.sort(key=lambda r: r.priority)

        # Return top 5
        return recommendations[:5]

    def _generate_fallback_recommendations(
        self,
        risk: RiskAssessment,
        events: list[ExtractedEvent],
    ) -> list[Recommendation]:
        """Generate basic recommendations when AI output is empty."""
        recs = []

        if events:
            nearest = events[0]
            recs.append(Recommendation(
                action=f"Start preparing for '{nearest.title}' scheduled on {nearest.date}.",
                priority=1,
                rationale="Nearest upcoming event detected",
            ))

        if risk.risk_level in ("high", "critical"):
            recs.append(Recommendation(
                action="Review and complete all pending high-priority tasks immediately.",
                priority=2,
                rationale="High academic risk detected",
            ))
        else:
            recs.append(Recommendation(
                action="Review your upcoming schedule and ensure all tasks are on track.",
                priority=3,
                rationale="Routine check",
            ))

        return recs
