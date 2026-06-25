A student has an academic risk level of {risk_level} (score: {risk_score:.2f}).

Risk factors contributing to this score:
{risk_factors_json}

Upcoming academic events:
{events_json}

Generate a prioritized list of 3-5 specific, actionable recommendations to reduce this student's academic risk.

Return a JSON object matching this exact schema:
{{
    "recommendations": [
        {{
            "action": "specific actionable task the student should do",
            "priority": 1,
            "rationale": "why this action reduces academic risk"
        }}
    ]
}}

Priority 1 = most urgent. Higher numbers = less urgent.
Return ONLY the JSON object. No markdown. No explanation.
