-- Mindbase — Database Schema
-- Run this in Neon SQL Editor after enabling pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- ── projects ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active', -- active | paused | archived
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── agents ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  agent_type   TEXT NOT NULL DEFAULT 'claude-code', -- claude-code | hermes | custom
  last_seen    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── agent_states ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_states (
  id           SERIAL PRIMARY KEY,
  agent_name   TEXT NOT NULL UNIQUE,
  state        JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── agent_tasks ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | done | cancelled
  priority     INTEGER NOT NULL DEFAULT 5,        -- 1 (low) to 10 (critical)
  agent_name   TEXT,
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  result       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── memories ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memories (
  id           SERIAL PRIMARY KEY,
  content      TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general',   -- general | decision | fact | person | project
  importance   INTEGER NOT NULL DEFAULT 5,         -- 1 (low) to 10 (critical)
  agent_name   TEXT,
  embedding    vector(1536),                       -- Workers AI embeddings for semantic search
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── backlog_items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backlog_items (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     INTEGER NOT NULL DEFAULT 5,
  tags         JSONB NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'active',    -- active | done | dropped
  type         TEXT NOT NULL DEFAULT 'issue',     -- epic | issue | task
  parent_id    INTEGER REFERENCES backlog_items(id) ON DELETE SET NULL,
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sessions ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           SERIAL PRIMARY KEY,
  agent_name   TEXT NOT NULL,
  summary      TEXT,
  session_data JSONB NOT NULL DEFAULT '{}',
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── cron_jobs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron_jobs (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  agent_name  TEXT NOT NULL,
  schedule    TEXT NOT NULL DEFAULT '@session',
  last_run    TIMESTAMPTZ,
  last_status TEXT NOT NULL DEFAULT 'unknown',
  last_error  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS cron_jobs_name_agent ON cron_jobs(name, agent_name);

-- ── subagents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subagents (
  id           SERIAL PRIMARY KEY,
  parent_agent TEXT NOT NULL,
  name         TEXT NOT NULL,
  task         TEXT,
  status       TEXT NOT NULL DEFAULT 'running',
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memories_category    ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_importance  ON memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_project     ON memories(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent          ON agent_tasks(agent_name);
CREATE INDEX IF NOT EXISTS idx_tasks_priority       ON agent_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_backlog_status       ON backlog_items(status);
CREATE INDEX IF NOT EXISTS idx_sessions_agent       ON sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_sessions_created     ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subagents_parent     ON subagents(parent_agent);
CREATE INDEX IF NOT EXISTS idx_subagents_status     ON subagents(status);
