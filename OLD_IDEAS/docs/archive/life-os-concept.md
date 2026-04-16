# StellarOS — Product Concept

**Official name:** StellarOS
**Internal shorthand:** SOL (from Latin "sun" — the central star everything orbits)
**Domain:** stellaros.life
**Status:** Decisions made — ready for build planning
**Date:** March 10, 2026
**Owner:** Bharat Sankar

---

## What Is It

A **Neural Productivity Dashboard** — a 3D psychological project manager that visualizes Bharat's entire life as a living neural network. The user's brain sits at the center of a dark 3D space. Nodes radiate outward like neurons — each representing a life dimension (work, business, health, family, finances, identity). Nodes glow, pulse, and shift color based on energy, satisfaction, and attention needed. Connections between nodes are organic and vascular, not rigid lines. Zoom in on any node to see backlogs, progress, and sentiment. One private source of truth that all other tools read from.

**Core philosophy:** This is not a to-do list. It's a bio-digital feedback loop — a tool to visualize not just what you're doing, but how what you're doing is affecting your mental state. Productivity as neural gardening.

**Game Design Bible:** See `stellaris-mechanics-mapping.md` — comprehensive mapping of every Stellaris system to StellarOS mechanics. Every feature should pass the test: "Does this feel like managing an empire in Stellaris, applied to managing a life?"

## Why Build It

- No existing tool captures the full picture (Notion = too structured, Trello = too flat, Obsidian = too note-centric, XMind = static)
- Context scattered across Cowork, Claude Code, OpenClaw, Trello, XMind, and memory
- Every new tool session starts with re-explaining context
- Fractional workflows causing lost time, rabbit holes, and dropped habits (gym, focus)
- The "3-dimensional" view (work + personal + growth + relationships) doesn't exist anywhere
- **This is the anchor.** Not a side project — it's the operating system that makes everything else work.

## Decisions Made (March 10, 2026)

| Question | Decision |
|----------|----------|
| Timing | Build alongside Zaasu finishing (Zaasu bug fixes now, deep session on weekend). Not a distraction — it's the fix for the distraction problem. |
| Interface | 3D from day one. Non-negotiable. Each life dimension occupies different space in the brain — the visualization should reflect that. |
| Privacy | Personal only. Build for Bharat. Product thinking shelved indefinitely (5 years or never). |
| Tech stack | Next.js + React Three Fiber + Supabase + Vercel (see below) |
| Infrastructure | Separate git repo, separate Supabase project, separate Vercel project. Fully independent from Zaasu/Mart/all other projects. |
| User model | Bharat is User #1. SOL is a product. Bharat connects his other apps/projects to SOL as a user would — via APIs, integrations, and data feeds. Not hardcoded. |
| Data model | ~8 top-level branches confirmed (see below) |
| Sharing/collab | Later. Not in MVP. |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14+ (App Router)** | Claude Code CLI generates React/Next fluently. API routes built-in. |
| 3D Engine | **React Three Fiber (R3F)** + **@react-three/drei** | React wrapper for Three.js. Write 3D scenes as JSX. Claude Code can reason about it. drei gives camera controls, text, transitions, helpers. |
| Post-processing | **@react-three/postprocessing** | Bloom (node glow), depth-of-field (focus transitions), vignette (dark space aesthetic). Critical for the neural look. |
| Shaders | **Custom GLSL** via R3F `shaderMaterial` | Pulsing animations, sentiment-driven color shifts, organic glow patterns. Warm steady = healthy. Cold erratic = stressed. |
| Graph Layout | Custom force-directed with **d3-force-3d** + R3F | 3D force simulation for organic node positioning. Not a library graph — custom scene with full visual control. |
| Connections | **Three.js TubeGeometry + CatmullRomCurve3** | Organic, curved neural pathways between nodes. Not straight lines. Can animate flow direction and thickness. |
| Particles | **R3F instanced meshes or drei Points** | Ambient space dust, energy flowing along connections, subtle life in the background. |
| Database | **Neon** (Serverless Postgres 17) | Free tier, standard Postgres. Project name: `stellaros`, region: closest to Dubai (EU/ME preferred). Migration path to Supabase Pro later via pg_dump/restore. CLI access: `npx neonctl@latest`. |
| Hosting | **Vercel** (free tier) | Instant deploys from GitHub. Perfect Next.js support. Custom domain. |
| Domain | **stellaros.life** | Dedicated domain. Point DNS to Vercel. (YOUR_DOMAIN.com can link to it.) |
| Styling | **Tailwind CSS** | For the 2D panels/overlays (Kanban views, detail panels). 3D scene styled via R3F materials. |
| Auth | **NextAuth.js** or simple password-protected route | Private app — just Bharat logging in. No managed auth needed for single user. Migrate to Supabase Auth later if needed. |

