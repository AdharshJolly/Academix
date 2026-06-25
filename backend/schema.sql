-- CampusFlow Database Schema
-- Version: 1.2 (Frozen)
-- Platform: Supabase PostgreSQL 15
-- Run this script in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: users
-- Extends Supabase auth.users
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    avatar_url  VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: tasks
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','completed','cancelled')),
    priority    VARCHAR(20) NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','urgent')),
    due_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id  ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: intelligence_reports
-- Stores all AI analysis outputs
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id             UUID REFERENCES tasks(id) ON DELETE SET NULL,
    input_type          VARCHAR(20) NOT NULL
                          CHECK (input_type IN ('notice','risk','schedule')),
    raw_input           TEXT NOT NULL,
    extracted_events    JSONB NOT NULL DEFAULT '[]',
    risk_assessment     JSONB NOT NULL DEFAULT '{}',
    recommendations     JSONB NOT NULL DEFAULT '[]',
    study_schedule      JSONB NOT NULL DEFAULT '[]',
    risk_score          FLOAT NOT NULL DEFAULT 0.0
                          CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_user_id    ON intelligence_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_created_at ON intelligence_reports(created_at);

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: automation_logs
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    intelligence_report_id   UUID REFERENCES intelligence_reports(id) ON DELETE SET NULL,
    workflow_type            VARCHAR(20) NOT NULL
                               CHECK (workflow_type IN ('task','notice','schedule')),
    status                   VARCHAR(20) NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','success','failed')),
    payload                  JSONB NOT NULL DEFAULT '{}',
    response                 JSONB NOT NULL DEFAULT '{}',
    triggered_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_user_id      ON automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_status       ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_triggered_at ON automation_logs(triggered_at);

-- ──────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Enable RLS on all tables
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs      ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ──────────────────────────────────────────────────────────────────────────
-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Tasks are fully private
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Intelligence Reports are fully private
CREATE POLICY "Users can manage own reports" ON intelligence_reports
  FOR ALL USING (auth.uid() = user_id);

-- Automation Logs are fully private
CREATE POLICY "Users can manage own automation logs" ON automation_logs
  FOR ALL USING (auth.uid() = user_id);
