# Brain — Design Spec

**Date:** 2026-04-16  
**Project:** `mpbharat/brain` (private → open-source as StellarOS)  
**Owner:** Bharat Sankar (YOUR_DOMAIN.com)  
**Status:** Approved, ready for implementation

---

## What This Is

A fully cloud-hosted, machine-decoupled memory and agent state system for AI agents. Every Claude Code instance, Hermes agent, and Claude Desktop session reads and writes to the same brain automatically — on session open and close, via hooks. No manual invocation. No local state. If every machine burns down, plug in a new one, copy one settings file, and full memory is restored.

Long-term: open-sourced as StellarOS — a platform anyone can self-host or use via stellarOS.com to give their AI agents persistent, shared memory and a live control room dashboard.

---

## Problem It Solves

- Memory is siloed per machine, per agent, per session
- No visibility into what other agents are doing simultaneously
- Context lost on session close — every session starts cold
- No single place to see project status, backlog, and agent activity

---

## Architecture

```
Any machine, any agent
──────────────────────────────────────────────
Claude Code (Mac)    ─┐
Claude Code (Ubuntu) ─┤
Claude Desktop       ─┤── MCP / REST ──→  mind.YOUR_DOMAIN.com
Hermes (Mac)         ─┤                   (Cloudflare Worker)
Hermes (Ubuntu)      ─┘                          │
Future agents ────────────────────────────────────┘
                                                  │
                               ┌──────────────────┼────────────────────┐
                               ▼                                        ▼
                         Neon Postgres                        Cloudflare Pages
                         + pgvector                           mind.YOUR_DOMAIN.com
                         (all persistent data)                (dashboard)
```

**Design principle:** The Worker is stateless. All data lives in Neon. If the Worker is redeployed, nothing is lost. If Neon goes down, the Worker fails gracefully. Machines are thin clients only.

---

## Tech Stack

| Layer | Service | Why | Cost |
|---|---|---|---|
| API + MCP server | Cloudflare Workers (TypeScript) | Already in stack, stateless, no cold-start ops, 100K req/day free | $0 |
| Database | Neon Postgres + pgvector | Fully managed, never tied to a machine, vector search built-in | $0 |
| Dashboard | Cloudflare Pages (React) | Same ecosystem, zero deploy ops | $0 |
| CLI | mind-cli (Node.js, npx) | Lightweight hook runner, no global install required | $0 |
| Domain | mind.YOUR_DOMAIN.com | Cloudflare DNS, already controlled | $0 |

---

## Database Schema

```sql
-- Projects (defined first — referenced by agent_tasks, memories, backlog_items)
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  status      TEXT DEFAULT 'active',   -- active | paused | archived
  description TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Registered agents
CREATE TABLE agents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,           -- "claude-mac", "hermes-ubuntu"
  type        TEXT NOT NULL,           -- claude-code | hermes | claude-desktop | custom
  machine     TEXT NOT NULL,           -- "mac" | "ubuntu"
  status      TEXT DEFAULT 'offline',  -- online | idle | offline
  last_seen   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Live agent state (one row per agent, upserted on conflict agent_id)
CREATE TABLE agent_states (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       UUID REFERENCES agents(id) UNIQUE,
  previous_task  TEXT,
  current_task   TEXT,
  next_task      TEXT,
  mood           TEXT DEFAULT 'idle',  -- idle | thinking | working | waiting | done
  context        JSONB,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Task history per agent
CREATE TABLE agent_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID REFERENCES agents(id),
  project_id   UUID REFERENCES projects(id),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'queued',  -- queued | in_progress | done | cancelled
  priority     INT DEFAULT 2,          -- 1 high, 2 medium, 3 low
  output       TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Semantic memory store
-- Embedding model: Cloudflare Workers AI @cf/baai/bge-base-en-v1.5 (free, in-worker)
-- Output dimensions: 768
CREATE TABLE memories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content        TEXT NOT NULL,
  embedding      vector(768),
  tags           TEXT[],
  project_id     UUID REFERENCES projects(id),
  agent_id       UUID REFERENCES agents(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops);

-- Backlog items
CREATE TABLE backlog_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id),
  title       TEXT NOT NULL,
  status      TEXT DEFAULT 'todo',     -- todo | in_progress | done
  priority    INT DEFAULT 2,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Session log
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID REFERENCES agents(id),
  summary     TEXT,
  started_at  TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ
);
```