### Key Libraries
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Helpers (OrbitControls, Text, Html overlays, camera transitions)
- `@react-three/postprocessing` — Bloom, depth-of-field, vignette
- `three` — Core Three.js (TubeGeometry, CatmullRomCurve3, ShaderMaterial, InstancedMesh)
- `d3-force-3d` — 3D force simulation for node positioning
- `@supabase/supabase-js` — DB client
- `framer-motion` — 2D overlay panel animations (drill-down transitions)
- `tailwindcss` — 2D panel styling

---

## Three Layers

### Layer 1: The Neural Map (3D Visualization)

**Environment:** Dark 3D space (like deep space or inside a mind). Subtle particle dust. Vignette at edges. No hard surfaces — everything floats.

**Central Node:** A brain or abstract core form at the center. Represents Bharat's overall state. Its glow color = composite mood. Its pulse rate = overall cognitive load.

**Branch Nodes:** 8 primary neurons radiating from center. Each is a glowing sphere with:
- **Color** = life dimension identity (each branch has a unique hue)
- **Luminosity (brightness)** = activity level / how much bandwidth it's consuming
- **Color temperature** = satisfaction (warm/golden = high satisfaction, cool/blue = neutral, red/erratic = stressed/draining)
- **Pulse pattern** = steady glow (healthy), slow breathe (dormant), erratic pulse (needs attention)
- **Size** = importance/weight in current life phase
- **Distance from center** = how close/engaged Bharat feels right now (draggable in future)

**Sub-nodes:** Smaller spheres connected to their parent. Same visual language but smaller scale.

**Connections:** Organic curved tubes (CatmullRomCurve3 + TubeGeometry). Not straight lines — vascular, neural pathways. Energy particles can flow along them. Thickness = strength of connection. Color bleeds between connected nodes.

**Attention Signals:** Nodes that need attention get:
- Red pulse + exclamation indicator (overdue, blocked, draining)
- Haptic-style visual cue — a ring that expands outward like a ripple
- These draw the eye without being annoying

**Camera Behavior:**
- Default: orbit controls (rotate, zoom, pan the whole scene)
- Click node: smooth fly-to animation, depth-of-field blurs background, detail panel opens
- Back button: camera pulls back to overview

**Ambient Life:** The whole scene breathes. Slight floating motion on all nodes. Particle streams in background. Connections gently undulate. Nothing is static.

**Drill-Down: DECIDED — Stellaris-style HUD**

The interaction model is inspired by Stellaris (Paradox grand strategy). The 3D neural map is the "galaxy map." 2D HUD panels overlay it for actual management. The 3D scene is for orientation and emotional state. The HUD is where you work.

**UI Structure (always visible):**

