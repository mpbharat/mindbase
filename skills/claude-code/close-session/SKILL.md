---
name: close-session
description: Auto-save session to brain and close. Trigger when user says "save and close", "close session", "close sesh", "wrap up session", or similar session-end phrases.
---

# Close Session

When the user signals they want to end the session, do this immediately — no confirmation needed.

## Steps

1. **Determine the session agent name** using the same rule as brain-sync:
   - Known project (Anchor, Zaasu, Mart, KPS, Health, Dhiya) → `claude-ubuntu:ProjectName`
   - Other topic → `claude-ubuntu:2-3 Word Summary`
   - Use whatever label you registered with at session start if you already did so

2. **Synthesize the session:**
   - A one-sentence summary of what was done
   - 1–3 key decisions, lessons, or gotchas (skip routine completions)
   - What to do next session (only if real work was left open)

3. **Run brain-cli save** (inlining env vars since .bashrc isn't sourced):
```bash
BRAIN_API_KEY=BRAIN_API_KEY_PLACEHOLDER BRAIN_URL=https://brain-worker.YOUR_SUBDOMAIN.workers.dev BRAIN_AGENT_NAME=claude-ubuntu:<Label> node ~/brain/brain-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --memory "<key lesson 1>" \
  --next "<what to do next>"
```
   Replace `<Label>` with the project/topic label from Step 1.

4. **Log the session:**
```bash
curl -s -X POST "https://brain-worker.YOUR_SUBDOMAIN.workers.dev/session" \
  -H "Authorization: Bearer BRAIN_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"claude-ubuntu:<Label>","summary":"<same one-sentence summary>","duration_minutes":60}'
```

5. **Confirm** with one line: "Saved. Session closed." — nothing else.

## What counts as a save-worthy memory
- Non-obvious decisions made
- Architectural or config choices
- Bugs or gotchas discovered
- Project status changes

## What to skip
- Routine completions ("installed X")
- Things already in code or docs
- Context that will be stale next week
