# Notice Automation Workflow

## Workflow Purpose
After AI processes a notice and extracts events, automatically create calendar
events and broadcast a WhatsApp notification for each extracted academic event.

## Trigger
Webhook: `POST {N8N_BASE_URL}/webhook/notice-trigger`
Triggered by: `POST /api/v1/automations/notice-trigger`

## Payload
```json
{
    "type": "notice",
    "payload": {
        "report_id": "uuid",
        "user_id": "uuid",
        "extracted_events": [
            {
                "title": "CS401 Midterm Exam",
                "date": "2026-07-15",
                "type": "exam",
                "subject": "CS401"
            }
        ],
        "whatsapp_number": "+91XXXXXXXXXX"
    }
}
```

## Execution Steps
1. Receive webhook payload
2. For each extracted_event: create a Google Calendar event
3. Compose WhatsApp summary message listing all events
4. Send WhatsApp broadcast via Twilio
5. POST back to backend: update `automation_logs` with status=success

## Output
```json
{
    "calendar_events_created": 2,
    "whatsapp_message_id": "twilio_sid",
    "status": "success"
}
```

## Failure Handling
- If any calendar creation fails: continue with remaining events, log partial failure
- If WhatsApp fails: log error, calendar events remain
- All failures persisted in `automation_logs`

