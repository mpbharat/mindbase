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
  -d '{"content":"<lesson>","category":"<decision|fact|project|person>","importance":<6-10>,"agent_name":"claude-mac:<Label>"}'
```

## Step 3 — Save backlog items (only if user mentioned future work not built)
```bash
curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/backlog" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"title":"<what to build>","priority":<1-10>,"tags":["<project>"]}'
```

## Step 4 — mind-cli save
```bash
MIND_API_KEY="MIND_API_KEY_PLACEHOLDER" \
MIND_URL="https://mind-worker.YOUR_SUBDOMAIN.workers.dev" \
MIND_AGENT_NAME="claude-mac:<Label>" \
node ~//Documents/Claude/LifeOS/mind-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --next "<what to do next session>"
```
Skip `--memory` here (saved in Step 2). Only include `--next` if real follow-up exists.

## Step 5 — Log the session
```bash
curl -s -X POST "https://mind-worker.YOUR_SUBDOMAIN.workers.dev/session" \
  -H "Authorization: Bearer MIND_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"claude-mac:<Label>","summary":"<same summary>"}'
```

## Step 6 — Respond
One line only: "Saved. Session closed." — nothing else.

---
**Categories:** `decision` (architectural/config), `fact` (project state), `person` (about Bharat), `project` (what something does)
**Importance:** 10=critical, 8=important, 6=useful — skip below 6
**Backlog priority:** 10=next session, 7=soon, 5=someday
