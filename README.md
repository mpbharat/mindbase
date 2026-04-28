# LifeOS Brain

Persistent memory and context system for Bharat's AI agents (Claude Code, Hermes) across all machines.

**Live dashboard:** https://brain.YOUR_DOMAIN.com  
**API:** https://brain-worker.YOUR_SUBDOMAIN.workers.dev

---

## The Goal

Most people building with AI are working at the **robotic arm level** — a single agent, excellent at tasks, maybe with local memory. That's genuinely powerful. But one arm doesn't know what the other arms in the factory are doing.

When you're dribbling a basketball, one arm doing an excellent job alone isn't enough. The arms need to talk to each other, to the legs, to the eyes. You don't want the intelligence sitting inside the arm — you want it at the brain level, coordinating everything.

That's what this is. Memory at the brain level, not the agent level.

Brain solves three problems:

**1. Memory across sessions** — Claude forgets everything when a session ends. Brain stores memories, decisions, and session summaries permanently and injects them back at the start of every new session.

**2. Coordination across agents** — 4+ Claude sessions can run simultaneously (mac + ubuntu, different projects). Brain lets them share context without talking to each other — one session saves, another picks it up.

**3. Intentionality** — Brain enforces a PM-style session lifecycle: check priorities before starting, course-correct mid-session, capture the "why" at close. So you work on the right things and know why you built them.

---

## Architecture

```
brain-worker/          Cloudflare Worker — REST API over Neon Postgres
brain-cli/             Node.js CLI — session hooks (context, fetch, save)
brain-dashboard/       React dashboard — project-first view of everything
skills/claude-code/    Claude Code skill files (brain-sync, close-session)
```

**Database:** Neon Postgres (via Cloudflare Worker). Tables: `projects`, `memories`, `sessions`, `agent_tasks`, `backlog_items`, `agents`, `agent_states`, `cron_jobs`, `subagents`.

**Agents:** `claude-mac`, `claude-ubuntu`, `hermes-ubuntu` — each tracked separately with live state.

---

## Project Hierarchy

```
Dhis · LinkedIn · EvolveViaAI
LifeOS
Personal → Health, Dhiya
KPS / Mart → Mart PIM SaaS → Data Extraction, Lead Research, Outreach
Zaasu
Anchor
```

All memories, sessions, tasks, and backlog items link to a project via `project_id`. Fetch any branch of the tree on-demand.

---

## Session Lifecycle

Brain enforces a 3-phase session lifecycle designed for a PM working with AI agents:

### Phase 1 — Session Open (prioritization check)

When you say what you want to work on, Claude does not start immediately. It:

1. Fetches the project context from brain (latest memories, pending tasks, backlog)
2. Asks two things: "What's the outcome you want?" and surfaces anything more urgent from the backlog
3. Flags rabbit hole risk upfront if the task could spiral ("This could go deep — want to timebox it?")
4. Writes `agent_state: { status: working, current_task: "..." }` — visible on the dashboard

This ensures every session starts intentionally, not just reactively.

### Phase 2 — Mid-Session (compaction sync)

When conversation compaction happens (context limit), Claude:

**Push:**
- Saves key decisions as memories in why-format: `"what — why: problem solved — not X because tradeoff"`
- Updates agent state with current progress

**Pull:**
- Fetches latest project context from brain (other agents may have added memories/tasks)

**Direction check:**
- Asks: "We set out to [original goal]. So far we've done [what happened]. Still the right direction?"
- Flags explicitly if we've drifted, gone 3 layers deep into something that wasn't the goal, or are in a rabbit hole
- User confirms or redirects before work continues

This is the most important phase — it's where sessions drift without anyone noticing.

### Phase 3 — Session Close

Triggered by "close session", "save and close", "wrap up":

1. **Synthesize** — one-sentence summary, non-obvious decisions, next steps
2. **Save memories** — why-format: `"what — why: problem it solved — not alternative because tradeoff"`. Only things that would take >10 min to reconstruct.
3. **Save tasks** — 1-3 concrete next actions as `agent_tasks` with `pending` status
4. **Save backlog** — broader future ideas with tags
5. **brain-cli save** — session summary + next session intent
6. **Log session** — POST /session with project_id
7. **Update agent state** — `{ status: idle, next_task: "..." }` — visible on dashboard

---

## Dashboard

Project-first layout at `brain.YOUR_DOMAIN.com`:

- **Main view** — each project is a card showing memory count, task count, last session agent + summary, sub-projects
- **Project detail** — 4 widgets: Backlog (with priority + status), Tasks, Memories, Agents & Cron Jobs
- **System card** — unlinked agents, cron jobs, unlinked memory/task counts
- **Sessions panel** — Today / This Week / This Month switcher, all sessions across projects grouped by day
- **Live agent states** — each agent card shows current status and what it's working on

