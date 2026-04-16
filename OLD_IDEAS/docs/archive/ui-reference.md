# StellarOS — UI Reference Spec

**Purpose:** Visual and structural reference for the StellarOS front-end. Based on a Stellaris-inspired mockup (see mockup image in reference/). This is directional — capture the feel, layout, and information hierarchy. Exact styling will evolve during development.

**Design Language:** Stellaris grand strategy game UI transplanted into a neural/cognitive context. Dark space background, glowing elements, sci-fi HUD aesthetic, warm amber/orange primary, cool blue/cyan accents, red for alerts.

---

## Overall Layout (4 Zones)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ZONE 1: TOP HUD BAR (fixed, always visible)                        │
│  Resource economy + empire-level metrics                             │
├────────┬─────────────────────────────────────────┬───────────────────┤
│ ZONE 2 │  ZONE 3: MAIN VIEWPORT                  │  ZONE 4: RIGHT   │
│ LEFT   │  3D Neural/Galaxy Map                    │  SIDEBAR          │
│ TOOLS  │  (React Three Fiber canvas)              │  (contextual)     │
│ (icon  │                                          │                   │
│  bar)  │  Central Consciousness (brain/star)      │  Cognitive        │
│        │  Domain nodes orbiting                   │  Domains list     │
│        │  Connections, particles, alerts           │  Fleets/processes │
│        │  Sector labels, domain labels             │  Civilian ships   │
│        │                                          │                   │
├────────┴─────────────────────────────────────────┴───────────────────┤
│  ZONE 5: BOTTOM NAV BAR (fixed, always visible)                      │
│  View mode tabs                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Zone 1: Top HUD Bar

The top bar is the resource economy dashboard. Always visible. Shows the vital signs of Bharat's "empire."

### Left Section — Raw Resources (Stellaris-style icons + numbers)
In Stellaris, the top-left shows resource icons with current stockpile and monthly net. StellarOS does the same:

| Icon | Resource | Display Format | Color |
|------|----------|---------------|-------|
| Lightning bolt | Cognitive Bandwidth | `8462.15` (stockpile) `+76` (net/period) | Green when positive, red when deficit |
| Heart/droplet | Emotional Resilience | `4095` `+76` | Red icon, green/red net |
| Gear/hexagon | Willpower/Focus | `200` `+6` | Orange icon |
| Factory/alloy | Output/Progress | `2378` `+14` | Cyan icon |
| People icon | Active Commitments | `+22` | Teal |
| Atom/molecule | Growth Capacity | `+28` | Purple |
| Star | Satisfaction | `+38` | Yellow |
| Shield | Stability (composite) | `5/5` | Green |
| Ship | Active Processes | `1/1` | Blue |
| Flag (red) | Sprawl/Capacity | `51/47` (OVER CAPACITY — red) | Red when over, green when under |

**Key design notes:**
- Numbers should show stockpile + net flow (the `+76` next to the main number)
- Red text/glow when a resource is in deficit or over capacity
- The `51/47` pattern (current/max) is critical — it instantly shows "you're overcommitted"
- Icons should be small, sci-fi styled, monoline or glyph-based

### Center Section — Empire Identity Bar
Centered in the top bar:

```
STELLAR MIND
Cognitive Bandwidth: +107,357  ◇ 3,4/136
Emotional Energy: +147/25
Satisfaction: ▲ 2/20
Ideas: +228
Neural Network: +1/1
```

