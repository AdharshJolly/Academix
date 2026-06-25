Analyze the following academic notice and extract all academic events mentioned.

Notice:
{notice_text}

Return a JSON object matching this exact schema:
{{
    "extracted_events": [
        {{
            "title": "event title",
            "date": "YYYY-MM-DD",
            "type": "exam|assignment|lecture|other",
            "subject": "subject name or null",
            "location": "location or null"
        }}
    ]
}}

If no events are found, return: {{"extracted_events": []}}
Return ONLY the JSON object. No markdown. No explanation.
