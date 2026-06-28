# Product Requirements Document
## Academix — Autonomous Academic Copilot
**Version:** 1.2 | **Status:** Frozen

---

## 1. Product Overview

Academix is an AI-powered academic management system for university students.
It processes academic notices, extracts deadlines, assesses risk, and
automatically schedules study sessions and sends reminders.

---

## 2. Problem Statement

University students struggle to:
- Track academic deadlines from unstructured notice boards
- Assess their personal academic risk in time to act
- Maintain consistent study schedules
- Receive timely reminders for assignments and exams

---

## 3. Solution

Academix provides:
1. **Academic Intelligence Engine** — AI analysis of academic notices
2. **Automation Engine** — Calendar + WhatsApp workflow automation

---

## 4. User Roles

| Role    | Description                              |
|---------|------------------------------------------|
| Student | Primary user of the platform             |
| Admin   | Future: institution-level management     |

---

## 5. Core Features

### F1 — Authentication
- Supabase Auth (email/password)
- JWT token passed to backend for verification
- Session management via Supabase

### F2 — Dashboard
- Academic health summary
- Upcoming deadlines
- Risk level indicator
- Today's schedule
- Recent automations

### F3 — Workspace
- **Tasks Tab**: Create, view, update, and delete academic tasks
- **Notices Tab**: Submit and process academic notices via AI
- **Planner Tab**: View AI-generated study schedules

### F4 — Academic Intelligence Engine
- Notice understanding
- Event extraction
- Risk analysis (deterministic formula)
- Study schedule generation
- Recommendation generation

### F5 — Calendar
- Google Calendar integration via direct backend API calls
- View upcoming academic events
- Sync study schedule to calendar

### F6 — Automation Center
- View automation logs
- Monitor WhatsApp notification status
- Monitor messaging delivery and backend calendar automation

### F7 — Profile & Settings
- User profile management
- Notification preferences

---

## 6. Navigation Structure

```
/auth             Login / Register
/dashboard        Home — Academic Health Overview
/workspace        Tasks | Notices | Planner (tabbed)
/calendar         Calendar view + Google Calendar sync
/automation-center  Automation logs and triggers
/profile          User profile
/settings         User preferences
```

---

## 7. AI Architecture

One centralized endpoint: `POST /api/v1/intelligence/process`

The **AcademicIntelligenceEngine** orchestrates internally:
- Notice Analyzer
- Risk Engine (deterministic, no AI)
- Recommendation Engine
- Planner Engine
- Groq Client (AI inference)
- Prompt Manager, JSON Parser, Response Validator

**Models:**
- Primary: `moonshotai/kimi-k2-instruct` via Groq
- Fallback: `llama-3.3-70b-versatile`

---

## 8. Deployment

| Component | Platform  | Environment File         |
|-----------|-----------|--------------------------|
| Frontend  | Vercel    | `frontend/.env.example`  |
| Backend   | Render    | `backend/.env.example`   |

Frontend never communicates directly with Groq, Supabase (service role),
Google Calendar.

---

## 9. Acceptance Criteria

- User can submit a notice and receive extracted events and risk scores
- Events are automatically added to Google Calendar
- WhatsApp reminders are sent
- Dashboard loads in under 2 seconds
- AI pipeline returns valid structured JSON or falls back gracefully

---

## 10. Out of Scope (v1.0)

- Mobile application
- Multi-institution support
- LMS integrations
- Custom AI model training

