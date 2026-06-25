# Schedule Generation Prompt

## Purpose
Generate a structured study schedule from a list of extracted academic events
and their deadlines.

## Variables
| Variable        | Description                              |
|-----------------|------------------------------------------|
| {{events_json}} | JSON array of ExtractedEvent objects     |
| {{days_ahead}}  | Number of days to plan ahead (default 14)|

## Expected JSON Output
```json
{
    "study_schedule": [
        {
            "date": "YYYY-MM-DD",
            "subject": "string",
            "duration_hours": 2.0,
            "session_type": "study|revision|practice"
        }
    ]
}
```

## Prompt Template Placeholder
```
Generate a study schedule for the following academic events.
Plan {{days_ahead}} days ahead, prioritizing closer deadlines.

Events:
{{events_json}}

Return a JSON object matching this exact schema:
{
    "study_schedule": [
        {
            "date": "YYYY-MM-DD",
            "subject": "subject name",
            "duration_hours": 2.0,
            "session_type": "study|revision|practice"
        }
    ]
}

Return ONLY the JSON object. No markdown. No explanation.
```

