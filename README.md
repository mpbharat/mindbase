# LifeOS Brain

Persistent memory and context system for Bharat's AI agents (Claude Code, Hermes) across all machines.

**Live dashboard:** https://brain.YOUR_DOMAIN.com  
**API:** https://brain-worker.YOUR_SUBDOMAIN.workers.dev

---

## What It Does

Claude Code and Hermes forget everything between sessions. This system gives them persistent memory that works across sessions, machines, and agents.

**At session start** — Claude loads a lightweight overview: your project tree and urgent backlog. No noise, no stale dumps.

**Mid-session** — When you ask about a project, Claude fetches its full context on-demand: memories, past sessions, tasks, backlog. You never need to re-explain what happened.

**At session end** — Close-session protocol saves memories and backlog items tagged to the right project. Next session picks up exactly where you left off.

---

## Architecture

```
brain-worker/          Cloudflare Worker — REST API over Neon Postgres
brain-cli/             Node.js CLI — session hooks (context, fetch, save)
brain-dashboard/       React dashboard — browsable at brain.YOUR_DOMAIN.com
skills/claude-code/    Claude Code skill files (brain-sync, close-session)
```

**Database:** Neon Postgres (via Cloudflare Worker). Tables: `projects`, `memories`, `sessions`, `agent_tasks`, `backlog_items`, `agents`, `agent_states`, `cron_jobs`, `subagents`.

**Agents:** `claude-mac`, `claude-ubuntu`, `hermes-ubuntu` — each tracked separately.

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

All memories, sessions, and tasks link to a project via `project_id`. Fetch any branch of the tree on-demand.

---

## How Sessions Work

### Session start (automatic)
The SessionStart hook in `~/.claude/settings.json` runs brain-cli and injects a `<brain-overview>` block into Claude's context:
- Full project tree (with IDs)
- Urgent backlog items (priority ≥ 8)
- 5 most recent sessions

Claude reads this and knows where things stand without being told.

### Mid-session: fetching project context
When working on or asking about a specific project, Claude runs:
```bash
brain-cli fetch "zaasu"          # full Zaasu memories + sessions + backlog
brain-cli fetch "mart pim"       # Mart PIM SaaS context
brain-cli fetch "data extraction" # specific sub-project context
```

### Session end: close-session protocol (6 steps)
Triggered when you say "close session", "save and close", "wrap up":
1. Synthesize — summary, decisions, next steps, backlog items
2. Save memories — curl POST /memory with project_id
3. Save backlog — curl POST /backlog with tags
4. brain-cli save — session summary + next
5. Log session — curl POST /session
6. Respond — "Saved. Session closed."

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

# Or specify explicitly:
bash setup.sh mac
bash setup.sh ubuntu
```

The setup script does:
1. Builds brain-cli (`npm install && npm run build`)
2. Symlinks skills from the repo into `~/.claude/skills/` — so `git pull` updates them automatically
3. Installs the SessionStart hook into `~/.claude/settings.json`
4. Copies the machine-specific close-session skill

### If settings.json already exists
The script will warn and print the hook command. Add it manually to `~/.claude/settings.json`:

**Mac:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "BRAIN_API_KEY=\"BRAIN_API_KEY_PLACEHOLDER\" BRAIN_URL=\"https://brain-worker.YOUR_SUBDOMAIN.workers.dev\" BRAIN_AGENT_NAME=\"claude-mac:$(basename $PWD)\" node ~//Documents/Claude/LifeOS/brain-cli/dist/index.js context"
          }
        ]
      }
    ]
  }
}
```

**Ubuntu:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "BRAIN_API_KEY=\"BRAIN_API_KEY_PLACEHOLDER\" BRAIN_URL=\"https://brain-worker.YOUR_SUBDOMAIN.workers.dev\" BRAIN_AGENT_NAME=\"claude-ubuntu:$(basename $PWD)\" node /home/YOUR_USERNAME/Documents/Claude/LifeOS/brain-cli/dist/index.js context"
          }
        ]
      }
    ]
  }
}
```

### After setup
Start a new Claude Code session. You'll see `<brain-overview>` injected automatically. Done.

### What works without any plugins
- Brain overview at session start (hook-driven, always runs)
- Close-session protocol (baked into CLAUDE.md Section 9)
- Mid-session project fetch (baked into CLAUDE.md Section 8 — Claude follows it automatically)

### What requires the superpowers plugin
The `using-superpowers` skill enforces that Claude checks all available skills before responding. Without it, Claude still follows CLAUDE.md but won't proactively invoke skill files. Install superpowers if you want skill-level enforcement on top of CLAUDE.md.

---

## Updating Other Machines

When you make changes here (new skills, brain-cli updates, protocol changes), propagate to other machines with one command:

```bash
bash update.sh
```

This does:
1. `git pull origin main`
2. Rebuilds brain-cli
3. Skills update automatically (they're symlinked from the repo)

**On Ubuntu (from Mac):** SSH in and run:
```bash
cd ~/Documents/Claude/LifeOS && bash update.sh
```

Or just let the Ubuntu agent do it at the start of the next Ubuntu session.

---

## Key API Endpoints

| Endpoint | What it does |
|---|---|
| `GET /context/overview` | Session-start overview (projects + urgent backlog) |
| `GET /context/project?name=X` | Full on-demand context for a project |
| `POST /memory` | Save a memory (include `project_id`) |
| `PATCH /memory/:id` | Update project_id or importance on existing memory |
| `POST /backlog` | Add a backlog item |
| `PATCH /backlog/:id` | Update backlog status (active/done) |
| `GET /backlog` | List all backlog items with IDs |
| `POST /session` | Log a session |
| `GET /project/:id` | Full project data (used by dashboard) |

All requests require: `Authorization: Bearer <BRAIN_API_KEY>`

---

## Project IDs (for project_id field)

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
setup.sh                    First-time setup on a new machine
update.sh                   Pull latest + rebuild on any machine
ubuntu-close-session-skill.md  Close-session skill for Ubuntu (copy to ~/.claude/skills/close-session/SKILL.md)
brain-cli/src/
  context.ts                Fetches /context/overview at session start
  fetch.ts                  Fetches /context/project?name=X on demand
  save.ts                   Saves session summary on close
brain-worker/src/index.ts   Full Cloudflare Worker API
skills/claude-code/
  brain-sync/               How Claude uses the brain mid-session
  close-session/            6-step close-session protocol
```
