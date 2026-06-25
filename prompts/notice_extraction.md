# Notice Extraction Prompt

## Purpose
Extract structured academic events from raw notice text.

## Variables
| Variable       | Description                          |
|----------------|--------------------------------------|
| {{notice_text}} | Raw notice text submitted by student |

## Expected JSON Output
```json
{
    "extracted_events": [
        {
            "title": "string",
            "date": "YYYY-MM-DD",
            "type": "exam|assignment|lecture|other",
            "subject": "string or null",
            "location": "string or null"
        }
    ]
}
```

## Prompt Template Placeholder
```
Analyze the following academic notice and extract all academic events.

Notice:
{{notice_text}}

Return a JSON object matching this exact schema:
{
    "extracted_events": [
        {
            "title": "event title",
            "date": "YYYY-MM-DD",
            "type": "exam|assignment|lecture|other",
            "subject": "subject name or null",
            "location": "location or null"
        }
    ]
}

Return ONLY the JSON object. No markdown. No explanation.
```

