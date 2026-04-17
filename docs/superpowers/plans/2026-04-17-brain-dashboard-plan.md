# Brain Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page web dashboard at brain.YOUR_DOMAIN.com showing all brain state — agents, sub-agents, cron jobs, tasks, projects, memories, sessions.

**Architecture:** Vite React app in `brain-dashboard/` deployed to Cloudflare Pages. A catch-all Pages Function (`functions/api/[[path]].ts`) proxies all `/api/*` requests to the brain worker with the API key injected server-side. The brain worker gets new endpoints for cron jobs, sub-agents, and agent listing.

**Tech Stack:** Vite 6, React 18, TypeScript, Cloudflare Pages, Cloudflare Pages Functions, Neon Postgres (existing)

---

## File Map

**New files — brain-worker:**
- `brain-worker/src/index.ts` — add 6 new endpoints, update /context (modify)

**New files — DB:**
- `db/schema.sql` — add cron_jobs + subagents tables (modify)

**New files — brain-dashboard:**
- `brain-dashboard/package.json`
- `brain-dashboard/tsconfig.json`
- `brain-dashboard/vite.config.ts`
- `brain-dashboard/index.html`
- `brain-dashboard/.env.local` (gitignored — dev only)
- `brain-dashboard/wrangler.toml`
- `brain-dashboard/functions/api/[[path]].ts` — proxy to brain worker
- `brain-dashboard/src/types.ts` — all TypeScript interfaces
- `brain-dashboard/src/api.ts` — fetch helpers (dev: direct, prod: via proxy)
- `brain-dashboard/src/styles.ts` — all inline style objects
- `brain-dashboard/src/App.tsx` — root, polling loop, layout
- `brain-dashboard/src/components/AgentCard.tsx`
- `brain-dashboard/src/components/CronTable.tsx`
- `brain-dashboard/src/components/TaskList.tsx`
- `brain-dashboard/src/components/ProjectGrid.tsx`
- `brain-dashboard/src/components/MemoryFeed.tsx`
- `brain-dashboard/src/components/SessionLog.tsx`

**Modified files — skills:**
- `skills/claude-code/brain-sync.md` — add cron + subagent reporting
- `skills/hermes/brain-sync.md` — same

---

## Task 1: DB Migrations

**Files:**
- Modify: `db/schema.sql`

- [ ] **Step 1: Add cron_jobs and subagents to schema.sql**

Append to the end of `db/schema.sql`:

```sql
-- ─── cron_jobs ───────────────────────────────────────────────────────────────
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

-- ─── subagents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subagents (
  id           SERIAL PRIMARY KEY,
  parent_agent TEXT NOT NULL,
  name         TEXT NOT NULL,
  task         TEXT,
  status       TEXT NOT NULL DEFAULT 'running',
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_subagents_parent ON subagents(parent_agent);
CREATE INDEX IF NOT EXISTS idx_subagents_status ON subagents(status);
```

- [ ] **Step 2: Run the migration on Neon**

Open the Neon console at console.neon.tech → your brain project → SQL Editor. Paste and run only the two `CREATE TABLE` + `CREATE INDEX` blocks above (not the whole schema.sql). You should see "CREATE TABLE" and "CREATE INDEX" success messages.

- [ ] **Step 3: Commit schema update**

```bash
cd ~//Documents/Claude/LifeOS
git add db/schema.sql
git commit -m "feat: add cron_jobs and subagents tables"
```

---

## Task 2: Worker — New Listing Endpoints

**Files:**
- Modify: `brain-worker/src/index.ts`

The existing worker has `GET /agent-state/:name` but no endpoint to list all agents or all agent states. Add these after the existing `GET /agent-state/:name` block (around line 215).

- [ ] **Step 1: Add GET /agents and GET /agent-states after line 215**

Find this line in `brain-worker/src/index.ts`:
```typescript
      // ─── POST /project ─────────────────────────────────────────────────────
```

Insert before it:
```typescript
      // ─── GET /agents ──────────────────────────────────────────────────────
      if (path === "/agents" && method === "GET") {
        const agents = await sql`SELECT * FROM agents ORDER BY last_seen DESC NULLS LAST`;
        return json({ agents });
      }

      // ─── GET /agent-states ────────────────────────────────────────────────
      if (path === "/agent-states" && method === "GET") {
        const states = await sql`SELECT * FROM agent_states ORDER BY updated_at DESC`;
        return json({ states });
      }

```

- [ ] **Step 2: Verify the file compiles**

