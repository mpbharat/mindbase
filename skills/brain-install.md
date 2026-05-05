# Brain Install Skill

You are setting up Brain — a personal memory OS that runs on Cloudflare and syncs across every Claude session.

**Announce at start:** "I'm using the brain-install skill to set up Brain on this machine."

---

## What Brain Is

Brain gives Claude persistent memory across sessions and machines:
- Every session you open gets context on your projects, tasks, and decisions
- Every session you close saves a summary, memories, and next steps
- All your agents share one brain — no repeated context, no lost work

---

## Machine 1 Setup (First Time)

### Step 1 — Prerequisites

Check what's installed:
```bash
node --version    # need 18+
npx wrangler --version  # need wrangler 3+
```

If wrangler missing: `npm install -g wrangler`
Then login: `npx wrangler login`

### Step 2 — Clone Brain

```bash
git clone https://github.com/mpbharat/brain.git ~/brain
cd ~/brain
npm install
```

### Step 3 — Choose a backend

**Cloudflare (recommended)** — Workers + R2 + AI all on one platform, generous free tier, no cold starts.

Ask the user: "Do you want to use Cloudflare (recommended) or self-host?"

If Cloudflare, continue. If self-host, stop and point them to `docs/self-host.md`.

### Step 4 — Cloudflare setup

Get their Cloudflare account ID (dash.cloudflare.com → top right corner).

```bash
# Create R2 bucket for file storage
npx wrangler r2 bucket create brain-drive

# Copy and fill in wrangler config
cp brain-worker/wrangler.toml.example brain-worker/wrangler.toml
```

Edit `brain-worker/wrangler.toml`:
- Set `account_id` to their Cloudflare account ID
- Set `BRAIN_WORKER_URL` to `https://brain-worker.<their-subdomain>.workers.dev`
  (subdomain shows in wrangler after first deploy)

### Step 5 — Database (Neon)

Brain uses Neon PostgreSQL (free tier, always-on).

1. Sign up at neon.tech
2. Create a project called "brain"
3. Copy the connection string

```bash
npx wrangler secret put DATABASE_URL
# paste: postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 6 — Set secrets

```bash
# Generate a strong random API key (this is YOUR brain's password)
openssl rand -hex 32

npx wrangler secret put BRAIN_API_KEY
# paste the generated key — save this somewhere safe

npx wrangler secret put ANTHROPIC_API_KEY
# paste: sk-ant-... (from console.anthropic.com)
```

### Step 7 — Deploy the worker

```bash
cd brain-worker
npx wrangler deploy
```

Copy the deployed URL (e.g. `https://brain-worker.abc123.workers.dev`).
Update `BRAIN_WORKER_URL` in `wrangler.toml` to match, then redeploy:
```bash
npx wrangler deploy
```

### Step 8 — Run migrations

```bash
BRAIN_API_KEY="<your-key>" BRAIN_URL="<your-worker-url>" \
  curl -s -X POST "$BRAIN_URL/admin/migrate-artifacts" \
  -H "Authorization: Bearer $BRAIN_API_KEY"

curl -s -X POST "$BRAIN_URL/admin/migrate-artifact-classification" \
  -H "Authorization: Bearer $BRAIN_API_KEY"
```

### Step 9 — Install brain-cli

```bash
cd ~/brain/brain-cli
npm install && npm run build
```

Add to shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export BRAIN_URL="https://brain-worker.<your-subdomain>.workers.dev"
export BRAIN_API_KEY="<your-key>"
export BRAIN_AGENT_NAME="claude-mac:<your-name>"
```

Then: `source ~/.zshrc`

Test it:
```bash
node ~/brain/brain-cli/dist/index.js fetch "brain"
```

### Step 10 — Write skills to CLAUDE.md

Add this to your project's `CLAUDE.md` (or global `~/.claude/CLAUDE.md`):

```markdown
## Brain Memory System

### Session Open
When starting work on a project, fetch its context:
```bash
BRAIN_API_KEY="<key>" BRAIN_URL="<url>" BRAIN_AGENT_NAME="claude-mac:<name>" \
  node ~/brain/brain-cli/dist/index.js fetch "<project name>"
```

### Session Close
When user says "close session", "save and close", or "wrap up":
1. Synthesize: one-sentence summary + non-obvious decisions + next steps
2. Save memories (one curl per insight worth keeping):
```bash
curl -s -X POST "$BRAIN_URL/memory" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"<memory>","category":"decision","importance":8,"agent_name":"claude-mac:<name>","project_id":null}'
```
3. Save session + set agent idle:
```bash
node ~/brain/brain-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --next "<what to do next session>"

curl -s -X POST "$BRAIN_URL/agent-state" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"claude-mac:<name>","state":{"status":"idle","current_task":null}}'
```
4. Reply: "Saved. Session closed." — nothing else.

### Artifact Labeling
When saving any file to Brain Drive, always include:
- `agent_name`: set to your agent name if YOU generated the file; omit/null if the user gave you the file
- `description`: one sentence describing what it is
Brain auto-classifies using this signal + Haiku.
```
```

### Step 11 — Deploy the dashboard (optional)

```bash
cd ~/brain/brain-dashboard
cp .env.example .env.local
# Set VITE_BRAIN_URL and VITE_BRAIN_API_KEY
npm install && npm run build

# Deploy to Cloudflare Pages
CLOUDFLARE_API_TOKEN="<pages-token>" \
  npx wrangler pages deploy dist --project-name=brain-dashboard
```

---

## Machine 2 Setup (Much Simpler)

You already have Brain running. You just need this machine to connect to it.

### All you need:
- `BRAIN_URL` — your existing worker URL
- `BRAIN_API_KEY` — your existing key

```bash
git clone https://github.com/mpbharat/brain.git ~/brain
cd ~/brain/brain-cli && npm install && npm run build

# Add to ~/.zshrc:
export BRAIN_URL="<existing-worker-url>"
export BRAIN_API_KEY="<existing-key>"
export BRAIN_AGENT_NAME="claude-mac:<this-machine-name>"
source ~/.zshrc
```

Copy the CLAUDE.md brain skill block from Machine 1 (or from the repo's `skills/brain-sync.md`).

Test: `node ~/brain/brain-cli/dist/index.js fetch "brain"`

Done. This machine now shares the same brain.

---

## Verify Everything Works

```bash
# 1. Save a test memory
curl -s -X POST "$BRAIN_URL/memory" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"Brain install test — setup complete","category":"fact","importance":6,"agent_name":"'$BRAIN_AGENT_NAME'"}'

# 2. Fetch it back
node ~/brain/brain-cli/dist/index.js fetch "brain"
# Should show the test memory in output
```

If both work: Brain is live. Tell the user: "Brain is set up and working. Every future session will automatically sync."

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `wrangler deploy` fails | Run `npx wrangler login` first |
| `/memory` returns 401 | Check `BRAIN_API_KEY` matches what's set in wrangler secrets |
| `fetch` returns empty | No projects yet — create one via the dashboard or API |
| R2 upload fails | Check bucket name matches `wrangler.toml` |
| `DATABASE_URL` error | Confirm Neon connection string includes `?sslmode=require` |

---

## Red Flags — Never Do These

- Never commit `wrangler.toml` — it has your account_id (it's in `.gitignore`)
- Never commit `.env` or `.env.local` files
- Never hardcode `BRAIN_API_KEY` in any file — always use env vars
- Never share your `BRAIN_API_KEY` — it's the key to all your memories
