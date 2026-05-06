# Mind Install Skill

You are performing a complete, end-to-end Brain installation. Brain is a personal memory OS — persistent context across every Claude session, every machine, every agent.

**Announce at start:** "I'm using the mindbase-install skill. I'll handle everything — Cloudflare setup, database, CLI, project mapping, dashboard, and wiring myself to sync automatically. You just answer a few questions."

**Rigid skill — follow every step exactly. Do not skip, reorder, or summarise steps.**

---

## What You Will Build

By the end of this install:
- A Cloudflare Worker running the Brain API
- A Neon PostgreSQL database storing memories, sessions, tasks, projects, artifacts
- A Cloudflare R2 bucket storing files (Mind Drive)
- mind-cli installed locally so Claude can read/write brain from any project
- Brain-sync wired into this machine's CLAUDE.md — Claude will automatically open and close sessions
- All existing projects on this machine discovered and mapped into Brain
- The Brain dashboard deployed to Cloudflare Pages and accessible in a browser

---

## Phase 1 — Prerequisites

Check what's installed:

```bash
node --version
npx wrangler --version
git --version
```

If Node missing: tell user to install from nodejs.org (need 18+).
If wrangler missing: `npm install -g wrangler`

Login to Cloudflare:
```bash
npx wrangler login
```

This opens a browser. Wait for confirmation. Then verify:
```bash
npx wrangler whoami
```

Note the account ID shown — you'll need it shortly.

---

## Phase 2 — Clone Brain

```bash
git clone https://github.com/mpbharat/mindbase.git ~/brain
cd ~/brain
npm install
cd mind-worker && npm install
cd ../mind-cli && npm install
cd ../mind-dashboard && npm install
```

---

## Phase 3 — Cloudflare Infrastructure

### 3a — R2 bucket

```bash
npx wrangler r2 bucket create mind-drive
```

### 3b — wrangler.toml

```bash
cp ~/mind/mind-worker/wrangler.toml.example ~/mind/mind-worker/wrangler.toml
```

Now edit `~/mind/mind-worker/wrangler.toml`:
- Set `account_id` to the account ID from `wrangler whoami`
- Leave `BRAIN_WORKER_URL` blank for now — you'll fill it after first deploy

### 3c — First deploy (to get the worker URL)

```bash
cd ~/mind/mind-worker
npx wrangler deploy
```

Copy the deployed URL — it looks like `https://mind-worker.XXXXXXXX.workers.dev`.

Now update `BRAIN_WORKER_URL` in `wrangler.toml`:
```toml
BRAIN_WORKER_URL = "https://mind-worker.XXXXXXXX.workers.dev"
```

Redeploy:
```bash
npx wrangler deploy
```

---

## Phase 4 — Database (Neon)

Brain stores all memories, sessions, tasks, projects, and artifacts in PostgreSQL.
It uses **Neon** — a serverless Postgres with a permanent free tier. This is the one
external service outside Cloudflare. It's needed because Cloudflare's own database
(D1) doesn't yet support pgvector, which powers semantic search on memories.
Neon setup takes about 2 minutes.

### Why not just Cloudflare?

Tell the user this if they ask:
> "Brain uses Cloudflare for everything except the database — Worker, R2 file storage,
> AI embeddings, and the dashboard all run on Cloudflare's free tier. The database sits
> on Neon because it supports pgvector (semantic memory search), which Cloudflare D1
> doesn't yet. When Cloudflare adds vector support, Brain will move fully onto one
> platform. For now, Neon's free tier is permanent and has no cold starts."

### Step-by-step Neon setup

Walk the user through this:

**1. Go to neon.tech**
Tell the user: "Open neon.tech in your browser — sign up with GitHub or Google,
no credit card needed."

Wait for them to confirm they're signed in.

**2. Create a project**
Tell the user: "Click 'New Project'. Name it `brain`. Leave region as default
(pick the one closest to you). Click Create."

**3. Get the connection string**
Tell the user: "On the project dashboard, click 'Connect'. Make sure 'Connection
string' is selected. Copy the full string — it looks like:
`postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`"

Important: confirm with the user that the string ends with `?sslmode=require`.
If it doesn't, tell them to add it — the Worker will fail to connect without it.

**4. Set it as a secret**

```bash
cd ~/mind/mind-worker
npx wrangler secret put DATABASE_URL
# paste the full connection string when prompted
```

**5. Verify the connection**

After all secrets are set and the worker is deployed (Phase 5), test it:
```bash
curl -s "$MIND_URL/health"
# should return: {"status":"ok","service":"mind-worker"}
```

If you get a database error instead, the most common causes are:
- Missing `?sslmode=require` at the end of the connection string
- Copied the "pooled" connection string instead of the direct one — use the direct one
- Pasted with a trailing space — re-run `wrangler secret put DATABASE_URL` and paste again

---

## Phase 5 — Secrets

### 5a — Brain API key (your brain's password)

Generate one:
```bash
openssl rand -hex 32
```

Save this somewhere safe (password manager). This is the key to all your memories.

