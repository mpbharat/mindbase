# Brain Sync Skill

**This skill is installed automatically by brain-install. You do not add this manually.**

It documents the session lifecycle behavior that `brain-install` writes into your `~/.claude/CLAUDE.md`.

---

## Session Open

When the user says what they want to work on, before starting:

**1. Fetch project context:**
```bash
node ~/brain/brain-cli/dist/index.js fetch "<project name>"
```

**2. Set agent state to working:**
```bash
curl -s -X POST "$BRAIN_URL/agent-state" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$BRAIN_AGENT_NAME\",\"state\":{\"status\":\"working\",\"current_task\":\"<project>: <goal>\"}}"
```

**3. PM check (one message, keep short):**
- "What's the outcome you want from this session?"
- "Is there anything more urgent?" — surface top 1–2 backlog items if something clearly higher priority

If the goal is obvious and right priority: skip the questions, confirm in one line and start.

---

## Session Close

**Trigger:** User says "close session", "save and close", "close sesh", or "wrap up".

**Do immediately — no confirmation needed.**

**1. Synthesise:**
- One-sentence summary of what was done
- 1–3 non-obvious decisions, bugs, or gotchas (skip routine completions)
- Unfinished work / next steps

**2. Save memories** — why-format, one per insight:
```bash
curl -s -X POST "$BRAIN_URL/memory" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"<what> — why: <reason> — not <alternative> because <tradeoff>","category":"decision","importance":8,"agent_name":"'"$BRAIN_AGENT_NAME"'","project_id":<id or null>}'
```

Save: decisions that take >10 min to reconstruct, gotchas, why an approach was chosen.
Skip: routine completions, anything obvious from the code.

**3. Save tasks** (concrete next actions, 1–3 max):
```bash
curl -s -X POST "$BRAIN_URL/task" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"<specific next action>","priority":8,"status":"pending","agent_name":"'"$BRAIN_AGENT_NAME"'","project_id":<id or null>}'
```

**4. brain-cli save:**
```bash
node ~/brain/brain-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --next "<what to pick up next session>"
```

**5. Log session + set idle:**
```bash
curl -s -X POST "$BRAIN_URL/session" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$BRAIN_AGENT_NAME\",\"summary\":\"<same summary>\",\"project_id\":<id or null>}"

curl -s -X POST "$BRAIN_URL/agent-state" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$BRAIN_AGENT_NAME\",\"state\":{\"status\":\"idle\",\"current_task\":null,\"next_task\":\"<next session goal>\"}}"
```

**6. Reply:** "Saved. Session closed." — nothing else.

---

## Artifact Labeling

When saving any file to Brain Drive:
- `agent_name`: your agent name if YOU generated the file; `null` if the user gave you the file
- `description`: one sentence — what it is and what it's for

Brain auto-classifies using Haiku. Getting `agent_name` right means correct Drive vs Artifacts split at save time — no reclassification needed.

**Rule of thumb:**
- User hands you a PDF → `agent_name: null` → Drive
- You write a BACKLOG.md → `agent_name: "claude-mac:name"` → Artifacts
- You write a plan → `agent_name: "claude-mac:name"` → Artifacts
- You transcribe a meeting → `agent_name: null` → Drive (source doc)

---

## Memory Format

**Categories:** `decision` · `fact` · `project` · `person`
**Importance:** 10=critical · 8=important · 6=useful · skip below 6

**Why-format for decisions:**
`"<what> — why: <problem it solved> — not <alternative> because <tradeoff>"`

Example:
`"Haiku for artifact classification — why: fast + cheap for binary decisions — not Sonnet because 10x cost for no quality gain"`
