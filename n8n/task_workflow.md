# Task Automation Workflow

## Workflow Purpose
Automatically create a Google Calendar event and send a WhatsApp confirmation
when a student creates a new academic task.

## Trigger
Webhook: `POST {N8N_BASE_URL}/webhook/task-trigger`
Triggered by: `POST /api/v1/automations/task-trigger`

## Payload
```json
{
    "type": "task",
    "payload": {
        "task_id": "uuid",
        "user_id": "uuid",
        "title": "Submit Assignment 2",
        "due_date": "2026-07-01",
        "priority": "high",
        "whatsapp_number": "+91XXXXXXXXXX"
    }
}
```

## Execution Steps
1. Receive webhook payload
2. Create Google Calendar event with task title and due_date
3. Send WhatsApp message via Twilio confirming task was added
4. POST back to backend: update `automation_logs` with status=success

## Output
```json
{
    "calendar_event_id": "google_event_id",
    "whatsapp_message_id": "twilio_sid",
    "status": "success"
}
```

## Failure Handling
- If Google Calendar fails: log status=failed, skip WhatsApp, notify user via UI
- If WhatsApp fails: log status=failed, calendar event remains, notify user via UI
- All failures must be persisted in `automation_logs`