This is the "empire name" area in Stellaris. In StellarOS:
- **STELLAR MIND** = the empire name (or just "STELLAROS" or Bharat's name)
- Below it: key composite metrics with trends
- Cognitive Bandwidth shows current/max with growth rate
- Emotional Energy shows current/capacity
- Satisfaction shows trend direction (▲ up, ▼ down)
- Ideas = unprocessed anomalies/insights count
- Neural Network = system health (all connections functional)

---

## Zone 2: Left Tool Bar

Vertical icon bar on the far left. Quick-access tools and filters. In Stellaris this contains map mode toggles, search, notifications.

**StellarOS equivalent (top to bottom):**

| Icon | Function |
|------|----------|
| Government/brain icon | Empire overview (your profile, current state summary) |
| Contacts/people | Social graph / relationship view |
| Situation log (!) | Active situations — progressive challenges, alerts |
| Map modes | Toggle overlays: default, heatmap, economy, factions, relationships |
| Edicts | Active and available edicts (Sprint, Focus Lock, Deep Rest, etc.) |
| Factions | Internal tensions view — faction approval ratings |
| Traditions | Growth paths / ascension progress |
| Expansion planner | Sprawl overview, admin capacity |
| Settings/gear | App settings |

Each icon, when clicked, opens a panel overlaying the left portion of the main viewport (or expands the right sidebar with that context).

---

## Zone 3: Main Viewport (3D Canvas)

This is the heart of StellarOS. A full React Three Fiber canvas showing the neural galaxy.

### Central Element: The Consciousness
- A large, luminous **brain or abstract star form** at the center
- Label: **"THE CENTRAL CONSCIOUSNESS"** with subtitle **"SYSTEM: PSYCHE"**
- Warm orange/amber glow with neural pathway textures
- Pulsing based on overall system health
- This is the "capital system" in Stellaris terms

### Domain Nodes (Planets orbiting the central star)
Nodes orbit the central consciousness at varying distances. Each is labeled with its domain:

From the mockup:
- **DOMAIN: REASON** — with planet count, population-equivalent, labeled "1 | 10"
- **DOMAIN: EMOTION** — labeled "1 | 20"
- **DOMAIN: WILL** — labeled "2 | 5"
- **CREATIVE CORE** — lower area
- Additional planets/nodes: Brius V, Brius II, Sirius Prime, 3970-771, etc.

**In StellarOS terms, domains map to the 8 branches:**
- Work (Mart, KPS)
- Business (Zaasu, Dhi's, Street League, etc.)
- Life Events
- Family & Friends
- Personal Journey (health, finance, interests)
- Identity
- Foundation (learning, education)
- Now (current priorities)

Each domain node shows:
- Domain label (e.g., "DOMAIN: BUSINESS")
- Sub-node count (number of "planets" in that system)
- Key metric (e.g., active items count, stability score)
- Visual: glowing sphere with domain-specific color, size proportional to current importance

### Sub-nodes (Planets within domains)
When zoomed into a domain (Level 2 — System view), individual projects/areas appear as planets:
- Zaasu, Dhi's Accessories, Street League as planets orbiting the Business domain star
- Each planet has a type label (e.g., "Continental World" = trackable node, "Ocean World" = reference node)
- Planet names should be the actual project/area names, not Stellaris-style generated names

### Connections & Pathways
- **Neural relay connections** between domains — glowing lines with particle flow
- Thickness = strength of connection
- Color = nature (warm = healthy, cool = strained, red = conflict)
- The mockup shows "Construction Ship: Working on Neural Relays" — meaning connections are being built/strengthened
- Animated particles flowing along connections to show activity direction

### Alerts & Events (In-Scene)
- **"ALERT: CREATIVE BLOCKAGE"** — appears as a labeled warning near the affected domain
- Red/orange pulsing, attention-grabbing but not overwhelming
- These are the Situations from the mechanics mapping
- Click to open the situation detail in the right sidebar

### Fleets & Processes (In-Scene)
The mockup shows "Cognitive Armada" and "Civilian Processes" — these are active work streams:
- **Cognitive Armada / 1st Fleet** — represents your focused work stream. Active deep-work sessions. Shows strength (items in progress) and position (which node it's working on).
- **Science Ship: EUREKA** — represents exploration/learning. Currently investigating anomalies or doing research.
- **Construction Ships: Working on Neural Relays** — represents infrastructure work. Building connections, setting up automation, improving systems.

**In StellarOS terms:**
- "Fleets" = active work streams or focus sessions
- "Science Ships" = learning/exploration activities
- "Construction Ships" = system improvement tasks (automation, integration, infrastructure)
- These move between nodes visually, showing where work is happening

### Sector Management
Bottom of viewport shows: **"SECTOR MANAGEMENT: Managing Sector 01-MEMORY"**
- Sectors are groups of related nodes managed together
- This could represent the current "view context" — which sector of life you're managing right now

### Ambient Environment
- Deep space background — dark navy/black with subtle orange/amber nebula clouds
- Star field particles in background
- Subtle ambient glow around active areas
- Darker, quieter areas around dormant nodes
- Overall: warm, alive, breathing — not cold or sterile

---

## Zone 4: Right Sidebar

Contextual panel that changes based on what's selected. Always visible but content shifts.

### Default State (nothing selected): Empire Overview

**Cognitive Domains** section header with count:
```
▼ Cognitive Domains
├── Planets: 6
│   ├── Reason      [Sol]        Continental World
│   ├── Emotion     [Emtioo]     Continental World
│   ├── Will        [Procyon]    Ocean World
│   ├── Alpha Centauri Memory    Ocean World
│   ├── Manward Prime [Manward]  Ocean World
│   └── Hagawa Prime [Hagawa]    Ocean World
```

**In StellarOS:** This shows the 8 branch domains with their sub-node counts and types:
```
▼ Life Domains                               8
├── Work (Mart, KPS)                    [Active]     3 nodes
├── Business (Zaasu, Dhi's, SL)         [Active]     5 nodes
├── Life Events                         [Reference]  4 nodes
├── Family & Friends                    [Active]     6 nodes
├── Personal Journey                    [Active]     4 nodes
├── Identity                            [Reference]  3 nodes
├── Foundation                          [Active]     5 nodes
└── Now                                 [Focus]      3 items
```

**Active Work Streams** section:
```
▼ Cognitive Armada                           1
└── 1st Fleet    [Brius]    ↓51  +1498

▼ Civilian Processes                         5
├── Science Ship: EUREKA     [Eptraban]
├── Construction Ship        [Sirius]    Working on Neural Relays
├── Construction Ship        [Codia]     Working on Neural Relays
└── Science Ship             [Saiph]
```

**In StellarOS:**
```
▼ Active Focus                               1
└── Deep Work: Zaasu Bug Fixes    ↓12 items  +3 completed today

▼ Running Processes                          5
├── Learning: AI Foundations Course    [In Progress]
├── Building: Life OS Phase 1         [Sprint Edict Active]
├── Building: Zaasu iOS Build         [Blocked]
├── Exploring: OpenClaw Memory Arch   [Researching]
└── Maintaining: Dhi's Inventory      [Low Priority]
```

### Selected Node State
When a domain or sub-node is clicked:
- Node name, designation, stability score
- Sub-nodes list (if domain level)
- Backlog summary (if trackable)
- Kanban/task list (if at planet level)
- Resource contribution (what this node produces/consumes)
- Active situations affecting this node
- Recent activity log
- Quick actions: Change designation, Start sprint edict, Log activity

---

## Zone 5: Bottom Nav Bar

Tab bar for switching between major views. Always visible.

From the mockup:
```
◀ ▶ >>>  GALAXY MAP | CENTRAL COMMAND | COG. REPORT | INTERN. COMM. | DATA EXCHANGE | PROCESSES | RESEARCH | UNITY | CONSCIOUSNESS
```

**StellarOS tabs:**

| Tab | Stellaris Equivalent | What It Shows |
|-----|---------------------|---------------|
| **Galaxy Map** | Galaxy Map | Default 3D neural view. All domains visible. |
| **Central Command** | Empire Overview | "Now" view: today's priorities, weekly goals, active focus items. The operational dashboard. |
| **Cog. Report** | Species/Demographics | Cognitive report: resource trends over time, satisfaction graphs, attention distribution charts. 2D data visualization. |
| **Intern. Comm.** | Diplomacy | Activity log / internal comms: recent updates across all nodes, milestones hit, commits, logs from all sources. |
| **Data Exchange** | Trade/Market | Value flow view: where attention and resources are flowing, trade route health, piracy (context loss) indicators. |
| **Processes** | Fleet Manager | All running/in-progress work items across all nodes. Sprint status, blockers, completion rates. |
| **Research** | Technology | Foundation/Learning view: skill trees, tradition progress, current research, ascension path status. |
| **Unity** | Traditions | Growth path progress, ascension perks earned and available. |
| **Consciousness** | Factions | Identity view: values, reflections, faction tensions, internal alignment. |

Each tab switches the main viewport content. Galaxy Map shows the 3D scene. Other tabs can show 2D dashboards/panels that overlay or replace the 3D view (with a smooth transition).

---

## Color Palette

| Element | Color | Hex (approximate) |
|---------|-------|--------------------|
| Background (deep space) | Dark navy/black | `#0a0e1a` |
| Nebula glow | Warm amber/orange | `#c4641d` to `#e8963a` |
| Central brain/star | Bright orange/gold | `#ff9d2e` to `#ffc857` |
| Node glow (healthy) | Warm amber | `#e8963a` |
| Node glow (stressed) | Cool blue | `#4a9eff` |
| Node glow (critical) | Red | `#ff4444` |
| Alert labels | Red-orange on dark | `#ff6b35` on `#1a0a0a` |
| Connection lines | Orange-gold with glow | `#c4841d` with bloom |
| Particle dust | Faint amber/white | `#ffffff20` |
| HUD text | Light grey/white | `#e0e0e0` |
| HUD accent text | Cyan/teal | `#00e5ff` |
| Positive numbers | Green | `#4caf50` |
| Negative numbers | Red | `#f44336` |
| Sidebar background | Dark translucent | `#0d1117cc` |
| Sidebar headers | Amber | `#e8963a` |
| Tab bar background | Very dark | `#060a12` |
| Tab text (active) | White | `#ffffff` |
| Tab text (inactive) | Dim grey | `#666666` |

---

## Typography

- **HUD numbers:** Monospace or tech font (e.g., JetBrains Mono, Source Code Pro, or a sci-fi font like Orbitron for headers)
- **Labels:** Clean sans-serif (Inter, or match the tech font)
- **Domain labels in 3D:** drei `<Text>` or `<Html>` overlays with slight glow/bloom
- **Resource bar numbers:** Small, dense, information-rich. Don't waste space.
- **Sidebar text:** Regular weight, good contrast on dark background

---

## Interaction Patterns

| Action | Result |
|--------|--------|
| Hover over node | Node brightens, label appears, connection highlights |
| Click node (Level 1 → 2) | Camera flies to that domain. Sub-nodes appear. Right sidebar shows domain detail. |
| Click sub-node (Level 2 → 3) | Camera flies to planet. Right sidebar shows full backlog/Kanban. |
| Click empty space / Back button | Camera pulls back one level. |
| Scroll wheel | Zoom in/out (continuous, triggers level transitions at thresholds) |
| Right-click drag | Orbit camera around scene |
| Click bottom tab | Switch view mode (Galaxy Map → Central Command → etc.) |
| Click left tool icon | Open tool panel (situations, edicts, factions, etc.) |
| Click alert in scene | Open situation detail in sidebar |
| Hover resource in top bar | Tooltip showing production breakdown and consumption sources |

---

## Responsive Behavior

- **Desktop (primary):** Full layout as described. All 5 zones visible.
- **Tablet:** Right sidebar collapses to bottom sheet (swipe up). Left tool bar becomes bottom gesture area.
- **Mobile:** 3D viewport fills screen. Bottom nav remains. Tap node → full-screen detail panel. Top HUD bar simplified to 3 key metrics.

---

## Key Visual References

- Stellaris galaxy map (primary inspiration for layout and feel)
- The mockup image showing "STELLAR MIND" with brain center, domain nodes, cognitive armada, and full HUD
- Dark mode sci-fi dashboards (Eve Online, Elite Dangerous for ambient feel)
- Neural network visualizations for the organic/biological layer

---

*This document is the front-end reference. Combined with `stellaris-mechanics-mapping.md` (game mechanics) and `life-os-concept.md` (product spec), it provides full context for building the StellarOS UI.*
