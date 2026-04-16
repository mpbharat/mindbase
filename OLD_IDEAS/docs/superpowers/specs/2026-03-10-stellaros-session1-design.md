# StellarOS — Session 1 Design

**Date:** 2026-03-10
**Session:** 1 (first coding session)
**Phase:** Phase 1 — The Living Universe (MVP)

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Session 1 focus | 3D Scene First | Game feel is the soul of SOL. A beautiful breathing galaxy beats a feature-complete ugly one. |
| Session 1 scope | Galaxy + HUD chrome | Full Stellaris layout present from day 1 — top bar, left toolbar, right sidebar, bottom nav. Empty but styled. |
| Node positioning | d3-force-3d | Organic physics-based positioning. In the spec. Nodes cluster by connection strength. Never replaced later. |
| State management | Zustand | Canvas ↔ HUD bridge is SOL's core interaction pattern. Zustand is built for this. Works inside R3F's useFrame(). |
| Canvas/HUD structure | Split DOM | R3F canvas `position: fixed` z-0, HUD zones regular React z-10. Industry standard for production R3F apps. |
| Data source (Session 1) | Static `data/nodes.ts` | Hardcoded config mirroring future DB schema. DB and CRUD wired in Session 2. |
| DB / ORM | Neon + Drizzle | Decided in spec. Not touched in Session 1. |
| Auth | Decide in Session 2 | Single user. Not blocking Session 1. |

---

## Architecture

### Overall Structure

```
page.tsx (root)
├── GalaxyCanvas      ← R3F, position:fixed, z-0
├── TopHUD            ← regular React, z-10
├── LeftToolbar       ← regular React, z-10
├── RightSidebar      ← regular React, z-10
└── BottomNav         ← regular React, z-10
```

The canvas and HUD are siblings in the DOM. Zustand is the bridge — 3D interactions update the store, HUD components subscribe and re-render.

### File Structure

```
src/
  app/
    page.tsx             ← root layout, composes all zones
    layout.tsx           ← fonts, metadata
    globals.css
  components/
    canvas/
      GalaxyCanvas.tsx   ← R3F Canvas wrapper + postprocessing pipeline
      CentralNode.tsx    ← the brain/star at center
      DomainNode.tsx     ← reusable domain sphere (x8)
      NodeConnection.tsx ← TubeGeometry + CatmullRomCurve3
      ParticleDust.tsx   ← ambient background particles
      CameraController.tsx ← OrbitControls + fly-to animation
      ForceLayout.tsx    ← d3-force-3d simulation, updates node positions
    hud/
      TopHUD.tsx         ← resource bar (bandwidth, resilience, focus)
      LeftToolbar.tsx    ← icon buttons (no actions in Session 1)
      RightSidebar.tsx   ← contextual panel (domain list + node detail)
      BottomNav.tsx      ← view tabs (Galaxy Map active)
    shaders/
      NodeGlowMaterial.ts ← custom GLSL: pulse animation + glow
  store/
    useStore.ts          ← Zustand store (single file)
  data/
    nodes.ts             ← static node config for Session 1
  lib/
    forceSimulation.ts   ← d3-force-3d setup and tick loop
    resourceCalc.ts      ← bandwidth, resilience, focus formulas
```

### Zustand Store Shape

```typescript
interface StellarStore {
  // 3D scene state
  nodes: Node[]
  selectedNodeId: string | null
  zoomLevel: 1 | 2 | 3
  cameraTarget: Vector3 | null

  // HUD resource values (computed from nodes)
  cogBandwidth: { current: number; max: number }
  resilience: number
  focus: number

  // Actions
  selectNode: (id: string | null) => void
  setZoomLevel: (level: 1 | 2 | 3) => void
  setCameraTarget: (v: Vector3) => void
}
```

---

## Session 1 Deliverable

### 3D Galaxy

- Dark space background (`#0a0e1a`) with vignette post-processing
- Ambient particle dust (instanced meshes)
- Central Consciousness node — large glowing sphere, warm amber, custom GLSL pulse shader
- 8 domain nodes — colored spheres, d3-force-3d positioned, each with glow shader
- Organic connections — TubeGeometry + CatmullRomCurve3 (curved, not straight)
- Post-processing — Bloom (glow), Depth-of-Field (focus transitions), Vignette (space feel)
- Breathing animation — all nodes have slow float/pulse (useFrame)
- OrbitControls — rotate, zoom, pan
- Node hover — brightens, label appears
- Node click — camera flies to node, DoF blurs background, Zustand updates selectedNodeId

### HUD Chrome (Stellaris layout, empty but styled)

- **Top bar** — resource icons + numbers (bandwidth, resilience, focus, active commitments, stability)
- **Left toolbar** — vertical icon strip (government, contacts, situations, edicts, factions — no actions yet)
- **Right sidebar** — default state shows domain list; node selected shows domain name, type, placeholder sub-nodes
- **Bottom nav** — tabs: Galaxy Map (active), Central Command, Cog. Report, Processes, Research, Consciousness
- Stellaris color palette applied throughout (see `docs/ui-reference.md`)
- framer-motion transitions on sidebar state changes

### Static Data (`data/nodes.ts`)

8 domain nodes seeded with real Bharat data:
- Work (color: blue, energy: 7, sentiment: neutral)
- Business (color: amber, energy: 9, sentiment: energizing)
- Life Events (color: teal, energy: 5, sentiment: neutral)
- Family & Friends (color: green, energy: 8, sentiment: energizing)
- Personal Journey (color: pink, energy: 6, sentiment: neutral)
- Identity (color: purple, energy: 7, sentiment: energizing)
- Foundation (color: cyan, energy: 8, sentiment: energizing)
- Now (color: gold, energy: 9, sentiment: energizing)

Each node has: id, name, color, energy (1-10), sentiment, bandwidthCost, designation, stability, position (set by d3-force-3d).

---

## NOT in Session 1

- Database / Neon connection
- Drizzle ORM / migrations
- API routes (CRUD)
- Auth
- Kanban / task list in sidebar
- Zoom levels 2 and 3 (system/planet view)
- Particle flow along connections
- Central Command view
- Real data seeding

---

## End-of-Session Vibe Check

Open localhost:3000. A dark galaxy loads. 8 glowing domain nodes breathe and orbit a warm central consciousness. Rotate the scene with the mouse. Click "BUSINESS" — camera flies in, depth-of-field blurs the background, the right sidebar shows the Business domain. The top bar shows resource numbers. It feels like Stellaris. No real data yet — but the soul is there.
