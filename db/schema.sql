-- Brain Context System — Database Schema
-- Run this in Neon SQL Editor after enabling pgvector

-- Enable vector extension (if not already done via Prompt 2)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── projects ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active', -- active | paused | archived
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── agents ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  agent_type   TEXT NOT NULL DEFAULT 'claude-code', -- claude-code | hermes | cowork
  last_seen    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── agent_states ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_states (
  id           SERIAL PRIMARY KEY,
  agent_name   TEXT NOT NULL UNIQUE,
  state        JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── agent_tasks ─────────────────────────────────────────────────────────────
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

-- ─── memories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memories (
  id           SERIAL PRIMARY KEY,
  content      TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general',   -- general | decision | fact | person | project
  importance   INTEGER NOT NULL DEFAULT 5,         -- 1 (low) to 10 (critical)
  agent_name   TEXT,
  embedding    vector(1536),                       -- OpenAI/Workers AI embeddings
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── backlog_items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backlog_items (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     INTEGER NOT NULL DEFAULT 5,
  tags         JSONB NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'active',    -- active | done | dropped
  project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── sessions ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           SERIAL PRIMARY KEY,
  agent_name   TEXT NOT NULL,
  summary      TEXT,
  session_data JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memories_category    ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_importance  ON memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_project     ON memories(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent          ON agent_tasks(agent_name);
CREATE INDEX IF NOT EXISTS idx_tasks_priority       ON agent_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_backlog_status       ON backlog_items(status);
CREATE INDEX IF NOT EXISTS idx_sessions_agent       ON sessions(agent_name);
CREATE INDEX IF NOT EXISTS idx_sessions_created     ON sessions(created_at DESC);

-- ─── Seed data: Bharat's core projects ───────────────────────────────────────
INSERT INTO projects (name, description, status) VALUES
  ('Anchor', 'Commitment protection app — the 3-screen mobile app that shows cost of saying yes before deciding', 'active'),
  ('Zaasu', 'AI finance coaching app at zaasu.com — main venture, getting it live is priority', 'active'),
  ('KPS / Mart', 'Senior PM role at KPS Dubai — deliver Graphtec + Het Anker pilots, keep Viktor trust', 'active'),
  ('Health', 'Gym 5x/week + diet with Amu — started Feb 2026, building the habit', 'active'),
  ('Dhiya', 'Evening time with daughter — chess, reading, swimming plan, 45min minimum daily', 'active')
ON CONFLICT (name) DO NOTHING;

-- ─── Seed: core memories ─────────────────────────────────────────────────────
INSERT INTO memories (content, category, importance, agent_name) VALUES
  ('Bharat is a Senior PM at KPS Dubai. Survived Jan 2026 layoffs by creating Mart GTM solo.', 'person', 10, 'system'),
  ('Core struggle: cannot say no. Gets pulled into new things and loses track of commitments.', 'person', 10, 'system'),
  ('Has overcome alcohol addiction, gambling addiction, 150kg+ weight. Systems-thinker. Atomic Habits worked.', 'person', 9, 'system'),
  ('Anchor app: 3 screens — Today (commitments + energy bar), Detail (tap-in), Gate (new commitment with cost trade-off).', 'project', 9, 'system'),
  ('Tech stack: Next.js prototype first (localStorage), then Expo + React Native for real app.', 'decision', 8, 'system'),
  ('Energy system: each commitment costs energy (Gym=15, Zaasu=30, Dhiya=20, KPS=25). Total 90/100. 10 left.', 'fact', 9, 'system'),
  ('Bharat lives in Dubai, UAE. Wife is Amu. Daughter Dhiya starting pre-KG April 2026.', 'person', 8, 'system'),
  ('Do NOT touch the 3D scene code in stellaros/. Just reroute it to /galaxy. All 15 commits preserved.', 'decision', 9, 'system')
ON CONFLICT DO NOTHING;