```bash
cd ~//Documents/Claude/LifeOS/brain-worker
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Worker — Cron and Subagent Endpoints

**Files:**
- Modify: `brain-worker/src/index.ts`

- [ ] **Step 1: Add POST /cron and GET /crons**

Insert after `GET /agent-states` (after the block you added in Task 2):

```typescript
      // ─── POST /cron ────────────────────────────────────────────────────────
      if (path === "/cron" && method === "POST") {
        const body = (await request.json()) as {
          name: string;
          agent_name: string;
          schedule?: string;
          last_status?: string;
          last_error?: string;
        };
        const { name, agent_name, schedule = "@session", last_status = "ok", last_error } = body;

        await sql`
          INSERT INTO cron_jobs (name, agent_name, schedule, last_run, last_status, last_error)
          VALUES (${name}, ${agent_name}, ${schedule}, NOW(), ${last_status}, ${last_error || null})
          ON CONFLICT (name, agent_name) DO UPDATE
            SET last_run = NOW(),
                last_status = ${last_status},
                last_error = ${last_error || null},
                schedule = ${schedule}
        `;
        return json({ ok: true });
      }

      // ─── GET /crons ────────────────────────────────────────────────────────
      if (path === "/crons" && method === "GET") {
        const cron_jobs = await sql`SELECT * FROM cron_jobs ORDER BY last_run DESC NULLS LAST`;
        return json({ cron_jobs });
      }

      // ─── POST /subagent ────────────────────────────────────────────────────
      if (path === "/subagent" && method === "POST") {
        const body = (await request.json()) as {
          parent_agent: string;
          name: string;
          task?: string;
          status?: string;
        };
        const { parent_agent, name, task, status = "running" } = body;

        const completed_at = status !== "running" ? "NOW()" : null;

        if (status !== "running") {
          await sql`
            INSERT INTO subagents (parent_agent, name, task, status, completed_at)
            VALUES (${parent_agent}, ${name}, ${task || null}, ${status}, NOW())
          `;
        } else {
          await sql`
            INSERT INTO subagents (parent_agent, name, task, status)
            VALUES (${parent_agent}, ${name}, ${task || null}, ${status})
          `;
        }
        return json({ ok: true });
      }

      // ─── GET /subagents ────────────────────────────────────────────────────
      if (path === "/subagents" && method === "GET") {
        const parent = url.searchParams.get("parent");
        const status = url.searchParams.get("status");

        let subagents;
        if (parent && status) {
          subagents = await sql`SELECT * FROM subagents WHERE parent_agent = ${parent} AND status = ${status} ORDER BY started_at DESC LIMIT 50`;
        } else if (parent) {
          subagents = await sql`SELECT * FROM subagents WHERE parent_agent = ${parent} ORDER BY started_at DESC LIMIT 20`;
        } else if (status) {
          subagents = await sql`SELECT * FROM subagents WHERE status = ${status} ORDER BY started_at DESC LIMIT 50`;
        } else {
          subagents = await sql`SELECT * FROM subagents ORDER BY started_at DESC LIMIT 50`;
        }
        return json({ subagents });
      }

```

- [ ] **Step 2: Verify the file compiles**

```bash
cd ~//Documents/Claude/LifeOS/brain-worker
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Worker — Update /context + Deploy

**Files:**
- Modify: `brain-worker/src/index.ts`

- [ ] **Step 1: Update the /context handler to fetch crons and subagents**

Find this block in `/context` (around line 62):
```typescript
        const [projects, memories, tasks, backlog] = await Promise.all([
```

Replace it with:
```typescript
        const [projects, memories, tasks, backlog, cronJobs, activeSubagents] = await Promise.all([
          sql`SELECT name, description, status FROM projects WHERE status != 'archived' ORDER BY updated_at DESC LIMIT 10`,
          sql`SELECT content, category, importance FROM memories ORDER BY importance DESC, created_at DESC LIMIT 20`,
          sql`SELECT title, status, priority, agent_name FROM agent_tasks WHERE status IN ('pending','in_progress') ORDER BY priority DESC, created_at DESC LIMIT 15`,
          sql`SELECT title, priority, tags FROM backlog_items WHERE status = 'active' ORDER BY priority DESC LIMIT 10`,
          sql`SELECT name, agent_name, schedule, last_run, last_status FROM cron_jobs ORDER BY last_run DESC NULLS LAST LIMIT 20`,
          sql`SELECT parent_agent, name, task, status FROM subagents WHERE status = 'running' ORDER BY started_at DESC LIMIT 20`,
        ]);
```

Then find the `const context = ...` template literal and add crons and subagents sections before the closing `</brain-context>`:

```typescript
        const context = `<brain-context>