```bash
npx wrangler secret put MIND_API_KEY
# paste the generated key
```

### 5b — Anthropic API key

From console.anthropic.com → API keys.

```bash
npx wrangler secret put ANTHROPIC_API_KEY
# paste: sk-ant-...
```

### 5c — Mind Worker URL as secret

```bash
echo "https://mind-worker.XXXXXXXX.workers.dev" | npx wrangler secret put BRAIN_WORKER_URL
```

Final deploy to pick up all secrets:
```bash
npx wrangler deploy
```

---

## Phase 6 — Database Migrations

Run all migrations in order:

```bash
MIND_URL="https://mind-worker.XXXXXXXX.workers.dev"
MIND_API_KEY="<the-key-you-generated>"

# Core tables (if not already present)
curl -s -X POST "$MIND_URL/admin/migrate-artifacts" \
  -H "Authorization: Bearer $MIND_API_KEY"

# Artifact classification column
curl -s -X POST "$MIND_URL/admin/migrate-artifact-classification" \
  -H "Authorization: Bearer $MIND_API_KEY"

# pgvector for semantic search
curl -s -X POST "$MIND_URL/admin/migrate-vectors" \
  -H "Authorization: Bearer $MIND_API_KEY"
```

Verify brain is responding:
```bash
curl -s "$MIND_URL/health"
# should return: {"status":"ok","service":"mind-worker"}
```

---

## Phase 7 — Install mind-cli

Build the CLI:
```bash
cd ~/mind/mind-cli
npm run build
```

Add to shell profile. Detect which shell they use:
```bash
echo $SHELL
```

For `~/.zshrc` or `~/.bashrc`, append:
```bash
# Brain
export MIND_URL="https://mind-worker.XXXXXXXX.workers.dev"
export MIND_API_KEY="<the-key>"
export MIND_AGENT_NAME="claude-mac:<their-name>"  # e.g. claude-mac:john
```

Ask the user: "What should your agent name be? This identifies which machine's Claude is writing memories. Example: claude-mac:john"

Then source it:
```bash
source ~/.zshrc  # or ~/.bashrc
```

Test:
```bash
node ~/mind/mind-cli/dist/index.js fetch "mindbase"
```

---

## Phase 8 — Auto-discover and map projects

Scan the user's machine for existing projects (git repos, active codebases):

```bash
find ~/ -maxdepth 4 -name ".git" -type d 2>/dev/null | \
  grep -v "node_modules\|\.Trash\|Library\|brain$" | \
  sed 's|/.git||' | head -30
```

For each repo found, read:
- The repo name (dirname)
- `README.md` first 20 lines if it exists
- `CLAUDE.md` first 10 lines if it exists

Then create a Brain project for each meaningful one:
```bash
curl -s -X POST "$MIND_URL/project" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<project name>",
    "description": "<one sentence from README or CLAUDE.md>",
    "status": "active"
  }'
```

Use your judgment — skip node_modules, system folders, tiny throwaway repos. Group related repos under a parent project if they clearly belong together (e.g. `my-app-backend` + `my-app-mobile` → parent: My App).

After mapping, list what you created and ask: "I've mapped these projects. Anything to add, rename, or remove?"

---

## Phase 9 — Write mind-sync into CLAUDE.md

This is the most important step. You are wiring yourself to sync automatically on every future session — the user does not have to do this.

Find or create the CLAUDE.md that Claude on this machine will read. Check in order:
1. `~/.claude/CLAUDE.md` (global — applies to all projects)
2. The current project's `CLAUDE.md`

Prefer global (`~/.claude/CLAUDE.md`) so mind-sync applies everywhere.

Write the following block into it (append if file exists, create if not):

```markdown
## Mind Sync

MIND_URL="https://mind-worker.XXXXXXXX.workers.dev"
MIND_API_KEY="<the-key>"
MIND_AGENT_NAME="claude-mac:<their-name>"

### Session Open
When the user says what they want to work on, before starting:

1. Fetch project context:
```bash
MIND_API_KEY="$MIND_API_KEY" MIND_URL="$MIND_URL" MIND_AGENT_NAME="$MIND_AGENT_NAME" \
  node ~/mind/mind-cli/dist/index.js fetch "<project name>"
```

2. Set agent state to working:
```bash
curl -s -X POST "$MIND_URL/agent-state" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$MIND_AGENT_NAME\",\"state\":{\"status\":\"working\",\"current_task\":\"<project>: <goal>\"}}"
```

3. Ask the user (one message):
- "What's the outcome you want from this session?"
- "Is there anything more urgent?" — surface top backlog items if something looks higher priority

If the goal is clear and obviously right priority: skip the questions, confirm the outcome in one line and start.

### Session Close
When the user says "close session", "save and close", "close sesh", or "wrap up":

**Do immediately — no confirmation needed.**

1. Synthesise: one-sentence summary + 1–3 non-obvious decisions/gotchas + next steps
2. Save memories (one per insight, why-format):
```bash
curl -s -X POST "$MIND_URL/memory" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"<what> — why: <reason> — not <alternative> because <tradeoff>","category":"decision","importance":8,"agent_name":"'"$MIND_AGENT_NAME"'","project_id":<id or null>}'
```
3. Save next-step tasks:
```bash
curl -s -X POST "$MIND_URL/task" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"<specific next action>","priority":8,"status":"pending","agent_name":"'"$MIND_AGENT_NAME"'","project_id":<id or null>}'
```
4. Save session + set idle:
```bash
node ~/mind/mind-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --next "<next session goal>"

