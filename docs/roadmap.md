# CampusFlow — Project Roadmap

> **Last updated:** June 2026  
> **Status:** Deployed & Active — Railway (backend) · Vercel (frontend)  
> **Pivot note:** WhatsApp automation is handled via Make.com (not n8n). n8n folder removed.

---

## What CampusFlow Is

An autonomous academic copilot for B.Tech students. Students register once, connect Google Calendar and WhatsApp, paste college notices → AI extracts events, assesses risk, recommends study actions, and automatically creates calendar events and sends WhatsApp reminders.

---

## ✅ Done

### Infrastructure & Deployment
- [x] Next.js 14 frontend on Vercel
- [x] FastAPI backend on Railway
- [x] Supabase Postgres database (custom tables, not Supabase Auth)
- [x] Custom JWT auth (bcrypt + SHA-256, no Supabase auth dependency)
- [x] CORS configured for production URLs
- [x] `backend/app/prompts/` packaged inside backend so Railway deploys the prompt files
- [x] Dynamic prompt path resolution (no longer hardcoded `parents[4]`)

### Authentication
- [x] `POST /auth/register` — email, password, full_name, whatsapp_number
- [x] `POST /auth/login` — bcrypt verify → custom JWT
- [x] `PUT /auth/profile` — update any profile field
- [x] `GET /auth/google/connect` — returns Google OAuth URL
- [x] `GET /auth/google/callback` — exchanges OAuth code, saves refresh_token, redirects to frontend
- [x] `AuthContext` with `updateUser()` so UI state stays in sync after profile edits

### Student Profile
- [x] Avatar picker — selection saved to backend, synced across all UI
- [x] Profile fields: full_name, whatsapp_number, academic_year, major, gpa, study_hours, primary_objective, learning_protocols
- [x] Calendar sync status shown dynamically from user data

### Task Management (CRUD)
- [x] `POST /tasks` — create task with title, description, due_date, priority, subject
- [x] `GET /tasks` — list tasks with pagination and filters
- [x] `PUT /tasks/{id}` — update task (backend ready)
- [x] `DELETE /tasks/{id}` — delete task (backend ready)
- [x] Task creation triggers automation based on user preferences (calendar toggle, WhatsApp toggle)

### AI Intelligence Engine
- [x] `POST /intelligence/process` — full AI pipeline endpoint
- [x] GroqClient with primary model (kimi-k2) + fallback (llama-3.3-70b-versatile)
- [x] Notice extraction — pulls events, dates, subject from raw notice text
- [x] Risk Engine — calculates academic risk score + risk factors
- [x] Scheduler Engine — generates study schedule
- [x] Recommendation Engine — produces ranked action recommendations
- [x] JSON Parser — multi-strategy extraction for raw AI output
- [x] Response Validator — ensures fields are present
- [x] Prompt Manager — loads `.md` templates, injects variables
- [x] Intelligence Repository — persists reports to `intelligence_reports` table
- [x] Frontend AI Inbox UI — textarea, process button, extracted events, recommendations list

### Automation
- [x] `AutomationService` — orchestrates calendar + WhatsApp on task create / notice process
- [x] Automation repository — logs each workflow run with status and payload
- [x] `GET /automations` — lists automation history
- [x] `POST /automations/trigger/{type}` — manual trigger endpoint (backend)
- [x] Google Calendar Integration — `create_all_day_event()`, `create_timed_event()` via OAuth refresh token
- [x] Make.com Integration — sends WhatsApp payloads with retry logic

### Dashboard
- [x] `GET /dashboard` — aggregated academic health, upcoming deadlines, today schedule, calendar preview, recent automations
- [x] Dashboard page reads from live API with mock fallback
- [x] Academic health card, recommendations, deadlines, automation feed

### Calendar Page
- [x] Monthly calendar view with prev/next navigation
- [x] Events from `dashboard.calendar_preview` rendered on correct days
- [x] Day click modal with event list + add local task form
- [x] Search filter across events
- [x] Mark tasks complete / important

### Settings Page
- [x] Google Calendar connect → OAuth flow → redirect back with success/error flag
- [x] WhatsApp setup info modal (Twilio Sandbox — join code shown)
- [x] Save profile fields (academic year, major, GPA, etc.)

