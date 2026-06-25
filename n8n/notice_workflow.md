# Notice WhatsApp Route - Make.com

This file is kept in the legacy `n8n/` folder, but the active automation tool is Make.com.

## Purpose
After the backend processes a notice and creates Google Calendar events directly, Make.com sends a WhatsApp notice summary through Twilio.

## Trigger
Single Make.com webhook:

`POST {MAKE_WEBHOOK_URL}`

## Payload
```json
{
  "type": "notice",
  "payload": {
    "user_id": "uuid",
    "log_id": "uuid",
    "whatsapp_number": "+91XXXXXXXXXX",
    "message": "Notice Alert!\n2 academic events have been extracted and added to your Google Calendar.\nCheck your calendar for deadlines! - CampusFlow"
  }
}
```

## Make.com Steps
1. Webhook receives the payload.
2. Router filters where `type` equals `notice`.
3. Twilio sends `payload.message` to `payload.whatsapp_number`.
4. HTTP Request posts delivery result to `POST /api/v1/automations/log`.

## Callback Body
```json
{
  "workflow_type": "notice",
  "status": "success",
  "user_id": "uuid",
  "log_id": "uuid",
  "whatsapp_message_id": "twilio_sid",
  "error": null
}
```
