# Recommendation Generation Prompt

## Purpose
Generate prioritized academic action recommendations based on the student's
risk assessment and upcoming events.

## Variables
| Variable            | Description                              |
|---------------------|------------------------------------------|
| {{risk_score}}      | Numeric risk score (0.0 – 1.0)           |
| {{risk_level}}      | Risk level string (low/medium/high/critical) |
| {{risk_factors_json}}| JSON array of RiskFactor objects        |
| {{events_json}}     | JSON array of upcoming ExtractedEvent objects |

## Expected JSON Output
```json
{
    "recommendations": [
        {
            "action": "string",
            "priority": 1,
            "rationale": "string or null"
        }
    ]
}
```

## Prompt Template Placeholder
```
A student has an academic risk level of {{risk_level}} (score: {{risk_score}}).

Risk factors:
{{risk_factors_json}}

Upcoming events:
{{events_json}}

Generate a prioritized list of academic recommendations to reduce this student's risk.

Return a JSON object matching this exact schema:
{
    "recommendations": [
        {
            "action": "specific actionable task",
            "priority": 1,
            "rationale": "why this action reduces risk"
        }
    ]
}

Priority 1 = most urgent. Return max 5 recommendations.
Return ONLY the JSON object. No markdown. No explanation.
```