---

## Worker API Routes

### Auth
All routes require `X-Brain-Key: <api-key>` header. Returns 401 otherwise.

### Agents
```
POST   /agents                     Register agent
POST   /agents/:id/heartbeat       Keep status green (every 5 min)
GET    /agents                     List all agents + current state
```

### Agent State
```
PUT    /agents/:id/state           Set current/next task, mood
POST   /agents/:id/tasks           Add task to queue
PATCH  /agents/:id/tasks/:tid      Update task (complete, cancel)
GET    /agents/:id/tasks           Get task queue
```

### Memory
```
POST   /memories                   Add memory (with embedding generation)
GET    /memories/search?q=         Semantic + keyword search
GET    /memories                   List recent (filter: agent, project, tag)
DELETE /memories/:id               Remove memory
```

### Projects + Backlog
```
GET    /projects                   List all projects
POST   /projects                   Create project
PATCH  /projects/:id               Update status/description
GET    /projects/:id/backlog       Get backlog items
POST   /projects/:id/backlog       Add item
PATCH  /backlog/:id                Update item (complete, reprioritise)
```

### Sessions
```
POST   /sessions                   Log session start
PATCH  /sessions/:id               Log session end + summary
```

### Context (used by hooks)
```
GET    /context?agent_id=          Returns: agent state + recent memories + active backlog
                                   Formatted as markdown, ready to inject into session
```

---

## MCP Protocol

The Worker exposes an MCP-compatible endpoint at `POST /mcp`.

**Tools available to every MCP-connected agent:**

```typescript
register_agent(name, type, machine)
heartbeat(agent_id)
set_state(agent_id, current_task, next_task?, mood?)
complete_task(agent_id, task_id, output?)
add_memory(content, tags?, project_id?)
search_memory(query, limit?)
get_context(agent_id)
update_project(id, status, description?)
add_backlog_item(project_id, title, priority?)
complete_backlog_item(id)
start_session(agent_id)
end_session(agent_id, summary)
```

---

## Session Hook Behaviour

### SessionStart (automatic on every Claude Code session open)

The hook runs `npx mind-cli context --agent <name>` which:
1. POSTs heartbeat → agent status turns green
2. GETs `/context?agent_id=...`
3. Injects the response as `<brain-context>` block into the session

What Claude sees at the start of every session:
```
<brain-context>
Agent: claude-mac | Status: online
Previous task: Fixed Zaasu logout flow (2026-04-15)
Next task: Build mind-worker schema

Active projects:
• Zaasu — active (3 backlog items)
• Brain — active (8 backlog items)

Recent memories:
• GoRouter: never navigate to /login after logout...
• Pattern Analyzer uses mistralai/mistral-medium-3...
</brain-context>
```

### Stop (automatic on every session close)

The hook runs `npx mind-cli save --agent <name>` which prompts Claude to:
1. Summarise what was done in one sentence → `previous_task`
2. State what's next if known → `next_task`
3. Save any new memories worth keeping
4. POST session end + summary

**Result:** Every session starts knowing exactly where it left off. Every session ends with its output stored.

---

## Hermes Integration

Hermes uses a skill file at `~/.hermes/skills/mind-sync/SKILL.md`. The skill:
- On activation: calls `GET /context` and loads it as resident memory
- Registers Hermes as an agent via `POST /agents`
- On session end: posts memories + state update

Hermes memory provider config (`~/.hermes/config.yaml`):
```yaml
memory_provider:
  type: http
  base_url: https://mind.YOUR_DOMAIN.com
  api_key: ${MIND_API_KEY}
  endpoints:
    add: /memories
    search: /memories/search
    context: /context
```

---

