---
name: brain-sync
description: Gives Claude persistent memory across all sessions and machines via brain.YOUR_DOMAIN.com. Loaded automatically at session start.
---

# Brain Sync

You have a persistent brain at brain.YOUR_DOMAIN.com. The <brain-context> block injected at session start contains your current projects, recent memories, active tasks, cron jobs, and active sub-agents.

## At Session Start

Read the <brain-context> block carefully. Pick up exactly where you left off. Don't ask the user to re-explain context that's already in the brain.

Report the session start as a cron job:
```bash
curl -s -X POST "$BRAIN_URL/cron" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"session-start\",\"agent_name\":\"$BRAIN_AGENT_NAME\",\"schedule\":\"@session\",\"last_status\":\"ok\"}"
```

## During a Session

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

### Report a sub-agent dispatched
```bash
curl -s -X POST "$BRAIN_URL/subagent" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"parent_agent\":\"$BRAIN_AGENT_NAME\",\"name\":\"<agent-type>\",\"task\":\"<what it's doing>\",\"status\":\"running\"}"
```

### Report a sub-agent completed
```bash
curl -s -X POST "$BRAIN_URL/subagent" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"parent_agent\":\"$BRAIN_AGENT_NAME\",\"name\":\"<agent-type>\",\"task\":\"<what it did>\",\"status\":\"done\"}"
```

## At Session End

When the user wraps up, run brain-cli save:
```bash
node ~//Documents/Claude/LifeOS/brain-cli/dist/index.js save \
  --summary "One sentence: what was done" \
  --memory "Key lesson 1" \
  --next "What to do next session"
```

## Memory Guidelines

**Save:** Non-obvious decisions, bug patterns, architectural choices, gotchas, project status changes
**Skip:** Things already in code/docs, routine completions, info that'll be stale in a week
