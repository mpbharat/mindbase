# Brain Sync Skill

This skill teaches Claude how to sync with Brain on every session — opening context, closing with memory, and labeling artifacts correctly.

Paste the relevant sections into your `CLAUDE.md` after completing `brain-install`.

---

## Session Open

When the user says what they want to work on, before starting:

**1. Fetch project context:**
```bash
BRAIN_API_KEY="$BRAIN_API_KEY" BRAIN_URL="$BRAIN_URL" BRAIN_AGENT_NAME="$BRAIN_AGENT_NAME" \
  node ~/brain/brain-cli/dist/index.js fetch "<project name>"
```

**2. Set agent state to working:**
```bash
curl -s -X POST "$BRAIN_URL/agent-state" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$BRAIN_AGENT_NAME\",\"state\":{\"status\":\"working\",\"current_task\":\"<project>: <goal>\"}}"
```

**3. Ask two short questions (one message):**
- "What's the outcome you want from this session?"
- "Is there anything more urgent?" — surface top backlog items if something looks higher priority

If the goal is clear and obviously right priority: skip the questions, confirm the outcome in one line and start.

---

## Session Close

**Trigger:** User says "close session", "save and close", "close sesh", or "wrap up".

**Do immediately — no confirmation needed.**

**Step 1 — Synthesize from conversation:**
- One-sentence summary of what was done
- 1–3 non-obvious decisions, bugs, or gotchas (skip routine completions)
- Unfinished work / clear next steps

**Step 2 — Save memories** (one per insight worth keeping across sessions):
```bash
curl -s -X POST "$BRAIN_URL/memory" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"<what> — why: <problem it solved> — not <alternative> because <tradeoff>","category":"decision","importance":8,"agent_name":"'"$BRAIN_AGENT_NAME"'","project_id":<id or null>}'
```

Save: decisions that would take >10 min to reconstruct, gotchas, why an approach was chosen.
Skip: routine completions, things obvious from the code.

**Step 3 — Save tasks** (concrete next actions, 1–3 max):
```bash
curl -s -X POST "$BRAIN_URL/task" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"<specific next action>","priority":8,"status":"pending","agent_name":"'"$BRAIN_AGENT_NAME"'","project_id":<id or null>}'
```

**Step 4 — brain-cli save:**
```bash
node ~/brain/brain-cli/dist/index.js save \
  --summary "<one-sentence summary>" \
  --next "<what to pick up next session>"
```

**Step 5 — Log session + set agent idle:**
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

**Step 6 — Reply:** "Saved. Session closed." — nothing else.

---

## Artifact Labeling

When saving any file to Brain Drive, always set:
- `agent_name`: your agent name if YOU generated the file; `null` if the user gave you the file
- `description`: one sentence — what it is and what it's for

Brain auto-classifies using Haiku based on these signals. Getting `agent_name` right means correct Drive vs Artifacts split immediately, no reclassification needed.

**Examples:**
- User hands you a PDF → save with `agent_name: null` → goes to Drive
- You generate a BACKLOG.md → save with `agent_name: "claude-mac:myproject"` → goes to Artifacts
- You save a meeting transcript you transcribed → `agent_name: null` → Drive

---

## Memory Categories & Priority

**Categories:** `decision` · `fact` · `project` · `person`
**Importance:** 10=critical · 8=important · 6=useful · below 6=skip

**Memory format (why-format for decisions):**
`"<what> — why: <reason> — not <alternative> because <tradeoff>"`

Example: `"Used Haiku for artifact classification — why: fast and cheap for single-call decisions — not Sonnet because 10x cost for no quality gain on binary classification"`
