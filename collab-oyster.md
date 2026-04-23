# Collab: Brain × Oyster

**Oyster repo:** https://github.com/mattslight/oyster
**Contact:** Matt Slight (friend/colleague)
**Status:** Parked — idea to revisit

## What Oyster Is

Local-first workspace OS. Scans repos/files, organizes into "spaces" (projects), exposes everything to AI via MCP tools (list_spaces, create_artifact, read_artifact, etc.). Web UI at localhost:4444. Any MCP-capable AI (Claude Code, Cursor) can control it. Stack: Node.js + TypeScript + SQLite + Vite.

## The Opportunity

Both Brain and Oyster are AI memory/context systems — complementary layers:
- **Brain** = long-term, cross-machine memory (sessions, decisions, tasks, agents)
- **Oyster** = local workspace orchestration (artifacts, spaces, project files)

## Two Options

**Option A — Brain as Oyster builtin artifact**
- Brain dashboard as a `manifest.json` + `src/` builtin inside Oyster
- Brain stays cloud-hosted (Cloudflare + Neon), users configure their own API key
- Preserves Brain's cross-machine multi-agent value
- Lower integration depth, easier to ship

**Option B — Brain embedded in Oyster core**
- Port Brain schema into Oyster's existing SQLite
- Brain MCP tools (`save_memory`, `get_context`, `create_task`) added to Oyster's mcp-server.ts
- Fully local, no cloud account needed for Oyster users
- Loses cross-machine sync unless Oyster adds it later

## Key Tension

Brain's core value is *cross-machine* (mac + ubuntu + hermes → same brain). Oyster is single-machine. Option B loses that.

## Open Questions (to answer before building)

1. Commercial or open source? (affects integration depth)
2. Is Matt's goal that *his users* get Brain memory, or that *Bharat* can use Brain from Oyster?
3. Does Matt want to own the memory backend or point to Bharat's Cloudflare worker?