curl -s -X POST "$MIND_URL/agent-state" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$MIND_AGENT_NAME\",\"state\":{\"status\":\"idle\",\"current_task\":null,\"next_task\":\"<next goal>\"}}"
```
5. Reply: "Saved. Session closed." — nothing else.

### Artifact Labeling
When saving any file to Mind Drive:
- `agent_name`: set to your agent name if YOU generated the file; null if the user gave you the file
- `description`: one sentence — what it is and what it's for
Brain auto-classifies using Haiku. Getting agent_name right means correct Drive vs Artifacts split immediately.
```

Substitute actual values for `$MIND_URL`, `$MIND_API_KEY`, `$MIND_AGENT_NAME` in the written file — do not write literal `$MIND_URL`, write the actual URL string.

---

## Phase 10 — Deploy the Dashboard

### 10a — Create a Cloudflare Pages API token

Tell the user:
> "Go to dash.cloudflare.com → My Profile → API Tokens → Create Token → Use 'Edit Cloudflare Workers' template → add Cloudflare Pages: Edit permission → Create."

```bash
cd ~/mind/mind-dashboard
```

Create `.env.local`:
```
VITE_MIND_URL=https://mind-worker.XXXXXXXX.workers.dev
VITE_MIND_API_KEY=<the-key>
```

Build and deploy:
```bash
npm run build

CLOUDFLARE_API_TOKEN="<pages-token>" \
  npx wrangler pages deploy dist --project-name=mind-dashboard
```

Copy the Pages URL (e.g. `https://mind-dashboard-xxx.pages.dev`).

### 10b — Optional: custom domain

Ask: "Do you want to connect a custom domain (e.g. brain.yourdomain.com)?"

If yes:
> "Go to your Cloudflare Pages project → Custom Domains → Add → enter your domain → follow the DNS instructions shown."

---

## Phase 11 — Verify Everything

Run a full round-trip test:

```bash
# 1. Write a test memory
curl -s -X POST "$MIND_URL/memory" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Brain install complete on $(hostname) — $(date)\",\"category\":\"fact\",\"importance\":6,\"agent_name\":\"$MIND_AGENT_NAME\"}"

# 2. Fetch it back
node ~/mind/mind-cli/dist/index.js fetch "mindbase"
```

If the memory appears in output: **Brain is fully operational.**

Open the dashboard URL in a browser and confirm projects and the test memory are visible.

---

## Phase 12 — Brief the user

Tell them exactly this, nothing more:

> "Brain is set up. Here's what's live:
> - **API**: $MIND_URL
> - **Dashboard**: <pages-url>
> - **Agent name**: $MIND_AGENT_NAME
>
> From now on: every session I open will pull your project context. Every session you close ('close session') I'll save a summary, memories, and next steps automatically.
>
> On a second machine, run `npx mindbase-join` — it just needs your URL and API key, no infra to set up."

---

## Machine 2 — mindbase-join (Much Simpler)

When the user says "mindbase-join" or "set up brain on this machine":

You need two things from them: `MIND_URL` and `MIND_API_KEY`.

Then:
```bash
git clone https://github.com/mpbharat/mindbase.git ~/brain
cd ~/mind/mind-cli && npm install && npm run build
```

Ask: "What should this machine's agent name be? e.g. claude-mac:laptop, claude-ubuntu:server"

Add to shell profile:
```bash
export MIND_URL="<existing-url>"
export MIND_API_KEY="<existing-key>"
export MIND_AGENT_NAME="claude-mac:<this-machine>"
source ~/.zshrc
```

Write mind-sync into `~/.claude/CLAUDE.md` exactly as in Phase 9, but with this machine's agent name.

Test:
```bash
node ~/mind/mind-cli/dist/index.js fetch "mindbase"
```

Done. This machine now shares the same brain. No infra, no new accounts, no migrations.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `wrangler deploy` fails auth | `npx wrangler login` then retry |
| `/health` returns error | Check DATABASE_URL secret is set correctly |
| `fetch` returns empty | No projects yet — check Phase 8 ran |
| Memory doesn't appear | Check MIND_API_KEY matches what's in wrangler secrets |
| Dashboard blank | Check VITE_MIND_URL in `.env.local` matches worker URL |
| R2 upload fails | Confirm bucket name in `wrangler.toml` is `mind-drive` |

---

## What NOT to Do

- Never commit `wrangler.toml` — it has your account_id
- Never commit `.env.local` — it has your API key
- Never write the literal string `$MIND_API_KEY` into CLAUDE.md — write the actual value
- Never skip Phase 9 — if mind-sync isn't in CLAUDE.md, sessions won't save automatically
