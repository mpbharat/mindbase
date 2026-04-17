---
name: brain-sync
description: Gives Claude persistent memory across all sessions and machines via brain.YOUR_DOMAIN.com. Loaded automatically at session start.
---

# Brain Sync

You have a persistent brain at brain.YOUR_DOMAIN.com. The <brain-context> block injected at session start contains your current projects, recent memories, active tasks, and backlog.

## At Session Start

Read the <brain-context> block carefully. It tells you:
- Active projects and their status
- Recent memories (decisions, lessons, gotchas)
- Open tasks and backlog items

Pick up exactly where you left off. Don't ask the user to re-explain context that's already in the brain.

## During a Session

Use the brain REST API (via bash or a fetch call) when:
- A non-obvious decision is made → POST /memory
- A task is created or completed → POST /task or PUT /task/:id
- You discover a gotcha or lesson worth keeping → POST /memory

All requests: Authorization: Bearer $BRAIN_API_KEY to $BRAIN_URL

### Save a memory
```bash
curl -s -X POST "$BRAIN_URL/memory" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"<lesson>","category":"decision","importance":8}'
```

### Create a task
```bash
curl -s -X POST "$BRAIN_URL/task" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"<task>","project":"<project>","status":"active"}'
```

## At Session End

When the user wraps up, run brain-cli save:
```bash
node ~//Documents/Claude/LifeOS/brain-cli/dist/index.js save \
  --summary "One sentence: what was done" \
  --memory "Key lesson 1" \
  --memory "Key lesson 2" \
  --next "What to do next session"
```

## Memory Guidelines

**Save:** Non-obvious decisions, bug patterns, architectural choices, gotchas, project status changes
**Skip:** Things already in code/docs, routine completions, info that'll be stale in a week
