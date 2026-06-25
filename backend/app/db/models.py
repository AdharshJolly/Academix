"""
ORM Model Placeholders
Tables: users, tasks, intelligence_reports, automation_logs
See backend/schema.sql for full DDL.
"""


class User:
    """Mirrors the users table."""
    # id: uuid PK (references auth.users)
    # email: varchar UNIQUE NOT NULL
    # full_name: varchar NOT NULL
    # avatar_url: varchar nullable
    # created_at: timestamptz
    # updated_at: timestamptz
    pass


class Task:
    """Mirrors the tasks table."""
    # id: uuid PK
    # user_id: uuid FK → users.id
    # title: varchar NOT NULL
    # description: text nullable
    # status: varchar DEFAULT 'pending'
    # priority: varchar DEFAULT 'medium'
    # due_date: date nullable
    # created_at: timestamptz
    # updated_at: timestamptz
    pass


class IntelligenceReport:
    """Mirrors the intelligence_reports table."""
    # id: uuid PK
    # user_id: uuid FK → users.id
    # task_id: uuid FK → tasks.id (nullable)
    # input_type: varchar (notice|risk|schedule)
    # raw_input: text NOT NULL
    # extracted_events: jsonb DEFAULT '[]'
    # risk_assessment: jsonb DEFAULT '{}'
    # recommendations: jsonb DEFAULT '[]'
    # study_schedule: jsonb DEFAULT '[]'
    # risk_score: float DEFAULT 0.0
    # created_at: timestamptz
    pass


class AutomationLog:
    """Mirrors the automation_logs table."""
    # id: uuid PK
    # user_id: uuid FK → users.id
    # intelligence_report_id: uuid FK → intelligence_reports.id (nullable)
    # workflow_type: varchar (task|notice|schedule)
    # status: varchar DEFAULT 'pending'
    # payload: jsonb DEFAULT '{}'
    # response: jsonb DEFAULT '{}'
    # triggered_at: timestamptz
    # completed_at: timestamptz nullable
    pass