<projects>
${projects.map((p: Record<string, unknown>) => `  <project name="${p.name}" status="${p.status}">${p.description || ""}</project>`).join("\n")}
</projects>
<memories>
${memories.map((m: Record<string, unknown>) => `  <memory category="${m.category}" importance="${m.importance}">${m.content}</memory>`).join("\n")}
</memories>
<active-tasks>
${tasks.map((t: Record<string, unknown>) => `  <task status="${t.status}" priority="${t.priority}" agent="${t.agent_name}">${t.title}</task>`).join("\n")}
</active-tasks>
<cron-jobs>
${(cronJobs as Record<string, unknown>[]).map(c => `  <cron name="${c.name}" agent="${c.agent_name}" schedule="${c.schedule}" last_status="${c.last_status}" last_run="${c.last_run || 'never'}"/>`).join("\n")}
</cron-jobs>
<active-subagents>
${(activeSubagents as Record<string, unknown>[]).map(s => `  <subagent parent="${s.parent_agent}" name="${s.name}" task="${s.task || ''}" status="${s.status}"/>`).join("\n")}
</active-subagents>
<backlog>
${backlog.map((b: Record<string, unknown>) => `  <item priority="${b.priority}" tags="${(b.tags as string[])?.join(",") || ""}">${b.title}</item>`).join("\n")}
</backlog>
</brain-context>`;
```

- [ ] **Step 2: Deploy the updated worker**

```bash
cd ~//Documents/Claude/LifeOS/brain-worker
npx wrangler deploy 2>&1 | tail -6
```

Expected output ends with:
```
Deployed brain-worker triggers (0.xx sec)
  https://brain-worker.YOUR_SUBDOMAIN.workers.dev
```

- [ ] **Step 3: Smoke test the new endpoints**

```bash
export BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER"
export BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev"

curl -s "$BRAIN_URL/agents" -H "Authorization: Bearer $BRAIN_API_KEY"
# Expected: {"agents":[...]}

curl -s "$BRAIN_URL/crons" -H "Authorization: Bearer $BRAIN_API_KEY"
# Expected: {"cron_jobs":[]}

curl -s "$BRAIN_URL/subagents" -H "Authorization: Bearer $BRAIN_API_KEY"
# Expected: {"subagents":[]}
```

- [ ] **Step 4: Commit worker changes**

```bash
cd ~//Documents/Claude/LifeOS
git add brain-worker/src/index.ts
git commit -m "feat: add agents, crons, subagents endpoints; update /context"
git push
```

---

## Task 5: Scaffold brain-dashboard

**Files:**
- Create: `brain-dashboard/package.json`
- Create: `brain-dashboard/tsconfig.json`
- Create: `brain-dashboard/vite.config.ts`
- Create: `brain-dashboard/index.html`
- Create: `brain-dashboard/wrangler.toml`
- Create: `brain-dashboard/.gitignore`

- [ ] **Step 1: Create package.json**

Create `brain-dashboard/package.json`:
```json
{
  "name": "brain-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler pages deploy dist"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.0",
    "wrangler": "^3.114.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `brain-dashboard/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

Create `brain-dashboard/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 4: Create index.html**

Create `brain-dashboard/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>brain</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0f0f0f; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create wrangler.toml**

Create `brain-dashboard/wrangler.toml`:
```toml
name = "brain-dashboard"
pages_build_output_dir = "dist"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
```

- [ ] **Step 6: Create .gitignore**

Create `brain-dashboard/.gitignore`:
```
node_modules
dist
.env.local
```

- [ ] **Step 7: Create main.tsx**

Create `brain-dashboard/src/main.tsx`:
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Install dependencies**

```bash
cd ~//Documents/Claude/LifeOS/brain-dashboard
npm install
```

Expected: `node_modules/` created, no errors.

---

## Task 6: Pages Function Proxy

**Files:**
- Create: `brain-dashboard/functions/api/[[path]].ts`

- [ ] **Step 1: Create the catch-all Pages Function**

Create `brain-dashboard/functions/api/[[path]].ts`:
```typescript
interface Env {
  BRAIN_API_KEY: string;
  BRAIN_WORKER_URL: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { path?: string[] };
}): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Build worker URL: /api/memories?x=y → BRAIN_WORKER_URL/memories?x=y
  const workerPath = '/' + (params.path ?? []).join('/');
  const workerUrl = `${env.BRAIN_WORKER_URL}${workerPath}${url.search}`;

  // Forward request with API key, strip the original auth header if any
  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${env.BRAIN_API_KEY}`);

  const workerReq = new Request(workerUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
  });

  return fetch(workerReq);
}
```

The env vars `BRAIN_API_KEY` and `BRAIN_WORKER_URL` are set in Cloudflare Pages dashboard (Task 15). For local dev, the API client calls the worker directly (next task).

---

## Task 7: Types and API Client

**Files:**
- Create: `brain-dashboard/src/types.ts`
- Create: `brain-dashboard/src/api.ts`
- Create: `brain-dashboard/.env.local`

- [ ] **Step 1: Create types.ts**

Create `brain-dashboard/src/types.ts`:
```typescript
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  updated_at: string;
}