---

## Auto-Sync Across Machines

Every machine runs a cron that pulls the latest LifeOS repo every 30 minutes:

```
*/30 * * * * cd ~/Documents/Claude/LifeOS && git pull --ff-only origin main --quiet && npm --prefix brain-cli install --silent && npm --prefix brain-cli run build --silent
```

**Workflow:** Push changes from mac → all agents sync within 30 min automatically. No manual SSH, no chasing machines.

Covers: CLAUDE.md protocol updates, new skills, brain-cli changes, any session lifecycle changes.

---

## Setup on a New Machine

### Prerequisites
- Node.js 18+
- Git
- Claude Code CLI installed

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/mpbharat/brain.git ~/Documents/Claude/LifeOS
cd ~/Documents/Claude/LifeOS

# 2. Run setup (detects mac vs linux automatically)
bash setup.sh

# Or specify:
bash setup.sh mac
bash setup.sh ubuntu
```

Setup script does:
1. Builds brain-cli (`npm install && npm run build`)
2. Symlinks skills into `~/.claude/skills/` — auto-updates on `git pull`
3. Installs SessionStart hook into `~/.claude/settings.json`
4. Sets up the 30-min auto-sync cron

### If settings.json already exists
Add the hook manually:

**Mac:**
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "BRAIN_API_KEY=\"BRAIN_API_KEY_PLACEHOLDER\" BRAIN_URL=\"https://brain-worker.YOUR_SUBDOMAIN.workers.dev\" BRAIN_AGENT_NAME=\"claude-mac:$(basename $PWD)\" node ~//Documents/Claude/LifeOS/brain-cli/dist/index.js context"
      }]
    }]
  }
}
```

**Ubuntu:**
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "BRAIN_API_KEY=\"BRAIN_API_KEY_PLACEHOLDER\" BRAIN_URL=\"https://brain-worker.YOUR_SUBDOMAIN.workers.dev\" BRAIN_AGENT_NAME=\"claude-ubuntu:$(basename $PWD)\" node /home/YOUR_USERNAME/Documents/Claude/LifeOS/brain-cli/dist/index.js context"
      }]
    }]
  }
}
```

---

## Key API Endpoints

| Endpoint | What it does |
|---|---|
| `GET /context/overview` | Session-start overview (projects + urgent backlog) |
| `GET /context/project?name=X` | Full on-demand context for a project |
| `POST /memory` | Save a memory (include `project_id`) |
| `PATCH /memory/:id` | Update project_id or importance on existing memory |
| `POST /task` | Save a concrete next-step task |
| `PUT /task/:id` | Update task status (pending → completed) |
| `POST /backlog` | Add a backlog item |
| `PATCH /backlog/:id` | Update backlog status (active/done) |
| `GET /backlog` | List all backlog items with IDs |
| `POST /session` | Log a session (include `project_id`) |
| `POST /agent-state` | Update agent status + current_task |
| `GET /projects/summary` | Dashboard overview — all projects enriched |
| `GET /project/:id` | Full project data (backlog, tasks, memories, agents) |
| `GET /sessions?days=7` | Sessions filtered by time period |

All requests require: `Authorization: Bearer <BRAIN_API_KEY>`

---

## Project IDs

| Project | ID | Project | ID |
|---|---|---|---|
| Zaasu | 2 | KPS / Mart | 3 |
| Anchor | 1 | Mart PIM SaaS | 7 |
| Personal | 6 | Health | 4 |
| LifeOS | 8 | Dhiya | 5 |
| EvolveViaAI | 9 | LinkedIn | 10 |
| Dhis | 11 | Data Extraction | 12 |
| Lead Research | 13 | Outreach | 14 |

---

## Agent Names

| Machine | Agent name format |
|---|---|
| Mac | `claude-mac:<ProjectLabel>` |
| Ubuntu (Claude Code) | `claude-ubuntu:<ProjectLabel>` |
| Ubuntu (Hermes) | `hermes-ubuntu:<ProjectLabel>` |

`<ProjectLabel>` is typically `$(basename $PWD)` — the working directory name.

---

## Files

```
setup.sh                       First-time setup on a new machine
update.sh                      Pull latest + rebuild on any machine
ubuntu-close-session-skill.md  Close-session skill for Ubuntu
brain-cli/src/
  context.ts                   Fetches /context/overview at session start
  fetch.ts                     Fetches /context/project?name=X on demand
  save.ts                      Saves session summary on close
brain-worker/src/index.ts      Full Cloudflare Worker API
skills/claude-code/
  brain-sync/                  Mid-session sync protocol (bi-directional)
  close-session/               Close-session protocol (why-format memories + tasks)
```