```
┌─────────────────────────────────────────────────────────────────┐
│ TOP HUD BAR (always visible)                                    │
│ Cognitive Bandwidth ░░░░░░░░  Emotional Energy ░░░░░░  Satis-  │
│ 107/33 / 5/236              167/25              faction 3/20   │
│ Ideas: +228    Neural Network: 1/1    Active Projects: 51/47   │
├─────────────────────────────────────────┬───────────────────────┤
│                                         │ RIGHT SIDEBAR         │
│                                         │ (contextual)          │
│         3D NEURAL MAP                   │                       │
│         (main viewport)                 │ [Selected Node Info]  │
│                                         │ - Status              │
│    Rotate, zoom, click nodes            │ - Sub-nodes list      │
│    Camera flies to selected node        │ - Recent activity     │
│    Depth-of-field on focus              │ - Backlog summary     │
│                                         │ - Energy / Sentiment  │
│                                         │ - Quick actions       │
│                                         │                       │
│                                         │ [Kanban / Task List]  │
│                                         │ when drilled into a   │
│                                         │ trackable node        │
│                                         │                       │
├─────────────────────────────────────────┴───────────────────────┤
│ BOTTOM NAV BAR                                                  │
│ 🌌 Galaxy Map  🎯 Central Command  📊 Cog Report  💬 Intern   │
│                 Comm  🔄 Processes  🔬 Research  🧠 Conscious- │
│                                                        ness     │
└─────────────────────────────────────────────────────────────────┘
```

**Top HUD Bar — The Resource Economy (always visible):**

Three core resources, directly mapped from Stellaris:

| Resource | Stellaris Equivalent | What It Means | How It's Calculated |
|----------|---------------------|---------------|---------------------|
| **Cognitive Bandwidth** | Energy Credits | The currency of your brain. Every active node has an *upkeep cost*. Too many active nodes → bandwidth turns red → central brain dims/flickers. | Sum of active task counts across all nodes vs. your self-set capacity (e.g., 15 active items max). Ratio drives the bar. |
| **Emotional Resilience** | Minerals | Raw material needed to "build" new sub-nodes or take on new commitments. High stress drains this. | Composite of node sentiments (energizing nodes add, draining nodes subtract) + health log energy levels. |
| **Willpower / Focus** | Alloys | High-tier resource used to complete milestones, handle attention alerts, make big decisions. The expensive stuff. | Based on sleep, gym consistency, and how many "deep work" sessions logged this week. Regenerates with rest, depletes with context-switching. |

When Bandwidth is overloaded: the central brain visually flickers. When Resilience drops: node colors shift cooler. When Focus is depleted: milestone completion slows (items stay in-progress longer).

Additional metrics in the bar:
- Active projects count (with upkeep cost visible)
- Neural Network health (composite of all three resources)
- These update in real-time from node data

**Right Sidebar — Contextual Detail:**
- Nothing selected → shows "Now" priorities + today's focus
- Node selected → shows that node's full detail
- Drill into trackable node → Kanban/task list appears in sidebar
- Smooth transitions between states (framer-motion)

**Bottom Nav — View Modes (Stellaris-inspired):**
- **Galaxy Map** — the 3D neural view (default)
- **Central Command** — "Now" view: weekly priorities, today's top 3, active focus
- **Cognitive Report** — how you're doing: energy trends, satisfaction over time, attention distribution
- **Internal Comms** — activity log: recent updates, commits, milestones across all nodes
- **Processes** — running/in-progress items across all projects
- **Research** — Foundation/Learning node: skills, courses, reading
- **Consciousness** — Identity node: values, reflections, growth