export interface Memory {
  id: number;
  content: string;
  category: string;
  importance: number;
  agent_name: string | null;
  created_at: string;
}

export interface AgentTask {
  id: number;
  title: string;
  status: string;
  priority: number;
  agent_name: string | null;
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  agent_type: string;
  last_seen: string | null;
}

export interface AgentState {
  agent_name: string;
  state: {
    status?: string;
    current_task?: string;
    previous_task?: string;
    next_task?: string;
  };
  updated_at: string;
}

export interface Session {
  id: number;
  agent_name: string;
  summary: string | null;
  created_at: string;
}

export interface CronJob {
  id: number;
  name: string;
  agent_name: string;
  schedule: string;
  last_run: string | null;
  last_status: string;
  last_error: string | null;
}

export interface Subagent {
  id: number;
  parent_agent: string;
  name: string;
  task: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
}

export interface BrainData {
  projects: Project[];
  memories: Memory[];
  tasks: AgentTask[];
  agents: Agent[];
  agentStates: AgentState[];
  sessions: Session[];
  cronJobs: CronJob[];
  subagents: Subagent[];
}
```

- [ ] **Step 2: Create api.ts**

Create `brain-dashboard/src/api.ts`:
```typescript
import type { Agent, AgentState, AgentTask, BrainData, CronJob, Memory, Project, Session, Subagent } from './types';

// In dev: call worker directly (VITE_BRAIN_URL + VITE_BRAIN_API_KEY from .env.local)
// In prod: call /api/* which Pages Function proxies to worker (no key in browser)
const isDev = import.meta.env.DEV;
const BASE = isDev ? import.meta.env.VITE_BRAIN_URL as string : '/api';

async function get<T>(path: string): Promise<T> {
  const headers: HeadersInit = isDev
    ? { 'Authorization': `Bearer ${import.meta.env.VITE_BRAIN_API_KEY as string}` }
    : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchBrainData(): Promise<BrainData> {
  const [
    { projects },
    { memories },
    { tasks },
    { agents },
    { states },
    { sessions },
    { cron_jobs },
    { subagents },
  ] = await Promise.all([
    get<{ projects: Project[] }>('/projects'),
    get<{ memories: Memory[] }>('/memories?limit=20'),
    get<{ tasks: AgentTask[] }>('/tasks'),
    get<{ agents: Agent[] }>('/agents'),
    get<{ states: AgentState[] }>('/agent-states'),
    get<{ sessions: Session[] }>('/sessions?limit=10'),
    get<{ cron_jobs: CronJob[] }>('/crons'),
    get<{ subagents: Subagent[] }>('/subagents'),
  ]);

  return { projects, memories, tasks, agents, agentStates: states, sessions, cronJobs: cron_jobs, subagents };
}
```

- [ ] **Step 3: Create .env.local for dev**

Create `brain-dashboard/.env.local`:
```
VITE_BRAIN_URL=https://brain-worker.YOUR_SUBDOMAIN.workers.dev
VITE_BRAIN_API_KEY=BRAIN_API_KEY_PLACEHOLDER
```

This file is gitignored. In production, the Pages Function handles auth.

---

## Task 8: Styles

**Files:**
- Create: `brain-dashboard/src/styles.ts`

- [ ] **Step 1: Create styles.ts**

Create `brain-dashboard/src/styles.ts`:
```typescript
import type { CSSProperties } from 'react';

const c = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#2a2a2a',
  text: '#e0e0e0',
  muted: '#888',
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
  blue: '#60a5fa',
  purple: '#a78bfa',
};

export const s = {
  root: { minHeight: '100vh', padding: '24px', maxWidth: '1100px', margin: '0 auto' } as CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' } as CSSProperties,
  title: { fontSize: '20px', fontWeight: 700, color: c.text, letterSpacing: '-0.5px' } as CSSProperties,
  meta: { display: 'flex', alignItems: 'center', gap: '12px', color: c.muted, fontSize: '13px' } as CSSProperties,
  refreshBtn: { background: c.surface, border: `1px solid ${c.border}`, color: c.text, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' } as CSSProperties,
  section: { marginBottom: '32px' } as CSSProperties,
  sectionTitle: { fontSize: '11px', fontWeight: 600, color: c.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '12px' } as CSSProperties,
  card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '16px' } as CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' } as CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: '8px' } as CSSProperties,
  dot: (color: string) => ({ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }) as CSSProperties,
  badge: (color: string) => ({ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: color + '22', color, fontWeight: 600 }) as CSSProperties,
  name: { fontSize: '14px', fontWeight: 600, color: c.text } as CSSProperties,
  sub: { fontSize: '12px', color: c.muted, marginTop: '2px' } as CSSProperties,
  tag: { fontSize: '11px', color: c.muted, background: c.border, padding: '2px 6px', borderRadius: '4px' } as CSSProperties,
  divider: { borderTop: `1px solid ${c.border}`, margin: '12px 0' } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const } as CSSProperties,
  th: { fontSize: '11px', color: c.muted, textAlign: 'left' as const, padding: '6px 8px', borderBottom: `1px solid ${c.border}` } as CSSProperties,
  td: { fontSize: '13px', color: c.text, padding: '8px', borderBottom: `1px solid ${c.border}` } as CSSProperties,
  empty: { color: c.muted, fontSize: '13px', fontStyle: 'italic' as const } as CSSProperties,
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888', fontSize: '14px' } as CSSProperties,
  colors: c,
};