### Design / UX
- [x] Vintage theme — cream paper, crimson accents, handwritten fonts
- [x] Custom fonts: Playfair Display, Space Mono, Caveat
- [x] All alert dialogs are custom modals/banners (no native `alert()`)
- [x] WhatsApp activation popup showing "join effect-height" + "+14155238886"
- [x] Responsive layout with sidebar nav + smooth page animations
- [x] Professional README with badges and architecture diagram

---

## ⚠️ Partially Done / Needs Fixing

### Calendar — Not Reading Real Data
- [ ] Calendar uses `dashboard.calendar_preview` (a small preview) — it does **not** pull events from the user's actual Google Calendar. Events created by automation are not visible here.
- **Fix:** Add `GET /calendar/events` endpoint that reads from Google Calendar via saved refresh token.

### Automation Center — Trigger Buttons Are Fake
- [ ] "Trigger Sync" / "Trigger Notice" buttons in Automation Center only simulate a delay in local state. They do not call any backend endpoint.
- **Fix:** Wire to `POST /automations/trigger/{type}`.

### AI Notice Processor — No Error UI
- [ ] If the backend returns a 500, the error is logged to console but nothing visible shows in the UI.
- **Fix:** Add error banner/toast inside the AI Inbox section.

### Profile Page — Static Content
- [ ] "Primary Objective" and "Learning Protocols" sections show hardcoded strings, not values from `user.primary_objective` and `user.learning_protocols`.
- **Fix:** Render the real user fields; make them editable and saveable via `PUT /auth/profile`.

### Task Edit / Delete — No Frontend UI
- [ ] `PUT /tasks/{id}` and `DELETE /tasks/{id}` exist on the backend but are not wired to any frontend button. Users cannot edit or delete tasks from the UI.
- **Fix:** Add Edit (modal) and Delete (confirm) buttons to the task list.

---

## ❌ Not Yet Implemented

### Automation Center — Full History View
- [ ] The automation center page shows only the last 5 entries from dashboard context. Does not call `GET /automations` for full history.

### 401 / Session Expiry Handling
- [ ] When a JWT expires, API calls fail silently. No automatic redirect to `/auth` on 401.

### Mobile Optimization
- [ ] Sidebar collapses on mobile but inner pages (calendar grid, workspace) are not optimized for small screens.

### Demo Seed Data
- [ ] No seed script or fixture to quickly populate realistic demo data (tasks, notices, events) for a live demo.

### Attendance Risk Alerter
- [ ] Not implemented. Was listed in hackathon requirements as a chooseable module. Deprioritized in favour of the AI Notice Summarizer.

---

## Priority Order for Remaining Work

Ranked by demo impact:

1. **Fix AI Inbox error feedback** — user must see something if the AI call fails
2. **Wire Task Edit / Delete UI to backend** — judges will test CRUD
3. **Fix Profile page static content** — render real `primary_objective` + `learning_protocols`
4. **Wire Automation Center trigger buttons** — currently fake, should call backend
5. **Add full automation log view** — call `GET /automations` directly
6. **401 redirect handling** — auto-redirect to `/auth` on token expiry
7. **Calendar events read-back** — show events from user's Google Calendar
8. **Demo seed data** — insert realistic sample tasks/notices before demo

---

## Architecture

```
Frontend (Vercel — Next.js 14)
  ↓ HTTPS REST
Backend (Railway — FastAPI + Python)
  ├── Supabase Postgres
  │     users · tasks · intelligence_reports · automation_logs
  ├── Groq API
  │     Primary: moonshotai/kimi-k2-instruct
  │     Fallback: llama-3.3-70b-versatile
  ├── Google Calendar API (OAuth2 — write events)
  └── Make.com Webhook → Twilio → WhatsApp Sandbox
```

---

## Key Files Reference

| File | Purpose |
|---|---|
| `backend/app/services/intelligence_engine.py` | Full AI pipeline orchestrator |
| `backend/app/services/ai/prompt_manager.py` | Loads and formats prompt templates |
| `backend/app/services/automation_service.py` | Triggers calendar + WhatsApp |
| `backend/app/integrations/calendar.py` | Google Calendar OAuth + event creation |
| `backend/app/integrations/make.py` | Make.com webhook client |
| `backend/app/api/auth.py` | Register, login, profile, Google OAuth |
| `frontend/app/workspace/page.tsx` | Task quick-capture + AI Notice Inbox |
| `frontend/app/dashboard/page.tsx` | Main dashboard |
| `frontend/contexts/AuthContext.tsx` | Global auth state |
| `frontend/services/api.ts` | Core HTTP client 
