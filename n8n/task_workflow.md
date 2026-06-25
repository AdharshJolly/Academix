# Task WhatsApp Route - Make.com

This file is kept in the legacy `n8n/` folder, but the active automation tool is Make.com.

## Purpose
After the backend creates a task and attempts direct Google Calendar sync, Make.com sends a WhatsApp confirmation through Twilio.

## Trigger
Single Make.com webhook:

`POST {MAKE_WEBHOOK_URL}`

## Payload
```json
{
  "type": "task",
  "payload": {
    "user_id": "uuid",
    "log_id": "uuid",
    "whatsapp_number": "+91XXXXXXXXXX",
    "message": "Task Added!\n\"Submit Assignment 2\" is due on 2026-07-01.\nYour Google Calendar has been updated! - CampusFlow"
  }
}
```

## Make.com Steps
1. Webhook receives the payload.
2. Router filters where `type` equals `task`.
3. Twilio sends `payload.message` to `payload.whatsapp_number`.
4. HTTP Request posts delivery result to `POST /api/v1/automations/log`.

## Callback Body
```json
{
  "workflow_type": "task",
  "status": "success",
  "user_id": "uuid",
  "log_id": "uuid",
  "whatsapp_message_id": "twilio_sid",
  "error": null
}
```
