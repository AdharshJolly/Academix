# Schedule WhatsApp Route - Make.com

This file is kept in the legacy `n8n/` folder, but the active automation tool is Make.com.

## Purpose
After the backend generates a study schedule and creates Google Calendar study blocks directly, Make.com sends a WhatsApp study-plan summary through Twilio.

## Trigger
Single Make.com webhook:

`POST {MAKE_WEBHOOK_URL}`

## Payload
```json
{
  "type": "schedule",
  "payload": {
    "user_id": "uuid",
    "log_id": "uuid",
    "whatsapp_number": "+91XXXXXXXXXX",
    "message": "Study Plan Ready!\n5 study blocks added to your Google Calendar.\nStay on track! - CampusFlow"
  }
}
```

## Make.com Steps
1. Webhook receives the payload.
2. Router filters where `type` equals `schedule`.
3. Twilio sends `payload.message` to `payload.whatsapp_number`.
4. HTTP Request posts delivery result to `POST /api/v1/automations/log`.

## Callback Body
```json
{
  "workflow_type": "schedule",
  "status": "success",
  "user_id": "uuid",
  "log_id": "uuid",
  "whatsapp_message_id": "twilio_sid",
  "error": null
}
```
