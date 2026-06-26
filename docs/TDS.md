# Technical Design Specification
## Academix — Autonomous Academic Copilot
**Version:** 1.2 | **Status:** Frozen

---

## 1. Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | Next.js 15, TypeScript, TailwindCSS, Shadcn UI |
| Backend     | FastAPI (Python 3.11+)                  |
| Database    | Supabase (PostgreSQL 15)               |
| AI          | Groq API — moonshotai/kimi-k2-instruct |
| AI Fallback | llama-3.3-70b-versatile                |
| Automation  | Make.com Router scenario               |
| Calendar    | Google Calendar API (direct backend)   |
| Messaging   | Twilio WhatsApp API (via Make.com)     |

---

## 2. Deployment Model

```
Frontend  ──▶  Vercel     (Next.js 15)
Backend   ──▶  Render     (FastAPI + Uvicorn)
Database  ──▶  Supabase   (PostgreSQL)
Automation──▶  Make.com  (WhatsApp webhook)
```

Each application deploys independently with its own environment file.
No shared environment variables between frontend and backend.

---

## 3. Environment Variables

### Frontend (`frontend/.env.example`)
| Variable               | Purpose                          |
|------------------------|----------------------------------|
| NEXT_PUBLIC_API_URL    | Backend FastAPI base URL         |
| NEXT_PUBLIC_APP_NAME   | App display name                 |
| NEXT_PUBLIC_ENV        | Environment (development/prod)   |

### Backend (`backend/.env.example`)
| Variable                  | Purpose                          |
|---------------------------|----------------------------------|
| ENVIRONMENT               | Runtime environment              |
| SECRET_KEY                | App secret for signing           |
| API_V1_PREFIX             | API route prefix (/api/v1)       |
| SUPABASE_URL              | Supabase project URL             |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key        |
| GROQ_API_KEY              | Groq API access key              |
| PRIMARY_MODEL             | moonshotai/kimi-k2-instruct      |
| FALLBACK_MODEL            | llama-3.3-70b-versatile          |
| MAKE_WEBHOOK_URL          | Make.com production webhook URL  |
| AUTOMATION_CALLBACK_SECRET| Shared secret for Make callback  |
| GOOGLE_REDIRECT_URI       | Google OAuth callback URL        |
| TWILIO_ACCOUNT_SID        | Twilio account ID                |
| TWILIO_AUTH_TOKEN         | Twilio auth token                |
| TWILIO_PHONE_NUMBER       | WhatsApp sender number           |
| GOOGLE_CLIENT_ID          | Google OAuth client ID           |
| GOOGLE_CLIENT_SECRET      | Google OAuth client secret       |

---

## 4. Backend Architecture

```
FastAPI App
├── api/             HTTP route handlers (controllers only)
│   ├── auth.py
│   ├── dashboard.py
│   ├── tasks.py
│   ├── intelligence.py
│   └── automations.py
├── services/        Business logic layer
│   ├── intelligence_engine.py   (AcademicIntelligenceEngine)
│   ├── risk_engine.py           (deterministic, no AI)
│   ├── scheduler_engine.py
│   ├── recommendation_engine.py
│   ├── groq_client.py
│   └── ai/
│       ├── prompt_manager.py
│       ├── json_parser.py
│       └── response_validator.py
├── repositories/    Data access layer
│   ├── task_repository.py
│   ├── user_repository.py
│   ├── intelligence_repository.py
│   └── automation_repository.py
├── schemas/         Pydantic models
│   ├── common.py
│   ├── auth.py
│   ├── dashboard.py
│   ├── tasks.py
│   ├── intelligence.py
│   └── automation.py
├── db/
│   ├── client.py
│   └── models.py
├── integrations/
│   ├── make.py
│   ├── calendar.py
│   └── whatsapp.py
├── middleware/
├── core/
│   ├── settings.py
│   ├── security.py
│   └── constants.py
└── main.py
```

**Request Flow:**
```
HTTP Request
    ↓
API Router (api/)
    ↓
Service Layer (services/)
    ↓
Repository Layer (repositories/)
    ↓
Database (Supabase)
```

---

## 5. Frontend Architecture

```
Next.js App (App Router)
├── app/
│   ├── auth/
│   ├── dashboard/
│   ├── workspace/         (Tasks | Notices | Planner tabs)
│   ├── calendar/
│   ├── automation-center/
│   ├── profile/
│   └── settings/
├── components/
│   ├── dashboard/
│   ├── workspace/
│   ├── calendar/
│   ├── automation/
│   ├── forms/
│   ├── cards/
│   ├── charts/
│   ├── tables/
│   └── shared/
├── services/              API layer
│   ├── api.ts             (Core HTTP client — ONLY entry point)
│   ├── auth.service.ts
│   ├── task.service.ts
│   ├── intelligence.service.ts
│   └── automation.service.ts
├── contexts/
├── providers/
├── hooks/
├── lib/
├── constants/
├── utils/
└── types/
```

**API Policy:** All HTTP requests originate exclusively from `services/api.ts`.
No fetch() or axios calls permitted in components, pages, hooks, or contexts.

---

## 6. Authentication Flow

```
Frontend → Supabase Auth (login/register)
Supabase → returns JWT token
Frontend → attaches token to every backend request (Authorization header)
Backend  → verifies token with Supabase
Backend  → returns protected resource
```

No custom JWT implementation. Supabase Auth is the sole auth provider.

---

## 7. AI Pipeline

```
IntelligenceRequest (input_type + data)
    ↓
AcademicIntelligenceEngine.process_notice()
    ↓
PromptManager.load_prompt(template)
    ↓
GroqClient.generate(prompt)
    ↓
JSONParser.extract_json(raw_output)
    ↓
ResponseValidator.validate(data, schema)
    ↓
RiskEngine.calculate_risk_score() [deterministic]
    ↓
RecommendationEngine.format_recommendations()
    ↓
IntelligenceResponse
    ↓
intelligence_repository.save()
```

Risk Engine is deterministic. AI only generates raw event and recommendation data.

---

## 8. Database Tables

| Table                 | Purpose                              |
|-----------------------|--------------------------------------|
| users                 | Student profiles                     |
| tasks                 | Academic tasks and deadlines         |
| intelligence_reports  | AI analysis results                  |
| automation_logs       | Calendar/Make.com execution history  |

See [DATABASE.md](DATABASE.md) for full schema.

---

## 9. Testing Strategy

- **Backend:** Pytest + FastAPI TestClient
- **Frontend:** Jest + React Testing Library + Playwright (E2E)
- **AI:** Fixture-based testing with known inputs/outputs
- **Risk Engine:** Unit tests with deterministic assertions

