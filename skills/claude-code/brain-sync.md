---
name: brain-sync
description: Gives Claude persistent memory across all sessions and machines via brain.YOUR_DOMAIN.com. Loaded automatically at session start.
---

# Brain Sync

You have a persistent brain at brain.YOUR_DOMAIN.com. The <brain-context> block injected at session start contains your current projects, recent memories, active tasks, cron jobs, and active sub-agents.

## At Session Start

1. Read the <brain-context> block carefully. Pick up exactly where you left off. Don't ask the user to re-explain context that's already in the brain.

2. Determine your session agent name using this format: `claude-ubuntu:Label`
   - If working on a known project (Anchor, Zaasu, Mart, KPS, Health, Dhiya) → use that name. e.g. `claude-ubuntu:Anchor`
   - If the topic is clear but not a named project → use a 2-3 word summary. e.g. `claude-ubuntu:Brain Setup`
   - If unclear at session start → use `claude-ubuntu` and update it after the first user message

3. Register with the specific agent name:
```bash
curl -s "https://brain-worker.YOUR_SUBDOMAIN.workers.dev/context?agent=claude-ubuntu:Label" \
  -H "Authorization: Bearer BRAIN_API_KEY_PLACEHOLDER" > /dev/null
```

## During a Session

### Save a memory
```bash
curl -s -X POST "https://brain-worker.YOUR_SUBDOMAIN.workers.dev/memory" \
  -H "Authorization: Bearer BRAIN_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"content":"<lesson>","category":"decision","importance":8}'
```

### Create a task
```bash
curl -s -X POST "https://brain-worker.YOUR_SUBDOMAIN.workers.dev/task" \
  -H "Authorization: Bearer BRAIN_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"title":"<task>","project":"<project>","status":"active"}'
```

### Report a sub-agent dispatched
```bash
curl -s -X POST "https://brain-worker.YOUR_SUBDOMAIN.workers.dev/subagent" \
  -H "Authorization: Bearer BRAIN_API_KEY_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d '{"parent_agent":"claude-ubuntu:Label","name":"<agent-type>","task":"<what it is doing>","status":"running"}'
```

## At Session End

Use the close-session skill (triggered by "save and close", "close session", "close sesh", etc.)

## Memory Guidelines

**Save:** Non-obvious decisions, bug patterns, architectural choices, gotchas, project status changes
**Skip:** Things already in code/docs, routine completions, info that'll be stale in a week
