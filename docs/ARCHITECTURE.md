# Architecture Document
## Academix — Autonomous Academic Copilot
**Version:** 1.2 | **Status:** Frozen

---

## 1. System Architecture Diagram

```mermaid
graph TD
    Browser["Browser\nNext.js 15 (Vercel)"]

    subgraph Backend ["FastAPI Backend (Render)"]
        API["API Layer\n/api/v1"]
        SVC["Service Layer"]
        REPO["Repository Layer"]
        AIE["AcademicIntelligenceEngine"]
        RISK["RiskEngine (deterministic)"]
        SCHED["SchedulerEngine"]
        REC["RecommendationEngine"]
        GROQ["GroqClient"]
        PM["PromptManager"]
        JP["JSONParser"]
        RV["ResponseValidator"]
    end

    DB["Supabase\nPostgreSQL"]
    GROQ_API["Groq API\nKimi K2 / Llama"]
    MAKE["Automation Service"]
    GCAL["Google Calendar"]
    WA["Telegram"]
    SUPA["Supabase Auth"]

    Browser -- "HTTPS REST" --> API
    Browser -- "Auth" --> SUPA
    API --> SVC
    SVC --> AIE
    SVC --> REPO
    REPO --> DB
    AIE --> RISK
    AIE --> SCHED
    AIE --> REC
    AIE --> GROQ
    GROQ --> PM
    GROQ --> JP
    GROQ --> RV
    GROQ --> GROQ_API
    SVC --> GCAL
    SVC --> MAKE
    MAKE --> WA
```

---

## 2. Deployment Diagram

```mermaid
graph LR
    subgraph Vercel
        FE["Next.js Frontend"]
    end

    subgraph Render
        BE["FastAPI Backend"]
    end

    subgraph Supabase
        AUTH["Auth Service"]
        PG["PostgreSQL DB"]
    end

    subgraph External
        GROQ["Groq API"]


        GCAL["Google Calendar"]
    end

    FE -- "REST API" --> BE
    FE -- "Auth JWT" --> AUTH
    BE -- "DB queries" --> PG
    BE -- "AI inference" --> GROQ
    BE -- "Direct API" --> GCAL
    BE -- "Telegram webhook" --> MAKE

```

---

## 3. Container Diagram

```mermaid
graph TD
    subgraph Frontend Container
        PAGES["Pages\n/auth, /dashboard, /workspace\n/calendar, /automation-center\n/profile, /settings"]
        COMPS["Components"]
        SERVICES["Service Layer\napi.ts (sole HTTP entry)"]
        CONTEXTS["Contexts & Providers"]
    end

    subgraph Backend Container
        ROUTES["API Routes\n/api/v1/*"]
        BIZ["Business Services"]
        REPOS["Repositories"]
        AI["AI Subsystem"]
    end

    PAGES --> COMPS
    PAGES --> CONTEXTS
    PAGES --> SERVICES
    SERVICES -- "HTTP" --> ROUTES
    ROUTES --> BIZ
    BIZ --> REPOS
    BIZ --> AI
```

---

## 4. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant SA as Supabase Auth
    participant BE as Backend API

    U->>FE: Enter credentials
    FE->>SA: POST /auth/v1/token
    SA-->>FE: JWT Access Token
    FE->>BE: Request + Authorization: Bearer <token>
    BE->>SA: Verify JWT
    SA-->>BE: Token valid + User ID
    BE-->>FE: Protected resource
```

---

## 5. AI Pipeline Sequence

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Layer
    participant AIE as AcademicIntelligenceEngine
    participant GROQ as GroqClient
    participant RISK as RiskEngine
    participant DB as Database

    FE->>API: POST /api/v1/intelligence/process
    API->>AIE: process_notice(request)
    AIE->>GROQ: generate(prompt)
    GROQ-->>AIE: raw AI output
    AIE->>AIE: JSONParser.extract_json()
    AIE->>AIE: ResponseValidator.validate()
    AIE->>RISK: calculate_risk_score() [deterministic]
    RISK-->>AIE: risk_score
    AIE->>DB: Save intelligence_report
    AIE-->>API: IntelligenceResponse
    API-->>FE: APIResponse[IntelligenceResponse]
```

---

## 6. Notice Processing Flow

```mermaid
flowchart TD
    A["User submits notice text"] --> B["POST /api/v1/intelligence/process\ninput_type: notice"]
    B --> C["PromptManager loads notice_extraction template"]
    C --> D["GroqClient sends to Kimi K2"]
    D --> E{Valid JSON?}
    E -- No --> F["Retry with Llama fallback"]
    F --> E
    E -- Yes --> G["ResponseValidator checks schema"]
    G --> H["RiskEngine scores risk (deterministic)"]
    H --> I["RecommendationEngine formats actions"]
    I --> J["Save to intelligence_reports table"]
    J --> K["Create Google Calendar events directly"]
    K --> L["Trigger Telegram webhook"]
    L --> M["Telegram reminder sent"]
```

---

## 7. Automation Flow

```mermaid
flowchart LR
    BE["Backend\nAutomation Service"] --> CAL["Google Calendar API\nCreate Event"]
    BE --> MAKE["Telegram Webhook"]
    MAKE --> WA["Telegram Bot\nSend Message"]
    MAKE --> LOG["POST /automations/log\nRecord outcome"]
```

---

## 8. Database ER Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string full_name
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    tasks {
        uuid id PK
        uuid user_id FK
        string title
        text description
        string status
        string priority
        date due_date
        timestamp created_at
        timestamp updated_at
    }

    intelligence_reports {
        uuid id PK
        uuid user_id FK
        uuid task_id FK
        string input_type
        text raw_input
        jsonb extracted_events
        jsonb risk_assessment
        jsonb recommendations
        jsonb study_schedule
        float risk_score
        timestamp created_at
    }

    automation_logs {
        uuid id PK
        uuid user_id FK
        uuid intelligence_report_id FK
        string workflow_type
        string status
        jsonb payload
        jsonb response
        timestamp triggered_at
        timestamp completed_at
    }

    users ||--o{ tasks : "has"
    users ||--o{ intelligence_reports : "generates"
    users ||--o{ automation_logs : "triggers"
    tasks ||--o{ intelligence_reports : "analyzed by"
    intelligence_reports ||--o{ automation_logs : "triggers"
```

---

## 9. Component Diagram — Academic Intelligence Engine

```mermaid
graph TD
    subgraph AcademicIntelligenceEngine
        PE["process_notice()\n(orchestrator)"]
        EE["extract_event()"]
        RA["analyze_risk()"]
        GS["generate_schedule()"]
        GR["generate_recommendations()"]
    end

    subgraph InternalModules
        GC["GroqClient"]
        PM["PromptManager"]
        JP["JSONParser"]
        RV["ResponseValidator"]
        RISK["RiskEngine (deterministic)"]
        SCHED["SchedulerEngine"]
        REC["RecommendationEngine"]
    end

    PE --> EE
    PE --> RA
    PE --> GS
    PE --> GR
    EE --> GC
    RA --> RISK
    GS --> SCHED
    GR --> REC
    GC --> PM
    GC --> JP
    GC --> RV
```

