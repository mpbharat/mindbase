# Brain

Persistent memory OS for Claude. Cross-session, cross-machine, cross-agent.

---

## The Problem

Most people building with AI work at the **robotic arm level** — one agent, excellent at tasks, maybe with local memory. But one arm doesn't know what the other arms are doing.

Brain sits above the arms. It's a cloud-hosted memory layer that all your Claude agents — across machines, across sessions — read from and write to. When Claude on your Mac finishes a session, Claude on your server picks up exactly where it left off.

Memory at the brain level, not the arm level.

**Three things Brain solves:**

1. **Memory across sessions** — Claude forgets everything when a session ends. Brain stores memories, decisions, and summaries and injects them back at the start of every new session.

2. **Coordination across agents** — Multiple Claude sessions running simultaneously (different machines, different projects) share context without talking to each other. One saves, another picks it up.

3. **Intentionality** — Brain enforces a PM-style session lifecycle: check priorities before starting, course-correct mid-session, capture the "why" at close.

---

## Install

### First machine (full setup ~15 minutes)

```bash
npx mindbase-install
```

Claude Code walks you through everything:
- Cloudflare Worker + R2 bucket deployment
- Neon PostgreSQL database setup
- All secrets and migrations
- Auto-discovery and mapping of your existing projects
- mind-cli build and shell configuration
- mind-sync skill written into your `~/.claude/CLAUDE.md` automatically
- Dashboard deployed to Cloudflare Pages

You just answer a few questions. Claude does the rest.

**Prerequisites:** Claude Code CLI, Node.js 18+, a Cloudflare account (free), a Neon account (free).

### Second machine (30 seconds)

```bash
npx mindbase-join
```

Claude asks for your `MIND_URL` and `MIND_API_KEY` from the first install. No infra to deploy. Same brain, new machine.

---

## How It Works

```
mind-worker/        Cloudflare Worker — REST API, Neon Postgres, R2
mind-cli/           Node.js CLI — session hooks (context, fetch, save)
mind-dashboard/     React dashboard — project-first view of everything
bin/                 npx entry points (mindbase-install, mindbase-join)
skills/              Claude skill files (mindbase-install, mind-sync)
```

**Backend:** Cloudflare Workers (API) + R2 (file storage) + Workers AI (embeddings + classification) + Neon Postgres (data). Everything on Cloudflare's free tier.

**Session lifecycle:** Every Claude session opens by fetching project context. Every session closes by saving memories, tasks, and a summary. mind-sync is written into `~/.claude/CLAUDE.md` during install — Claude does this automatically without being asked.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your Machines                       │
│  Claude (mac) ──┐                                       │
│  Claude (linux) ├──► mind-cli ──► Cloudflare Worker   │
│  Claude (server)┘                       │               │
└─────────────────────────────────────────┼───────────────┘
                                          ▼
                                   Neon Postgres
                                   (memories, sessions,
                                    tasks, projects)
                                          │
                                   Cloudflare R2
                                   (Drive + Artifacts)
```

---

## Dashboard

Deployed to Cloudflare Pages during install. Shows:

- **Projects** — hierarchical, with memory count, task count, last session snippet
- **Backlog** — epics and issues with priority, status, inline creation
- **Tasks** — pending and completed agent tasks per project  
- **Memories** — searchable, tagged by category and importance
- **Drive** — user-uploaded source files
- **Artifacts** — AI-generated documents (auto-classified by Haiku on upload)
- **Activity** — sessions, live agent states, cron jobs
- **Overview** — stats, live agents, recent sessions across all projects

---

## Session Lifecycle

Brain enforces a 3-phase lifecycle:

**Open** — Claude fetches project context, asks what the outcome should be, flags anything more urgent in the backlog, writes `agent_state: working`.

**Mid-session** — On context compaction, Claude pushes progress to Brain and pulls any updates from other agents. Direction check: still on track?

**Close** — User says "close session". Claude saves memories (why-format: `"what — why: reason — not alternative because tradeoff"`), tasks, session summary, sets agent idle. One reply: "Saved. Session closed."

---

## Key API Endpoints

| Endpoint | What it does |
|---|---|
| `GET /context/overview` | Session-start overview |
| `GET /context/project?name=X` | Full project context on demand |
| `POST /memory` | Save a memory |
| `POST /task` | Save a task |
| `POST /backlog` | Add a backlog item |
| `POST /session` | Log a session |
| `POST /agent-state` | Update live agent status |
| `GET /project/:id` | Full project data |
| `POST /artifact` | Save artifact metadata |
| `POST /artifacts/classify` | Reclassify existing artifacts with Haiku |

All requests: `Authorization: Bearer <MIND_API_KEY>`

---

## Self-Hosting

Brain is designed for Cloudflare but the worker is a standard fetch handler — it runs anywhere that supports the [WinterCG](https://wintercg.org/) runtime. R2 can be swapped for any S3-compatible store by changing the binding.

See `mind-worker/wrangler.toml.example` for the full configuration reference.

---

## License

MIT
