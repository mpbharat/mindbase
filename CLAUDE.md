# Mindbase — Contributor Guide for Claude

## What this project is

Mindbase is a persistent memory OS for Claude. It gives Claude agents shared memory across sessions, machines, and instances via a self-hosted Cloudflare Worker + Neon database.

## Repo structure

```
mindbase/
├── bin/                    # npx entry points (mindbase-install, mindbase-join)
├── db/
│   └── schema.sql          # Full Postgres schema — run once in Neon
├── docs/                   # Setup guides for Mac, Ubuntu, Claude Desktop
├── hooks/                  # Claude Code settings.json hook example
├── mind-cli/               # Node.js CLI: context, fetch, save commands
│   └── src/
│       ├── context.ts      # Session-start context fetch
│       ├── fetch.ts        # On-demand project context fetch
│       └── save.ts         # Session-close save (summary + next)
├── mind-dashboard/         # React + Vite dashboard (Cloudflare Pages)
│   ├── functions/api/      # Pages Function proxying requests to the Worker
│   └── src/                # Dashboard UI components
├── mind-worker/            # Cloudflare Worker — the core API
│   └── src/index.ts        # All endpoints: memory, tasks, sessions, agents
├── skills/                 # Claude Code skill files (installed into ~/.claude/)
│   ├── claude-code/
│   │   ├── brain-sync.md       # Session lifecycle skill
│   │   ├── close-session/      # Mac close-session skill
│   │   └── close-session-mac/  # Mac variant
│   ├── hermes/                 # Hermes agent variant
│   └── mindbase-install.md     # Install skill (used by npx mindbase-install)
└── setup.sh                # Shell setup script for new machines
```

## Key patterns

**Worker auth:** All requests require `Authorization: Bearer <MIND_API_KEY>`. The key is set as a Worker secret via `wrangler secret put MIND_API_KEY`.

**Env vars used in Worker (`mind-worker/src/index.ts`):**
- `MIND_API_KEY` — bearer token for all API requests
- `BRAIN_AI` — Workers AI binding (for embeddings)
- `BRAIN_DRIVE` — R2 bucket binding (for file storage)
- `DATABASE_URL` — Neon Postgres connection string

**Dashboard proxy:** The dashboard never calls the Worker directly. All API calls go through `mind-dashboard/functions/api/[[path]].ts` which forwards them to the Worker with auth headers.

**mind-cli:** Built from TypeScript in `mind-cli/src/`. Must run `npm run build` after any changes. Reads `MIND_API_KEY`, `MIND_URL`, and `MIND_AGENT_NAME` from env.

## Common commands

```bash
# Build mind-cli after changes
cd mind-cli && npm run build

# Deploy the Worker
cd mind-worker && npx wrangler deploy

# Deploy the dashboard
cd mind-dashboard && npm run build && npx wrangler pages deploy dist --project-name=mind-dashboard

# Run schema migrations
# Paste db/schema.sql into Neon SQL Editor
```

## What not to do

- Do not hardcode API keys, account IDs, or personal URLs anywhere in source files
- Do not commit wrangler.toml files that contain real secrets or account IDs — use wrangler.toml.example as the template
- The `reference/` folder and personal skill files are gitignored — do not add personal data to tracked files
