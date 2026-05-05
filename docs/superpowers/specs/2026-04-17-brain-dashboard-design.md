# Mind Dashboard Design

**Date:** 2026-04-17  
**Status:** Approved

---

## Goal

A single-page web dashboard at `mind.YOUR_DOMAIN.com` showing all brain state at a glance: active agents and their sub-agents, cron jobs, active tasks, projects, recent memories, and recent sessions. Built for Bharat now, architected to extend to multi-user StellarOS later.

---

## Architecture

### Hosting
Vite React app deployed to Cloudflare Pages. Cloudflare Pages serves the static frontend and runs a catch-all Pages Function that proxies all `/api/*` requests to the brain worker, injecting the API key server-side.

`mind.YOUR_DOMAIN.com` → Cloudflare Pages (dashboard UI + proxy function)  
`mind-worker.YOUR_SUBDOMAIN.workers.dev` → Cloudflare Worker (existing REST API, unchanged URL)

### Data Flow
```
Browser
  → GET /api/context (Pages Function)
  → adds Authorization: Bearer $MIND_API_KEY
  → mind-worker.YOUR_SUBDOMAIN.workers.dev/context
  → Neon Postgres
  → response back to browser
```

The API key is stored as a Cloudflare Pages environment variable (`MIND_API_KEY`). The frontend never sees it.

### File Structure
```
mind-dashboard/
  src/
    App.tsx                   — root component, polling loop
    components/
      AgentCard.tsx           — agent status + sub-agents nested
      TaskList.tsx            — active + in-progress tasks
      ProjectGrid.tsx         — project cards
      MemoryFeed.tsx          — recent memories by importance
      SessionLog.tsx          — recent sessions per agent
      CronTable.tsx           — cron jobs + last run status
  functions/
    api/
      [[path]].ts             — catch-all proxy to brain worker
  public/
  index.html
  vite.config.ts
  package.json
  wrangler.toml
```

---

## New Brain API Additions

Two new DB tables and endpoints are required. These are added to the existing brain worker and Neon schema.

### `cron_jobs` table
```sql
CREATE TABLE cron_jobs (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  agent_name  TEXT NOT NULL,
  schedule    TEXT NOT NULL,          -- cron expression e.g. "0 * * * *"
  last_run    TIMESTAMPTZ,
  last_status TEXT DEFAULT 'unknown', -- ok | error | running
  last_error  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX cron_jobs_name_agent ON cron_jobs(name, agent_name);
```

### `subagents` table
```sql
CREATE TABLE subagents (
  id           SERIAL PRIMARY KEY,
  parent_agent TEXT NOT NULL,
  name         TEXT NOT NULL,         -- e.g. "Explore", "code-architect"
  task         TEXT,
  status       TEXT DEFAULT 'running',-- running | done | error
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### New Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cron` | Upsert a cron job record (name, agent_name, schedule, status, error?) |
| GET | `/crons` | List all cron jobs |
| POST | `/subagent` | Create or update a subagent record |
| GET | `/subagents` | List subagents (optionally ?parent=agent-name&status=running) |

### Updated `/context` endpoint
Include active subagents and recent cron runs in the `<brain-context>` block so agents can see this state at session start.

---

## Dashboard UI

Single page, no routing. Dark background (#0f0f0f), clean sans-serif (Inter or system font), color-coded status indicators.

Auto-refreshes every 60 seconds. Manual refresh button top-right.

### Sections (top to bottom)

**1. Agents**  
One card per registered agent. Shows: agent name, status (active/idle), current task, last seen timestamp. Nested below each card: any sub-agents with status (running = green spinner, done = grey, error = red).

```
┌──────────────────────────────┐
│ claude-mac        🟢 active  │
│ Last seen: 2 min ago         │
│ Building dashboard           │
│  └─ Explore       ✓ done     │
│  └─ code-architect ● running │
└──────────────────────────────┘
```

**2. Cron Jobs**  
Table: Name | Agent | Schedule | Last Run | Status. Color-coded status: ok=green, error=red, running=yellow, unknown=grey.

**3. Active Tasks**  
List of tasks with status `pending` or `in_progress`. Shows title, assigned agent, priority. Grouped by agent.

**4. Projects**  
Cards: name, status badge, description. Archived projects hidden.

**5. Recent Memories**  
List of last 20 memories sorted by importance desc. Shows importance badge, category tag, content.

**6. Recent Sessions**  
Last 10 sessions across all agents. Shows agent name, timestamp, summary.

---

## mind-sync Skill Updates

The `skills/claude-code/mind-sync.md` and `skills/hermes/mind-sync.md` are updated to document how agents report crons and sub-agents:

**Report a cron job firing:**
```bash
curl -s -X POST "$MIND_URL/cron" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"context-load","agent_name":"claude-mac","schedule":"@session_start","last_status":"ok"}'
```

**Report a sub-agent:**
```bash
curl -s -X POST "$MIND_URL/subagent" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"parent_agent":"claude-mac","name":"Explore","task":"Find API endpoints","status":"running"}'
```

---

## Deployment

1. `mind-dashboard/` lives in the `mpbharat/brain` GitHub repo
2. Cloudflare Pages connected to the repo, build command: `npm run build`, output: `dist/`
3. `MIND_API_KEY` set as a Cloudflare Pages environment variable
4. `mind.YOUR_DOMAIN.com` custom domain pointed at Cloudflare Pages (replacing the current worker route)
5. Brain worker stays at `mind-worker.YOUR_SUBDOMAIN.workers.dev` — the Pages Function calls it directly

---

## Future (StellarOS)

- Add Cloudflare Access or JWT auth in front of the Pages Function
- Each user brings their own brain worker URL + API key (stored in session)
- The proxy function becomes a true BFF that routes to per-user workers
- No frontend changes needed — data shape stays the same
