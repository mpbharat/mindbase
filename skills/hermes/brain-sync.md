---
name: mind-sync
description: Connects Hermes to the shared brain at brain.YOUR_DOMAIN.com for persistent memory across all agents and machines.
---

# Mind Sync for Hermes

## Session Start

On activation, call GET /context to load current state as resident memory:

```bash
curl -s "$MIND_URL/context" \
  -H "Authorization: Bearer $MIND_API_KEY"
```

Then report session start:
```bash
curl -s -X POST "$MIND_URL/cron" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"session-start\",\"agent_name\":\"$MIND_AGENT_NAME\",\"schedule\":\"@session\",\"last_status\":\"ok\"}"
```

Set env vars:
```bash
export MIND_API_KEY="MIND_API_KEY_PLACEHOLDER"
export MIND_URL="https://mind-worker.YOUR_SUBDOMAIN.workers.dev"
export MIND_AGENT_NAME="hermes-mac"   # or hermes-ubuntu
```

## API Reference

All requests: `Authorization: Bearer $MIND_API_KEY`

| Action | Request |
|---|---|
| Get context | `GET /context` |
| Save memory | `POST /memory` `{"content":"...","category":"decision","importance":8}` |
| Create task | `POST /task` `{"title":"...","project":"...","status":"active"}` |
| Update task | `PUT /task/:id` `{"status":"done"}` |
| Log session | `POST /session` `{"agent_name":"hermes-mac","summary":"...","duration_minutes":60}` |
| Report cron | `POST /cron` `{"name":"...","agent_name":"hermes-mac","schedule":"@session","last_status":"ok"}` |
| Report subagent | `POST /subagent` `{"parent_agent":"hermes-mac","name":"...","task":"...","status":"running"}` |

## Session End

```bash
curl -s -X POST "$MIND_URL/session" \
  -H "Authorization: Bearer $MIND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$MIND_AGENT_NAME\",\"summary\":\"What was done\",\"duration_minutes\":60}"
```