export function statusColor(status: string): string {
  if (status === 'active' || status === 'ok' || status === 'running' || status === 'in_progress') return c.green;
  if (status === 'error') return c.red;
  if (status === 'idle' || status === 'unknown' || status === 'done') return c.muted;
  return c.muted;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
```

---

## Task 9: AgentCard Component

**Files:**
- Create: `brain-dashboard/src/components/AgentCard.tsx`

- [ ] **Step 1: Create AgentCard.tsx**

Create `brain-dashboard/src/components/AgentCard.tsx`:
```typescript
import type { Agent, AgentState, Subagent } from '../types';
import { s, statusColor, relativeTime } from '../styles';

interface Props {
  agent: Agent;
  state: AgentState | undefined;
  subagents: Subagent[];
}

export function AgentCard({ agent, state, subagents }: Props) {
  const agentStatus = state?.state?.status ?? 'idle';
  const color = statusColor(agentStatus);
  const currentTask = state?.state?.current_task;

  return (
    <div style={s.card}>
      <div style={s.row}>
        <div style={s.dot(color)} />
        <span style={s.name}>{agent.name}</span>
        <span style={{ ...s.badge(color), marginLeft: 'auto' }}>{agentStatus}</span>
      </div>
      {currentTask && (
        <div style={{ ...s.sub, marginTop: '8px' }}>{currentTask}</div>
      )}
      <div style={{ ...s.sub, marginTop: '4px' }}>
        Last seen: {relativeTime(agent.last_seen)}
      </div>
      {subagents.length > 0 && (
        <>
          <div style={s.divider} />
          {subagents.map((sa, i) => (
            <div key={i} style={{ ...s.row, marginBottom: '4px', paddingLeft: '8px' }}>
              <span style={{ color: s.colors.muted, fontSize: '12px' }}>└─</span>
              <span style={{ fontSize: '12px', color: s.colors.text }}>{sa.name}</span>
              {sa.task && (
                <span style={{ fontSize: '11px', color: s.colors.muted, marginLeft: '4px' }}>
                  {sa.task.length > 40 ? sa.task.slice(0, 40) + '…' : sa.task}
                </span>
              )}
              <div style={{ ...s.dot(statusColor(sa.status)), marginLeft: 'auto' }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

---

## Task 10: CronTable Component

**Files:**
- Create: `brain-dashboard/src/components/CronTable.tsx`

- [ ] **Step 1: Create CronTable.tsx**

Create `brain-dashboard/src/components/CronTable.tsx`:
```typescript
import type { CronJob } from '../types';
import { s, statusColor, relativeTime } from '../styles';

export function CronTable({ jobs }: { jobs: CronJob[] }) {
  if (jobs.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No cron jobs recorded yet.</div>;
  }

  return (
    <div style={s.card}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name</th>
            <th style={s.th}>Agent</th>
            <th style={s.th}>Schedule</th>
            <th style={s.th}>Last Run</th>
            <th style={s.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id}>
              <td style={s.td}>{job.name}</td>
              <td style={{ ...s.td, color: s.colors.muted }}>{job.agent_name}</td>
              <td style={{ ...s.td, color: s.colors.muted, fontFamily: 'monospace' }}>{job.schedule}</td>
              <td style={{ ...s.td, color: s.colors.muted }}>{relativeTime(job.last_run)}</td>
              <td style={s.td}>
                <span style={s.badge(statusColor(job.last_status))}>{job.last_status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Task 11: TaskList + ProjectGrid Components

**Files:**
- Create: `brain-dashboard/src/components/TaskList.tsx`
- Create: `brain-dashboard/src/components/ProjectGrid.tsx`

- [ ] **Step 1: Create TaskList.tsx**

Create `brain-dashboard/src/components/TaskList.tsx`:
```typescript
import type { AgentTask } from '../types';
import { s, statusColor } from '../styles';

export function TaskList({ tasks }: { tasks: AgentTask[] }) {
  const active = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  if (active.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No active tasks.</div>;
  }

  return (
    <div style={s.card}>
      {active.map((task, i) => (
        <div key={task.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <div style={s.dot(statusColor(task.status))} />
            <span style={s.name}>{task.title}</span>
            <span style={{ ...s.badge(statusColor(task.status)), marginLeft: 'auto' }}>{task.status}</span>
          </div>
          {task.agent_name && (
            <div style={{ ...s.sub, marginTop: '4px', paddingLeft: '16px' }}>
              {task.agent_name} · priority {task.priority}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ProjectGrid.tsx**

Create `brain-dashboard/src/components/ProjectGrid.tsx`:
```typescript
import type { Project } from '../types';
import { s, statusColor } from '../styles';

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const active = projects.filter(p => p.status !== 'archived');

  return (
    <div style={s.grid}>
      {active.map(p => (
        <div key={p.id} style={s.card}>
          <div style={s.row}>
            <div style={s.dot(statusColor(p.status))} />
            <span style={s.name}>{p.name}</span>
          </div>
          {p.description && (
            <div style={{ ...s.sub, marginTop: '8px', lineHeight: '1.4' }}>
              {p.description.length > 80 ? p.description.slice(0, 80) + '…' : p.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Task 12: MemoryFeed + SessionLog Components

**Files:**
- Create: `brain-dashboard/src/components/MemoryFeed.tsx`
- Create: `brain-dashboard/src/components/SessionLog.tsx`

- [ ] **Step 1: Create MemoryFeed.tsx**

Create `brain-dashboard/src/components/MemoryFeed.tsx`:
```typescript
import type { Memory } from '../types';
import { s } from '../styles';

const categoryColor: Record<string, string> = {
  person: '#a78bfa',
  decision: '#60a5fa',
  fact: '#4ade80',
  project: '#facc15',
  general: '#888',
};

export function MemoryFeed({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No memories saved yet.</div>;
  }

  return (
    <div style={s.card}>
      {memories.map((m, i) => (
        <div key={m.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <span style={s.badge(categoryColor[m.category] ?? '#888')}>{m.category}</span>
            <span style={{ ...s.tag, marginLeft: 'auto' }}>importance {m.importance}</span>
          </div>
          <div style={{ ...s.sub, marginTop: '6px', color: s.colors.text, lineHeight: '1.5' }}>
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create SessionLog.tsx**

Create `brain-dashboard/src/components/SessionLog.tsx`:
```typescript
import type { Session } from '../types';
import { s, relativeTime } from '../styles';

export function SessionLog({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <div style={{ ...s.card, ...s.empty }}>No sessions recorded yet.</div>;
  }

  return (
    <div style={s.card}>
      {sessions.map((session, i) => (
        <div key={session.id}>
          {i > 0 && <div style={s.divider} />}
          <div style={s.row}>
            <span style={s.name}>{session.agent_name}</span>
            <span style={{ ...s.sub, marginLeft: 'auto' }}>{relativeTime(session.created_at)}</span>
          </div>
          {session.summary && (
            <div style={{ ...s.sub, marginTop: '4px', lineHeight: '1.4' }}>{session.summary}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Task 13: App.tsx

**Files:**
- Create: `brain-dashboard/src/App.tsx`

- [ ] **Step 1: Create App.tsx**

Create `brain-dashboard/src/App.tsx`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { fetchBrainData } from './api';
import type { BrainData } from './types';
import { AgentCard } from './components/AgentCard';
import { CronTable } from './components/CronTable';
import { TaskList } from './components/TaskList';
import { ProjectGrid } from './components/ProjectGrid';
import { MemoryFeed } from './components/MemoryFeed';
import { SessionLog } from './components/SessionLog';
import { s, relativeTime } from './styles';

export default function App() {
  const [data, setData] = useState<BrainData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchBrainData();
      setData(d);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data && !error) {
    return <div style={s.loading}>Loading brain…</div>;
  }

  if (error && !data) {
    return <div style={{ ...s.loading, color: '#f87171' }}>Error: {error}</div>;
  }

  const d = data!;

  return (
    <div style={s.root}>
      <header style={s.header}>
        <h1 style={s.title}>brain</h1>
        <div style={s.meta}>
          {lastUpdated && <span>Updated {relativeTime(lastUpdated.toISOString())}</span>}
          {loading && <span>↻</span>}
          <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
        </div>
      </header>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Agents</h2>
        {d.agents.length === 0
          ? <div style={{ color: s.colors.muted, fontSize: '13px', fontStyle: 'italic' }}>No agents have connected yet.</div>
          : <div style={s.grid}>
              {d.agents.map(agent => (
                <AgentCard
                  key={agent.name}
                  agent={agent}
                  state={d.agentStates.find(st => st.agent_name === agent.name)}
                  subagents={d.subagents.filter(sa => sa.parent_agent === agent.name && sa.status === 'running')}
                />
              ))}
            </div>
        }
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Cron Jobs</h2>
        <CronTable jobs={d.cronJobs} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Active Tasks</h2>
        <TaskList tasks={d.tasks} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Projects</h2>
        <ProjectGrid projects={d.projects} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Recent Memories</h2>
        <MemoryFeed memories={d.memories} />
      </section>

      <section style={s.section}>
        <h2 style={s.sectionTitle}>Recent Sessions</h2>
        <SessionLog sessions={d.sessions} />
      </section>
    </div>
  );
}
```

---

## Task 14: Local Smoke Test

- [ ] **Step 1: Run dev server**

```bash
cd ~//Documents/Claude/LifeOS/brain-dashboard
npm run dev
```

Expected output:
```
  VITE v6.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

- [ ] **Step 2: Open in browser**

Open http://localhost:5173 in browser. You should see:
- "brain" header with refresh button
- Agents section (may be empty or show claude-mac)
- Projects section with Zaasu, Anchor, KPS/Mart, Health, Dhiya
- Memories section with the 8 seeded memories

- [ ] **Step 3: Check browser console for errors**

Open DevTools → Console. There should be no red errors. If you see a CORS error, check that `VITE_BRAIN_URL` in `.env.local` matches exactly `https://brain-worker.YOUR_SUBDOMAIN.workers.dev`.

- [ ] **Step 4: Stop dev server and commit**

```bash
# Ctrl+C to stop dev server

cd ~//Documents/Claude/LifeOS
git add brain-dashboard/
git commit -m "feat: brain dashboard — Vite React app with Pages Function proxy"
git push
```

---

## Task 15: Deploy to Cloudflare Pages

- [ ] **Step 1: Create Cloudflare Pages project via wrangler**

```bash
cd ~//Documents/Claude/LifeOS/brain-dashboard
npm run build
npx wrangler pages project create brain-dashboard
```

When prompted for "Production branch name": enter `main`.

- [ ] **Step 2: Deploy**

```bash
npx wrangler pages deploy dist --project-name brain-dashboard
```

Expected: a `*.pages.dev` URL is printed. Open it to verify the dashboard loads.

- [ ] **Step 3: Set environment variables in Cloudflare Pages dashboard**

Go to dash.cloudflare.com → Workers & Pages → brain-dashboard → Settings → Environment variables.

Add (for Production):
- `BRAIN_API_KEY` = `BRAIN_API_KEY_PLACEHOLDER`
- `BRAIN_WORKER_URL` = `https://brain-worker.YOUR_SUBDOMAIN.workers.dev`

Click Save. Then redeploy:
```bash
npx wrangler pages deploy dist --project-name brain-dashboard
```

- [ ] **Step 4: Connect GitHub for auto-deploy**

In Cloudflare Pages dashboard → brain-dashboard → Settings → Build & Deploy → Connect to Git.
Select `mpbharat/brain` repo. Set:
- Root directory: `brain-dashboard`
- Build command: `npm run build`
- Build output directory: `dist`

Save. From now on, every push to `main` auto-deploys.

- [ ] **Step 5: Add custom domain brain.YOUR_DOMAIN.com**

In Cloudflare Pages → brain-dashboard → Custom domains → Add.
Enter `brain.YOUR_DOMAIN.com`. Cloudflare creates the DNS record automatically since YOUR_DOMAIN.com is already on Cloudflare.

Wait ~1 minute, then open https://brain.YOUR_DOMAIN.com. The dashboard should load.

---

## Task 16: Update brain-sync Skills

**Files:**
- Modify: `skills/claude-code/brain-sync.md`
- Modify: `skills/hermes/brain-sync.md`

- [ ] **Step 1: Update skills/claude-code/brain-sync.md**

Replace the full file content with:

```markdown
---
name: brain-sync
description: Gives Claude persistent memory across all sessions and machines via brain.YOUR_DOMAIN.com. Loaded automatically at session start.
---

# Brain Sync

You have a persistent brain at brain.YOUR_DOMAIN.com. The <brain-context> block injected at session start contains your current projects, recent memories, active tasks, cron jobs, and active sub-agents.

## At Session Start

Read the <brain-context> block carefully. Pick up exactly where you left off. Don't ask the user to re-explain context that's already in the brain.

Report the session start as a cron job:
```bash
curl -s -X POST "$BRAIN_URL/cron" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"session-start\",\"agent_name\":\"$BRAIN_AGENT_NAME\",\"schedule\":\"@session\",\"last_status\":\"ok\"}"
```

## During a Session

### Save a memory
```bash
curl -s -X POST "$BRAIN_URL/memory" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"<lesson>","category":"decision","importance":8}'
```

### Create a task
```bash
curl -s -X POST "$BRAIN_URL/task" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"<task>","project":"<project>","status":"active"}'
```

### Report a sub-agent dispatched
```bash
curl -s -X POST "$BRAIN_URL/subagent" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"parent_agent\":\"$BRAIN_AGENT_NAME\",\"name\":\"<agent-type>\",\"task\":\"<what it's doing>\",\"status\":\"running\"}"
```

### Report a sub-agent completed
```bash
curl -s -X POST "$BRAIN_URL/subagent" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"parent_agent\":\"$BRAIN_AGENT_NAME\",\"name\":\"<agent-type>\",\"task\":\"<what it did>\",\"status\":\"done\"}"
```

## At Session End

When the user wraps up, run brain-cli save:
```bash
node ~//Documents/Claude/LifeOS/brain-cli/dist/index.js save \
  --summary "One sentence: what was done" \
  --memory "Key lesson 1" \
  --next "What to do next session"
```

## Memory Guidelines

**Save:** Non-obvious decisions, bug patterns, architectural choices, gotchas, project status changes  
**Skip:** Things already in code/docs, routine completions, info that'll be stale in a week
```

- [ ] **Step 2: Update skills/hermes/brain-sync.md**

Replace the full file content with:

```markdown
---
name: brain-sync
description: Connects Hermes to the shared brain at brain.YOUR_DOMAIN.com for persistent memory across all agents and machines.
---

# Brain Sync for Hermes

## Session Start

On activation, call GET /context to load current state as resident memory:

```bash
curl -s "$BRAIN_URL/context" \
  -H "Authorization: Bearer $BRAIN_API_KEY"
```

Then report session start:
```bash
curl -s -X POST "$BRAIN_URL/cron" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"session-start\",\"agent_name\":\"$BRAIN_AGENT_NAME\",\"schedule\":\"@session\",\"last_status\":\"ok\"}"
```

Set env vars:
```bash
export BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER"
export BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev"
export BRAIN_AGENT_NAME="hermes-mac"   # or hermes-ubuntu
```

## API Reference

All requests: `Authorization: Bearer $BRAIN_API_KEY`

| Action | Request |
|---|---|
| Get context | `GET /context` |
| Save memory | `POST /memory` `{"content":"...","category":"decision","importance":8}` |
| Create task | `POST /task` `{"title":"...","project":"...","status":"active"}` |
| Update task | `PUT /task/:id` `{"status":"done"}` |
| Log session | `POST /session` `{"agent_name":"hermes-mac","summary":"...","duration_minutes":60}` |
| Report cron | `POST /cron` `{"name":"...","agent_name":"hermes-mac","schedule":"@session","last_status":"ok"}` |
| Report subagent | `POST /subagent` `{"parent_agent":"hermes-mac","name":"...","task":"...","status":"running"}` |

## Session End

```bash
curl -s -X POST "$BRAIN_URL/session" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$BRAIN_AGENT_NAME\",\"summary\":\"What was done\",\"duration_minutes\":60}"
```
```

- [ ] **Step 3: Commit and push**

```bash
cd ~//Documents/Claude/LifeOS
git add skills/claude-code/brain-sync.md skills/hermes/brain-sync.md
git commit -m "feat: add cron + subagent reporting to brain-sync skills"
git push
```

Also copy the updated skill to the installed location:
```bash
cp skills/claude-code/brain-sync.md ~/.claude/skills/brain-sync/SKILL.md
```

---

## Self-Review

**Spec coverage check:**
- ✅ Vite React + Cloudflare Pages — Task 5
- ✅ Pages Function proxy (API key server-side) — Task 6
- ✅ cron_jobs + subagents DB tables — Task 1
- ✅ POST /cron, GET /crons, POST /subagent, GET /subagents — Task 3
- ✅ GET /agents, GET /agent-states — Task 2
- ✅ /context updated with crons + subagents — Task 4
- ✅ AgentCard with nested sub-agents — Task 9
- ✅ CronTable — Task 10
- ✅ TaskList, ProjectGrid, MemoryFeed, SessionLog — Tasks 11, 12
- ✅ Auto-refresh every 60s — Task 13 (App.tsx setInterval)
- ✅ brain.YOUR_DOMAIN.com custom domain — Task 15 Step 5
- ✅ brain-sync skills updated — Task 16
- ✅ GitHub auto-deploy — Task 15 Step 4

**Placeholder scan:** None found.

**Type consistency:** All types defined in `types.ts` Task 7 Step 1. API client returns the same types. All components accept the same types. `BrainData.agentStates` uses `AgentState[]` — matched in `api.ts` (maps `states` key to `agentStates`) and `App.tsx` (`d.agentStates.find(...)`).
