# StellarOS — Backlog

**Current Phase:** Phase 1 — The Living Universe (MVP)
**Target:** ~2 weeks
**Deploy Target:** stellaros.life

---

## Phase 1 Tasks

### 1. Project Setup
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Initialize Next.js 14+ (App Router) project | todo | `npx create-next-app@latest stellaros --typescript --tailwind --app` |
| 1.2 | Install R3F stack (@react-three/fiber, drei, postprocessing) | todo | |
| 1.3 | Install Three.js, d3-force-3d, framer-motion | todo | |
| 1.4 | Connect Neon database | todo | `npx neonctl@latest --force-auth init --agent claude` |
| 1.5 | Set up ORM (Drizzle or Prisma) | todo | Lean Drizzle for serverless |
| 1.6 | Deploy to Vercel (empty shell) | todo | Connect repo, add stellaros.life domain |
| 1.7 | Set up environment variables (.env.local) | todo | Neon connection string, auth secret |
| 1.8 | Git repo initialized and pushed | todo | |

### 2. Database Schema
| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Create `nodes` table | todo | With designation, stability, bandwidth_cost columns |
| 2.2 | Create `items` table | todo | Backlog items per node |
| 2.3 | Create `activity_log` table | todo | |
| 2.4 | Create `cosmic_events` table | todo | Including decision_context JSONB |
| 2.5 | Create `snapshots` table | todo | |
| 2.6 | Create `health_logs` table | todo | |
| 2.7 | Create `people` table | todo | Relationship orbits |
| 2.8 | Create `interactions` table | todo | |
| 2.9 | Create `learning_log` table | todo | |
| 2.10 | Create `attention_log` table | todo | |
| 2.11 | Create `seasonal_rhythms` table | todo | |
| 2.12 | Create `edicts` table | todo | |
| 2.13 | Run initial migration | todo | |

### 3. 3D Galaxy Scene (Core Visual)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Dark space environment (background, particle dust, vignette) | todo | Post-processing pipeline |
| 3.2 | Central Consciousness node (brain/star, glow shader, pulse) | todo | The sun of SOL |
| 3.3 | 8 domain nodes (positioned with d3-force-3d) | todo | Color per domain |
| 3.4 | Sub-nodes per domain | todo | Smaller, connected to parent |
| 3.5 | Custom glow/pulse shaders for nodes | todo | GLSL shaderMaterial |
| 3.6 | Organic connections (TubeGeometry + CatmullRomCurve3) | todo | Curved, not straight |
| 3.7 | Particle flow along connections | todo | Instanced meshes or Points |
| 3.8 | Post-processing (bloom, depth-of-field, vignette) | todo | Non-negotiable for aesthetic |
| 3.9 | Ambient breathing animation (all nodes float/pulse) | todo | |
| 3.10 | Camera controls (OrbitControls, smooth transitions) | todo | |

### 4. Stellaris HUD (2D Overlay)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Top HUD bar — resource economy display | todo | See ui-reference.md Zone 1 |
| 4.2 | Resource calculations (bandwidth, resilience, focus) | todo | From mechanics mapping |
| 4.3 | Right sidebar — contextual panel | todo | Default: domain list + processes |
| 4.4 | Right sidebar — node detail view (on click) | todo | |
| 4.5 | Bottom nav bar — view mode tabs | todo | Galaxy Map, Central Command, Cog Report, etc. |
| 4.6 | Left tool bar — icon buttons | todo | Situations, edicts, factions, map modes |
| 4.7 | Panel animations (framer-motion transitions) | todo | |

### 5. Node Interaction
| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Click node → camera fly-to animation | todo | drei camera transitions |
| 5.2 | Level 1 → 2 zoom (galaxy → domain system) | todo | |
| 5.3 | Level 2 → 3 zoom (system → planet/project) | todo | |
| 5.4 | Back navigation (pull back one level) | todo | |
| 5.5 | Hover effects (node brightens, label appears) | todo | |
| 5.6 | Node selection state (depth-of-field blurs background) | todo | |

### 6. CRUD Operations
| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | API: GET /api/mindmap (full graph data) | todo | |
| 6.2 | API: GET /api/node/:id (node detail + children + items) | todo | |
| 6.3 | API: POST /api/node/:id/items (add item) | todo | |
| 6.4 | API: PATCH /api/node/:id (update node) | todo | |
| 6.5 | API: PATCH /api/items/:id (update item status) | todo | |
| 6.6 | API: GET /api/context (priorities for external tools) | todo | |
| 6.7 | Kanban/task list in right sidebar for trackable nodes | todo | |
| 6.8 | Add/complete/update items from sidebar | todo | |

### 7. Central Command View
| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | "Now" dashboard — today's priorities | todo | |
| 7.2 | Weekly focus items | todo | |
| 7.3 | Active situations summary | todo | |
| 7.4 | Resource trend indicators | todo | |

### 8. Data Seeding
| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Seed 8 branch nodes from reference/projects.md | todo | |
| 8.2 | Seed sub-nodes (Zaasu, Mart, Dhi's, etc.) | todo | |
| 8.3 | Seed initial items/backlogs per node | todo | |
| 8.4 | Seed initial people (Amu, Dhiya, Viktor, etc.) | todo | From reference/bharat-profile.md |
| 8.5 | Set initial designations and stability scores | todo | |
| 8.6 | First snapshot (baseline state) | todo | |

### 9. Auth & Deploy
| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Simple auth (password-protected or NextAuth) | todo | Single user only |
| 9.2 | Deploy to Vercel production | todo | |
| 9.3 | Connect stellaros.life domain | todo | DNS configuration |
| 9.4 | Verify production deployment | todo | |
| 9.5 | Weekly snapshot cron job | todo | Start recording from day 1 |

---

## Session Log

| Session | Date | What Was Done | Items Completed |
|---------|------|--------------|----------------|
| 0 | March 10, 2026 | Planning & spec writing (Cowork session). Product spec, Stellaris mechanics mapping, UI reference, CLAUDE.md, BACKLOG.md created. Neon project created. | Spec docs complete |
| 1 | — | — | — |

---

## Blockers

| # | Blocker | Status | Resolution |
|---|---------|--------|------------|
| — | None yet | — | — |

---

## Decisions Needed

| # | Decision | Status | Outcome |
|---|----------|--------|---------|
| 1 | Drizzle vs Prisma for ORM | open | Lean Drizzle (better serverless, lighter) |
| 2 | Exact auth approach | open | Password route vs NextAuth — decide in Session 1 |

---

## Progress Summary

**Phase 1:** 0 / 47 tasks complete (0%)

```
Setup:     ░░░░░░░░░░  0/8
Database:  ░░░░░░░░░░  0/13
3D Scene:  ░░░░░░░░░░  0/10
HUD:       ░░░░░░░░░░  0/7
Interact:  ░░░░░░░░░░  0/6
CRUD:      ░░░░░░░░░░  0/8
Command:   ░░░░░░░░░░  0/4
Seed:      ░░░░░░░░░░  0/6
Deploy:    ░░░░░░░░░░  0/5
```