## hooks/settings.json (copy to ~/.claude/settings.json on any machine)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "npx mind-cli@latest context --agent ${MIND_AGENT_NAME}",
        "description": "Load brain context on session start"
      }
    ],
    "Stop": [
      {
        "command": "npx mind-cli@latest save --agent ${MIND_AGENT_NAME}",
        "description": "Save session summary and memories on close"
      }
    ]
  }
}
```

Per-machine env vars (in `~/.env` or shell profile):
```bash
MIND_API_KEY=your-key
MIND_AGENT_NAME=claude-mac   # or claude-ubuntu, etc.
```

---

## Dashboard (mind.YOUR_DOMAIN.com)

**5 views:**

### / — Agent Control Room
Live cards per agent. Status indicator (green/yellow/red). Current task. Previous task. Next task. Last seen timestamp. Click agent → task history.

### /memory
Full memory search with pgvector semantic search. Filter by: agent, project, tag, date range. Add/delete memories manually.

### /projects
All projects with status. Kanban-style backlog per project. Add items, mark done, reprioritise.

### /sessions
Timeline of all agent sessions. Who was active when. What they did (summary). Click to expand memories saved in that session.

### /agents
Agent registry. Add new agents. View config snippet to copy. API key management.

---

## Repo Structure

```
brain/                              ← github.com/mpbharat/brain
├── mind-worker/                   ← Cloudflare Worker
│   ├── src/
│   │   ├── index.ts                ← router + auth middleware
│   │   ├── mcp.ts                  ← MCP protocol handler
│   │   ├── routes/
│   │   │   ├── agents.ts
│   │   │   ├── memories.ts
│   │   │   ├── projects.ts
│   │   │   └── sessions.ts
│   │   └── lib/
│   │       ├── db.ts               ← Neon client
│   │       └── embed.ts            ← Cloudflare Workers AI (@cf/baai/bge-base-en-v1.5, 768-dim, free)
│   ├── wrangler.toml
│   └── package.json
│
├── mind-dashboard/                ← React app → Cloudflare Pages
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ControlRoom.tsx
│   │   │   ├── Memory.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Sessions.tsx
│   │   │   └── Agents.tsx
│   │   └── lib/
│   │       └── api.ts              ← typed fetch wrapper
│   └── package.json
│
├── mind-cli/                      ← npx mind-cli (Node.js)
│   ├── src/
│   │   ├── index.ts                ← CLI entrypoint
│   │   ├── context.ts              ← fetch + format + inject context
│   │   └── save.ts                 ← save session summary + memories
│   └── package.json
│
├── skills/
│   ├── claude-code/
│   │   └── mind-sync.md           ← Claude Code skill
│   └── hermes/
│       └── mind-sync.md           ← Hermes skill
│
├── hooks/
│   └── settings.json               ← drop into ~/.claude/settings.json
│
├── db/
│   └── schema.sql                  ← full Neon schema
│
└── docs/
    ├── setup.md                    ← one-page setup guide
    └── contributing.md             ← open-source ready
```

---

## Open-Source Path (StellarOS)

The system is built multi-tenant-ready from day one:
- All tables include `user_id` (currently hardcoded, later from JWT)
- API key auth is already the access model
- Worker is stateless and deployable by anyone via `wrangler deploy`

When open-sourced as StellarOS:
- Users sign up → get API key → copy `hooks/settings.json` → done
- StellarOS.com hosts the managed version
- The StellarOS 3D galaxy dashboard (in `OLD_IDEAS/stellaros/`) becomes the premium view: agents as glowing nodes, memories as particle connections, projects as star systems

---

## What "New Machine" Looks Like

```bash
git clone https://github.com/mpbharat/brain
cp brain/hooks/settings.json ~/.claude/settings.json
echo "MIND_API_KEY=xxx" >> ~/.zshrc
echo "MIND_AGENT_NAME=claude-newmachine" >> ~/.zshrc
# Done. Full memory on this machine.
```

---

## Not In Scope (This Phase)

- Multi-user / StellarOS platform (Phase 2)
- 3D galaxy dashboard (Phase 2, uses OLD_IDEAS/stellaros/)
- Mobile app
- Real-time WebSocket push to dashboard (polling is fine for now)
- Embedding model choice locked in — use Cloudflare AI (free, in-worker)
