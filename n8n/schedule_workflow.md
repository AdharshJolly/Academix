# Schedule Automation Workflow

## Workflow Purpose
After a study schedule is generated, create recurring Google Calendar study
blocks and send a WhatsApp summary of the week's study plan.

## Trigger
Webhook: `POST {N8N_BASE_URL}/webhook/schedule-trigger`
Triggered by: `POST /api/v1/automations/schedule-trigger`

## Payload
```json
{
    "type": "schedule",
    "payload": {
        "user_id": "uuid",
        "schedule_date": "2026-07-10",
        "study_schedule": [
            {
                "date": "2026-07-10",
                "subject": "CS401",
                "duration_hours": 2,
                "session_type": "study"
            }
        ],
        "whatsapp_number": "+91XXXXXXXXXX"
    }
}
```

## Execution Steps
1. Receive webhook payload
2. For each schedule block: create Google Calendar event with duration
3. Compose WhatsApp summary with weekly study plan
4. Send WhatsApp message via Twilio
5. POST back to backend: update `automation_logs` with status=success

## Output
```json
{
    "calendar_blocks_created": 5,
    "whatsapp_message_id": "twilio_sid",
    "status": "success"
}
```

## Failure Handling
- If calendar creation fails: log failure, retry once
- If WhatsApp fails: log error, schedule blocks remain in calendar
- All failures persisted in `automation_logs`

