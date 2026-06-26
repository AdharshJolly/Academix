# Database Schema Reference
## Academix — Autonomous Academic Copilot
**Version:** 1.2 | **Status:** Frozen

---

## Tables

| Table                | Description                            |
|----------------------|----------------------------------------|
| users                | Student profiles (extends Supabase Auth) |
| tasks                | Academic tasks and deadlines           |
| intelligence_reports | AI analysis outputs                    |
| automation_logs      | Make.com workflow execution history         |

All AI output is stored in `intelligence_reports`.
No separate AI output tables exist.

---

## ER Diagram

```mermaid
erDiagram
    users {
        uuid id PK "References auth.users.id"
        varchar email UK "NOT NULL"
        varchar full_name "NOT NULL"
        varchar avatar_url
        text google_refresh_token
        boolean google_calendar_connected
        varchar whatsapp_number
        varchar academic_year
        varchar major
        float gpa
        float study_hours
        text primary_objective
        jsonb learning_protocols
        varchar telegram_chat_id
        varchar telegram_username
        boolean whatsapp_notifications_enabled "DEFAULT TRUE"
        boolean telegram_notifications_enabled "DEFAULT FALSE"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    tasks {
        uuid id PK "DEFAULT gen_random_uuid()"
        uuid user_id FK "NOT NULL → users.id"
        varchar title "NOT NULL"
        text description
        varchar status "DEFAULT pending"
        varchar priority "DEFAULT medium"
        date due_date
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    intelligence_reports {
        uuid id PK "DEFAULT gen_random_uuid()"
        uuid user_id FK "NOT NULL → users.id"
        uuid task_id FK "→ tasks.id (nullable)"
        varchar input_type "NOT NULL: notice|risk|schedule"
        text raw_input "NOT NULL"
        jsonb extracted_events "DEFAULT '[]'"
        jsonb risk_assessment "DEFAULT '{}'"
        jsonb recommendations "DEFAULT '[]'"
        jsonb study_schedule "DEFAULT '[]'"
        float risk_score "DEFAULT 0.0"
        timestamptz created_at "DEFAULT NOW()"
    }

    automation_logs {
        uuid id PK "DEFAULT gen_random_uuid()"
        uuid user_id FK "NOT NULL → users.id"
        uuid intelligence_report_id FK "→ intelligence_reports.id (nullable)"
        varchar workflow_type "NOT NULL: task|notice|schedule"
        varchar status "NOT NULL: pending|success|failed"
        jsonb payload "DEFAULT '{}'"
        jsonb response "DEFAULT '{}'"
        timestamptz triggered_at "DEFAULT NOW()"
        timestamptz completed_at
    }

    users ||--o{ tasks : "user_id"
    users ||--o{ intelligence_reports : "user_id"
    users ||--o{ automation_logs : "user_id"
    tasks ||--o{ intelligence_reports : "task_id"
    intelligence_reports ||--o{ automation_logs : "intelligence_report_id"
```

---

## Constraints

### users
| Column     | Constraint       |
|------------|------------------|
| id         | PK, REFERENCES auth.users(id) ON DELETE CASCADE |
| email      | UNIQUE, NOT NULL |
| full_name  | NOT NULL         |
| created_at | DEFAULT NOW()    |
| updated_at | DEFAULT NOW()    |

### tasks
| Column     | Constraint                                        |
|------------|---------------------------------------------------|
| id         | PK, DEFAULT gen_random_uuid()                     |
| user_id    | FK → users.id, ON DELETE CASCADE, NOT NULL        |
| title      | NOT NULL, VARCHAR(255)                            |
| status     | CHECK (status IN ('pending','in_progress','completed','cancelled')) |
| priority   | CHECK (priority IN ('low','medium','high','urgent')) |

### intelligence_reports
| Column      | Constraint                                       |
|-------------|--------------------------------------------------|
| id          | PK, DEFAULT gen_random_uuid()                    |
| user_id     | FK → users.id, ON DELETE CASCADE, NOT NULL       |
| task_id     | FK → tasks.id, ON DELETE SET NULL (nullable)     |
| input_type  | CHECK (input_type IN ('notice','risk','schedule')) |
| raw_input   | NOT NULL                                         |
| risk_score  | CHECK (risk_score >= 0 AND risk_score <= 1)      |

### automation_logs
| Column      | Constraint                                       |
|-------------|--------------------------------------------------|
| id          | PK, DEFAULT gen_random_uuid()                    |
| user_id     | FK → users.id, ON DELETE CASCADE, NOT NULL       |
| workflow_type | CHECK (workflow_type IN ('task','notice','schedule')) |
| status      | CHECK (status IN ('pending','success','failed')) |

---

## Indexes

```sql
-- tasks
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- intelligence_reports
CREATE INDEX idx_intelligence_user_id ON intelligence_reports(user_id);
CREATE INDEX idx_intelligence_created_at ON intelligence_reports(created_at);

-- automation_logs
CREATE INDEX idx_automation_user_id ON automation_logs(user_id);
CREATE INDEX idx_automation_status ON automation_logs(status);
CREATE INDEX idx_automation_triggered_at ON automation_logs(triggered_at);
```

---

## Notes
- Row Level Security (RLS) must be enabled on all tables via Supabase
- All `id` columns use UUID v4
- Timestamps use `timestamptz` (timezone-aware)

