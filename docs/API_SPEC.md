# API Specification
## CampusFlow — Autonomous Academic Copilot
**Version:** 1.2 | **Status:** Frozen

**Base URL:** `/api/v1`

All responses use the `APIResponse[T]` wrapper:
```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

---

## Authentication

All endpoints except `/auth/*` require:
```
Authorization: Bearer <supabase_jwt_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "student@university.edu",
  "password": "securepassword",
  "full_name": "Jane Smith"
}
```
**Response:** `APIResponse[AuthResponse]`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "jwt_token",
    "user": { "id": "uuid", "email": "...", "full_name": "..." }
  }
}
```

### POST /auth/login
Authenticate an existing user.

**Request:**
```json
{ "email": "student@university.edu", "password": "securepassword" }
```
**Response:** `APIResponse[AuthResponse]`

### GET /auth/google/connect
Return a Google OAuth consent URL for connecting the authenticated user's calendar.

**Response:** `APIResponse[{ "authorization_url": "https://..." }]`

### GET /auth/google/callback
Google OAuth callback. Exchanges `code` for a refresh token and marks the user as calendar-connected.

**Query Params:** `code`, `state`

**Response:** `APIResponse[{ "google_calendar_connected": true }]`

---

## Dashboard Endpoints

### GET /dashboard
Retrieve the full dashboard presentation model.

**Response:** `APIResponse[DashboardResponse]`
```json
{
  "success": true,
  "message": "Dashboard loaded",
  "data": {
    "academic_health": {
      "risk_level": "medium",
      "risk_score": 0.65,
      "summary": "2 deadlines approaching"
    },
    "next_recommended_action": {
      "action": "Study for Algorithm midterm",
      "priority": 1,
      "due_in_hours": 48
    },
    "upcoming_deadlines": [...],
    "today_schedule": [...],
    "calendar_preview": [...],
    "recent_automations": [...]
  }
}
```

---

## Task Endpoints

### GET /tasks
List all tasks for the authenticated user.

**Query Params:** `page`, `size`, `status`, `priority`

**Response:** `PaginatedResponse[TaskResponse]`

### POST /tasks
Create a new task.

**Request:** `TaskCreate`
```json
{
  "title": "Submit Assignment 2",
  "description": "Machine Learning Assignment",
  "due_date": "2026-07-01",
  "priority": "high"
}
```
**Response:** `APIResponse[TaskResponse]`

### PUT /tasks/{id}
Update an existing task.

**Request:** `TaskUpdate` (all fields optional)

**Response:** `APIResponse[TaskResponse]`

### DELETE /tasks/{id}
Delete a task.

**Response:** `APIResponse[null]`

---

## Intelligence Endpoints

### POST /intelligence/process
**The sole AI endpoint.** Processes any academic input and returns full analysis.

**Request:** `IntelligenceRequest`
```json
{
  "input_type": "notice",
  "data": {
    "text": "Midterm exam for CS401 scheduled on July 15th..."
  }
}
```

`input_type` values: `notice` | `risk` | `schedule`

**Response:** `APIResponse[IntelligenceResponse]`
```json
{
  "success": true,
  "message": "Intelligence processed",
  "data": {
    "report_id": "uuid",
    "input_type": "notice",
    "extracted_events": [
      { "title": "CS401 Midterm", "date": "2026-07-15", "type": "exam" }
    ],
    "risk_assessment": {
      "risk_score": 0.72,
      "risk_level": "high",
      "factors": ["upcoming exam", "3 pending tasks"]
    },
    "recommendations": [
      { "action": "Start studying today", "priority": 1 }
    ],
    "study_schedule": [
      { "date": "2026-07-10", "subject": "CS401", "duration_hours": 2 }
    ]
  }
}
```

---

## Automation Endpoints

Automations are triggered internally after task creation and intelligence processing.
Manual frontend trigger endpoints are deprecated.

### POST /automations/log
Internal callback called by Make.com after Twilio WhatsApp delivery.

**Auth:** `Authorization: Bearer <AUTOMATION_CALLBACK_SECRET>`

**Request:**
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

**Response:**
```json
{ "logged": true }
```

### GET /automations/logs
List recent automation logs for the authenticated user.

**Query Params:** `limit`

**Response:** `APIResponse[AutomationLogResponse[]]`

---

## Error Responses

All errors use `ErrorResponse`:
```json
{
  "success": false,
  "error_code": "VALIDATION_ERROR",
  "message": "Email is required"
}
```

| HTTP Code | Error Code           | Meaning                     |
|-----------|----------------------|-----------------------------|
| 400       | VALIDATION_ERROR     | Invalid request body        |
| 401       | UNAUTHORIZED         | Missing or invalid JWT      |
| 403       | FORBIDDEN            | Access denied               |
| 404       | NOT_FOUND            | Resource not found          |
| 422       | UNPROCESSABLE_ENTITY | Schema validation failed    |
| 500       | INTERNAL_ERROR       | Server error                |

