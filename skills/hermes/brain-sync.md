---
name: brain-sync
description: Connects Hermes to the shared brain at brain.YOUR_DOMAIN.com for persistent memory across all agents and machines.
---

# Brain Sync for Hermes

## Session Start

On activation, call GET /context to load current state as resident memory:

```bash
curl -s "$BRAIN_URL/context" \
  -H "Authorization: Bearer $BRAIN_API_KEY"
```

Set env vars:
```bash
export BRAIN_API_KEY="BRAIN_API_KEY_PLACEHOLDER"
export BRAIN_URL="https://brain-worker.YOUR_SUBDOMAIN.workers.dev"
export BRAIN_AGENT_NAME="hermes-mac"   # or hermes-ubuntu
```

## API Reference

All requests: `Authorization: Bearer $BRAIN_API_KEY`

| Action | Request |
|---|---|
| Get context | `GET /context` |
| Save memory | `POST /memory` `{"content":"...","category":"decision","importance":8}` |
| Create task | `POST /task` `{"title":"...","project":"...","status":"active"}` |
| Update task | `PUT /task/:id` `{"status":"done"}` |
| Log session | `POST /session` `{"agent_name":"hermes-mac","summary":"...","duration_minutes":60}` |

## Session End

```bash
curl -s -X POST "$BRAIN_URL/session" \
  -H "Authorization: Bearer $BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\":\"$BRAIN_AGENT_NAME\",\"summary\":\"What was done\",\"duration_minutes\":60}"
```