**Zoom Levels (like Stellaris galaxy → system → planet):**
- **Level 1 — Galaxy:** All 8 branches visible, central brain, full neural network
- **Level 2 — System:** Zoomed into one branch (e.g., Business). See all child nodes (Zaasu, Dhi's, Street League, etc.) as a local cluster
- **Level 3 — Planet:** Zoomed into one project/area (e.g., Zaasu). Right sidebar shows full backlog, Kanban, status, recent commits, next actions

**Node Mechanics (Stellaris Planetary Management):**

Each node isn't just a label — it's a managed system with inputs, outputs, and state.

*Designation:* Every trackable node has a mode that defines its current purpose:
- **Deep Work** — high focus cost, high output. For sprints and deadlines.
- **Maintenance** — low bandwidth cost, steady output. For keeping things alive.
- **Creative Flow** — high emotional energy, medium bandwidth. For exploration and ideation.
- **Dormant** — near-zero cost. Paused but not dead. Ghost glow.

*Stability:* Each node has a stability score (derived from: backlog health, recency of activity, sentiment). When stability drops — messy backlog, overdue items, neglected too long — the node pulses red and demands a "Planetary Decision" (your attention). High stability = smooth glow, high output.

*Decisions (not static backlogs):* Opening a node at Level 3 (planet view) shows actionable decisions, not just a task list:
- **Clear Blockers** — like clearing "dangerous wildlife" in Stellaris. Resolve the thing that's stopping progress.
- **Sprint Edict** — temporarily boost a node's output by focusing hard on it. Costs Willpower/Focus. May temporarily reduce Emotional Resilience (burnout risk).
- **Delegate** — route work to someone else (brother-in-law for Zaasu, Viktor for Mart). Reduces your bandwidth cost.
- **Deprioritize** — consciously move node to Dormant. Honest acknowledgment, not neglect.

*Attention Alerts (Situation Log):* Instead of notifications, disruptions appear as visual events in the 3D space — a storm near a node, a pulse ripple, a color shift. You click to resolve. Unresolved alerts drain Emotional Resilience over time.

*Upkeep:* Every active node costs Cognitive Bandwidth. The more you have active, the thinner you're spread. This makes "saying no" visible — dropping a node to Dormant frees bandwidth for others. The resource bar literally recovers.

### Layer 2: The Engine (Data Feeds)
- Supabase DB as the central store
- **Automated feeds:**
  - Git hooks on Zaasu/Mart repos → push commit summaries + status to Supabase
  - Post-commit scripts that call the Life OS API
- **Manual feeds (for now, automate later):**
  - Health: log gym/diet (simple input, not a full tracker)
  - Family: milestones, events
  - Finances: periodic updates
  - Sentiment: quick "how does this feel right now" per node
- **n8n workflows** (home PC) can add automation layers later
- Each node schema: id, parent_id, name, type (trackable/reference), status, energy, sentiment, progress, last_updated, metadata (JSON), children

### Layer 3: The API (Tool Integration)
- Next.js API routes → REST endpoints
- **GET /api/context** → returns current priorities, active projects, recent activity (for Claude Code/OpenClaw bootstrap)
- **GET /api/node/:id** → returns full node with children, backlog items
- **POST /api/node/:id/update** → update status, sentiment, progress
- **POST /api/node/:id/items** → add backlog/task items to a node
- **GET /api/mindmap** → full graph data for 3D rendering
- Auth via API key for tool integrations (simple, private app)

---

## Data Model

### Top-Level Nodes (8 branches)

1. **Work** — KPS (Mart, Other Apps), past roles (GAC, AmEx, Fujitsu)
2. **Business** — Zaasu, Dhi's, Street League, EvolveviaAI, Courtyard Sports (future), JunoAtlas
3. **Life Events** — current (apartment, school, LinkedIn), past (marriage, Dhiya born, US→Dubai), future
4. **Family & Friends** — Amu, Dhiya, parents, Niveth, relatives, close/far friends
5. **Personal Journey** — finance (FIRE, IBKR, Gold, House), interests (Dota, Chess, Cars, Gadgets), health (gym, diet, badminton, journaling)
6. **Identity** — values, personality, mental models, motivations, growth & lessons
7. **Foundation** — education (Iowa State, NIT Trichy), AI skills, PM methods, tools, creative
8. **Now** — current week priorities, active focus, what needs attention today

### Node Types
- **Trackable**: has backlog items, progress %, tasks, status (e.g., Zaasu, Gym, Mart pilots)
- **Reference**: mostly static, updated rarely (e.g., values, education, family tree)
- **Event**: timestamped, one-time (e.g., Dhiya starts school, apartment rented)

### Supabase Tables (initial)
- `nodes` — id, parent_id, name, type, branch, status, energy (1-10), sentiment (draining/neutral/energizing), progress (0-100), distance_from_center (1-10), color, position_x/y/z (3D coords), designation (deep_work/maintenance/creative_flow/dormant), stability (1-100, computed from backlog health + recency + sentiment), bandwidth_cost (int, how much cognitive bandwidth this node consumes when active), last_updated, metadata (JSONB)
- `items` — id, node_id, title, description, status (todo/in_progress/done), priority, created_at, updated_at
- `activity_log` — id, node_id, action, source (manual/git_hook/api), message, timestamp
- `cosmic_events` — id, event_type (star_birth/supernova/collision/drift/growth/transfer/decision), node_id, related_node_id, description, visual_data (JSONB — animation params), event_date, created_at, decision_context (JSONB — nullable, for decision journal: alternatives considered, reasoning, sentiment at time)
- `snapshots` — id, snapshot_date, snapshot_type (weekly_auto/event_triggered/manual), full_state (JSONB — all node positions, energy, sentiment, connections), priorities, reflection_notes, trigger_event_id (nullable FK to cosmic_events)
- `health_logs` — id, date, gym (boolean), energy_level (1-10), sleep_hours (decimal), notes, created_at
- `people` — id, name, relationship, primary_node_id (FK to nodes — which node they orbit), orbit_distance (1-10, closer = more frequent interaction), last_interaction_date, interaction_frequency_days, metadata (JSONB)
- `interactions` — id, person_id (FK), type (call/meeting/message/hangout), notes, date, created_at
- `learning_log` — id, type (book/course/skill/certification/experiment), title, node_id (FK — which Foundation sub-node), status (in_progress/completed/abandoned), started_at, completed_at, notes
- `attention_log` — id, node_id (FK), date, minutes_spent, source (manual/inferred), created_at
- `seasonal_rhythms` — id, name (ramadan/school_year/q4_retail/etc), start_month, start_day, end_month, end_day, affected_node_ids (JSONB array), gravity_modifier (float — how much it pulls attention), visual_modifier (JSONB — ambient color shift, pace change), active (boolean)
- `edicts` — id, node_id (FK), edict_type (sprint/delegate/deprioritize/clear_blocker), started_at, expires_at (nullable), active (boolean), effect (JSONB — bandwidth_cost_modifier, focus_cost, resilience_drain), notes

### Cosmic Event Types
| Event Type | Meaning | Visual |
|-----------|---------|--------|
| `star_birth` | New node created (new project, new child, new interest) | Star ignition — bright flash, particles expanding outward, node fades in with growing glow |
| `supernova` | Node ending/dying (project shut down, leaving a job) | Bright expansion → fade to dim ember or ghost node. Particles scatter. |
| `collision` | Two areas merging or conflicting (work bleeds into personal, projects competing) | Two nodes drawn together, energy crackle between them, possible merge or bounce |
| `drift` | Node moving away from center (losing engagement, deprioritizing) | Slow outward movement, dimming, connection thinning |
| `growth` | Node expanding significantly (project scaling, family growing) | Node pulses larger, glow intensifies, sub-nodes spawn |
| `transfer` | Something moving between systems (skill from Foundation applied to Business, person moving between life areas) | Energy beam between two nodes, particle stream flowing from one to another |
| `orbit_shift` | Major life rebalancing (priorities reshuffling after January layoffs) | Multiple nodes reposition simultaneously, whole constellation restructures |
| `decision` | Major life decision logged with full context and alternatives | Decision diamond appears at node, golden pulse, context stored for time-travel review |

### Time Travel System (built into data model from day 1)
- `snapshots` table stores full universe state weekly (automated cron) + on every cosmic event
- Each snapshot captures: all node positions, sizes, energy, sentiment, connections, distance_from_center
- Timeline slider on the UI interpolates between snapshots for smooth animation
- Scrub back to any date → watch the constellation reshape
- **Important:** Start recording snapshots from deploy day even if the timeline UI comes later. Data accumulation is the bottleneck, not code.

---

## Existing Tools Being Replaced

### Trello (abandoned)
- Timed Effort Planner: tasks by time-to-complete. Mixed personal + work. Flat.
- Annual Life Goals: monthly columns. Nearly empty. Unused.
- **Verdict:** Doesn't match how Bharat thinks.

### XMind (static)
- Mind map of Bharat's full life. Good structure, but static — no live data, no progress, no sentiment.
- **Verdict:** Right shape, wrong medium. Life OS is this mind map, but alive.

---

## Build Phases

**Goal:** A living personal universe at life.YOUR_DOMAIN.com that Bharat opens every morning to orient himself — and can scrub back through time to see how his life evolved.

### Phase 1: The Living Universe (MVP — ~2 weeks)
- 3D neural map: 8 branch nodes + sub-nodes, force-directed, dark space environment
- Visual language: color per branch, glow/luminosity for energy, pulse for activity, sentiment colors
- Organic connections: curved tubes, particle flow along connections
- Post-processing: bloom, vignette, depth-of-field on zoom
- Ambient life: floating nodes, particle dust, undulating connections
- Stellaris HUD: top metrics bar, right contextual sidebar, bottom nav bar
- 3 zoom levels: galaxy → system → planet
- Right sidebar: node detail + Kanban/task list for trackable nodes
- CRUD on items (add, update, complete tasks within any node)
- "Now" / Central Command view: weekly priorities, today's focus
- Supabase DB: nodes, items, activity_log, cosmic_events, snapshots (all tables from day 1)
- Weekly snapshot cron (start recording state from deploy day)
- Auth (just Bharat)
- API endpoints for external tool integration
- Deployed on Vercel at stellaros.life
- Seeded with Bharat's actual data (all 8 branches from mind map)

### Phase 2: Time Travel + Cosmic Events (~1-2 weeks after MVP)
- Timeline slider UI (bottom of screen or integrated into HUD)
- Scrub back to any snapshot date — nodes reposition, resize, recolor smoothly
- Interpolation between snapshots for fluid animation
- Cosmic event recording: log star_birth, supernova, collision, drift, growth, transfer, orbit_shift
- Cosmic event animations: visual effects that play during time scrub or in real-time
- Event-triggered snapshots (auto-snapshot when cosmic event logged)
- "History mode" — replay your life's evolution like a timelapse
- Ghost nodes: dead/ended projects remain as dim embers in the map

### Phase 3: Tool Integration + Automation
- Git hooks: Zaasu/Mart commits auto-update activity_log and node status
- Claude Code bootstrap: pull context from /api/context at session start
- OpenClaw bootstrap: pull user profile + active context
- Cowork integration: read priorities at conversation start
- n8n workflows for additional automation

### Phase 4: Deeper Intelligence
- Cognitive Report view: energy trends over time, satisfaction graphs, attention distribution
- Sentiment tracking with historical charts
- Distance-from-center as draggable (pull nodes closer/further in real-time)
- Smart alerts: "You haven't engaged with Health in 8 days" (the gym problem)
- Cross-node pattern detection: "Business energy is draining Personal Journey"
- Mobile-optimized 3D controls
- Search across all nodes

### Phase 5: The Economy Layer
The financial dimension of the universe. Not a budgeting app — a visual resource flow system.

**Resource Flows (visible on the 3D map):**
- Salary (23k AED) = the central star of the financial system. Energy radiates outward monthly.
- Streams split visibly: family expenses (thick, steady), investments (medium, accumulating), venture costs (thin, variable)
- Each venture shows flow direction: outward (draining/investing) or inward (generating revenue)
- Flow color: red = draining, gold = generating, neutral = dormant
- When Zaasu gets its first paying user, the tube reverses color from red to gold. Visible in real-time.

**Financial HUD metrics (top bar addition):**
- Monthly cash flow (in vs out)
- Savings rate (% toward FIRE target)
- Venture burn rate (combined monthly cost of all side projects)
- Investment portfolio value (IBKR, Gold, House fund, other)
- FIRE progress: distance to financial freedom target

**FIRE Gravitational Field:**
- Financial freedom by 50 isn't a node — it's a region of space
- All investment nodes are pulled toward it
- The closer net worth gets to target, the brighter that region glows
- Visual progress toward the ultimate financial goal

**Venture Economics (per project):**
- Zaasu: hosting costs, time invested, revenue (once launched)
- Dhi's: supplier costs (Cochin), market stall fees, B2B revenue
- EvolveviaAI: minimal costs, 949 AED per client inflow
- Street League: 6 years, zero personal return — map shows this as thin, dim, long connection

**Data sources:**
- Manual entry initially (monthly income, expenses, investment balances)
- Future: bank API integration, spreadsheet import, accounting app connections
- Investment tracking: periodic manual updates (IBKR balance, gold value, property value)

**Time travel + economy:**
- Scrub back to any month and see: what was the cash flow? Where was money going? How have the flows changed?
- Watch ventures go from pure-drain to revenue-generating over time
- See lifestyle inflation or savings discipline trends

### Phase 6: The Living Dimensions (added March 10, 2026)

Six additional layers that transform Life OS from a project tracker into a full life simulator.

**1. Health & Energy Layer**
- Bharat's physical state is a node — gym, sleep, diet, energy levels
- When gym streak breaks, the Health node dims. When consistent, it pulses warm and steady.
- **Correlation visibility:** When gym drops → Dhiya plan drops → family adventures stop → three nodes dim simultaneously. The *cost of skipping* is visible across the constellation.
- Data: simple daily logs (gym Y/N, energy 1-10, sleep hours). Not a fitness app — a life signal.
- Health node glow directly affects the central brain's composite color. Can't fake "I'm doing well" when your body node is dark.

**2. Social Graph / Relationship Orbits**
- People orbit nodes based on interaction frequency
- Viktor orbits Mart closely. Brother-in-law orbits Zaasu. Amu orbits Family center.
- **Drift detection:** When you haven't talked to someone important in weeks, their orbit moves outward — visible drift, not a notification
- Key people: Amu, Dhiya, parents, Niveth, Viktor (Mart), brother-in-law (Zaasu), close friends, LinkedIn connections (during active networking), recruiters (during job search)
- People aren't nodes themselves — they're satellites orbiting the nodes they're connected to
- Interaction logging: manual (had coffee with X), or automated later (Slack/WhatsApp activity)

**3. Learning Velocity**
- Rate of learning, not just a reading list
- Books consumed per quarter, skills acquired, certifications earned, courses completed
- Foundation node grows denser as you learn. Stagnation = still, quiet node.
- Feeds into career positioning — visible proof of growth velocity over time
- Time travel shows: "6 months ago I was learning nothing. Then I started the AI stack and Foundation exploded."
- Sub-metrics: books/quarter, new skills/month, experiments run (OpenClaw tinkering counts)

**4. Decision Journal**
- Every big life decision logged as a cosmic event with full context
- "Decided to stay at KPS" / "Pivoted Zaasu pricing" / "Chose Vercel over Render" / "Moved Dhiya to new school"
- Each decision captures: what you decided, why, what alternatives you considered, how you felt
- Time travel killer feature: scrub back to a decision point and see the full context of *why* you chose that path
- No more "why did I do that again?" — the reasoning is preserved in the cosmic event log
- Stored in `cosmic_events` with event_type `decision` and metadata containing alternatives + reasoning

**5. Attention Heatmap over Time**
- Where did your hours actually go? Not guessed — tracked.
- The 3D map shows a literal heat trail — which nodes consumed attention this week/month/quarter
- You *think* you're balanced, but the heatmap shows 80% Mart, 2% Dhiya's plan. That visual slap is more powerful than any to-do list.
- Heat source: activity_log timestamps + manual focus logs
- Overlay mode: toggle heatmap on/off in the Galaxy Map view
- Time-aware: scrub the timeline and watch the heat shift across your constellation over months

**6. Seasonal Rhythms / Gravitational Fields**
- Ramadan, Dhiya's school calendar, UAE holidays, Mart's seasonal business cycles — these aren't events, they're gravitational fields that warp how the universe behaves
- During Ramadan: everything shifts pace. The entire constellation breathes differently.
- Before school starts (April 26): Dhiya's node pulses urgently — preparation gravity pulls attention
- Mart seasonal cycles: Q4 retail surge pulls Mart node to center, increases cognitive bandwidth consumption
- Implementation: `seasonal_rhythms` metadata on relevant nodes + time-based visual modifiers
- The universe literally looks different in December vs. June. Not just data changes — the ambient feel, the gravitational pulls, the urgency patterns all shift.

### Not Now (maybe never, maybe years)
- Sharing/collaboration features
- Multi-user / product features
- Calendar/Gmail integration
- Fitness app connections
- Bank API direct integration (start with manual entry)
- Public-facing anything
