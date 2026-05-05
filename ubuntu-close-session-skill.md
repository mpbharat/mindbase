---
name: close-session
description: Auto-save session to brain and close. Trigger when user says "save and close", "close session", "close sesh", "wrap up session", or similar session-end phrases.
---

# Close Session

When the user signals they want to end the session, do this immediately — no confirmation needed.

## Step 1 — Synthesize
From the conversation extract:
- One-sentence summary of what was done
- 1–3 non-obvious decisions, bugs, gotchas (skip routine completions)
- Unfinished work or clear next steps
- Any backlog items user mentioned but didn't build this session

## Step 2 — Save memories (one curl per save-worthy memory)
```bash
curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/memory" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"content":"<memory>","category":"<decision|fact|project|person>","importance":<6-10>,"agent_name":"claude-ubuntu:<Label>","project_id":<id or null>}'
```

**Why-format for decisions:** `"<what> — why: <problem it solved> — not <alternative> because <tradeoff>"`
Only save things that would take >10 min to reconstruct. Skip what's obvious from the code.

Project IDs: Zaasu=2, KPS/Mart=3, Anchor=1, Personal=6, LifeOS=8, Mart PIM SaaS=7, Data Extraction=12, Lead Research=13, Outreach=14, Health=4, Dhiya=5, EvolveViaAI=9, LinkedIn=10, Dhis=11

## Step 3 — Save tasks and issues

**Tasks** (completed or to-do within this session — save as agent_task):
```bash
curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/task" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"title":"<specific action done or to do>","priority":<1-10>,"status":"pending","agent_name":"claude-ubuntu:<Label>","project_id":<id or null>}'
```

**Issues** (started but will spill to next session — save as backlog_item type=issue):
```bash
curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/backlog" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"title":"<what was started but unfinished>","priority":<1-10>,"type":"issue","parent_id":<epic id if known, else null>,"project_id":<id or null>,"tags":["<project>"]}'
```

**Epics** = NEVER auto-create. These are planned upfront in the dashboard.

**Decision guide:**
- Did this session complete it? → agent_task (status: completed or pending for next)
- Started but needs another session? → backlog_item type=issue
- Big initiative spanning weeks? → Epic (create manually in dashboard, not here)

## Step 5 — mind-cli save
```bash
MIND_API_KEY="MIND_API_KEY_PLACEHOLDER" \
MIND_URL="https://mind-worker.YOUR_SUBDOMAIN.workers.dev" \
MIND_AGENT_NAME="claude-ubuntu:<Label>" \
node /home/YOUR_USERNAME/Documents/Claude/LifeOS/mind-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --next "<what to do next session>"
```
Skip `--memory` here (saved in Step 2). Only include `--next` if real follow-up exists.

## Step 6 — Log session + update agent state to idle
```bash
curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/session" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"claude-ubuntu:<Label>","summary":"<same summary>","project_id":<id or null>}'

curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/agent-state" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"claude-ubuntu:<Label>","state":{"status":"idle","current_task":null,"next_task":"<what to pick up next session>"}}'
```

## Step 7 — Respond
One line only: "Saved. Session closed." — nothing else.

---
**Categories:** `decision` (architectural/config), `fact` (project state), `person` (about Bharat), `project` (what something does)
**Importance:** 10=critical, 8=important, 6=useful — skip below 6
**Task/Backlog priority:** 10=next session, 7=soon, 5=someday
