# StellarOS Session 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a breathing 3D galaxy with 8 glowing domain nodes, organic connections, post-processing bloom/DoF/vignette, and a Stellaris-style HUD chrome — all wired through Zustand state with static seed data.

**Architecture:** R3F canvas fills the viewport (`position:fixed`, z-0), Stellaris HUD zones (top bar, left toolbar, right sidebar, bottom nav) are regular React DOM on top (z-10). Zustand bridges them — clicks in the 3D scene update the store, HUD components subscribe and re-render. Domain nodes are positioned by a pre-computed d3-force-3d simulation. Data is static TypeScript config for this session; DB wired in Session 2.

**Tech Stack:** Next.js 14+ (App Router), React Three Fiber, @react-three/drei, @react-three/postprocessing, Three.js, d3-force-3d, Zustand, Tailwind CSS, framer-motion, Vitest

---

## Chunk 1: Foundation

### Task 1: Initialize Project

**Files:**
- Create: `stellaros/` (project root via create-next-app)
- Create: `vitest.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd ~//Documents/Claude/StellarOS
npx create-next-app@latest stellaros \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
cd stellaros
```

- [ ] **Step 2: Install 3D + state dependencies**

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install d3-force-3d zustand framer-motion
npm install @types/three
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 5: Create test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 7: Add .superpowers to .gitignore**

Append to `.gitignore`:

```
# Superpowers brainstorm sessions
.superpowers/
```

- [ ] **Step 8: Verify project boots**

```bash
npm run dev
```

Expected: Next.js dev server starts at `http://localhost:3000`. No errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: initialize stellaros project with R3F, Zustand, Vitest"
```

---

### Task 2: Static Node Data

**Files:**
- Create: `src/data/nodes.ts`
- Create: `src/types/nodes.ts`
- Create: `src/test/data/nodes.test.ts`

- [ ] **Step 1: Define node types**

Create `src/types/nodes.ts`:

```ts
export type Sentiment = 'energizing' | 'neutral' | 'draining'
export type Designation = 'deep_work' | 'maintenance' | 'creative_flow' | 'dormant'
export type NodeType = 'trackable' | 'reference' | 'event'

export interface DomainNode {
  id: string
  name: string
  type: NodeType
  color: string          // hex color for this domain
  energy: number         // 1-10
  sentiment: Sentiment
  bandwidthCost: number  // cognitive bandwidth units consumed
  designation: Designation
  stability: number      // 1-100
  description: string
  // Set by force simulation at runtime
  x?: number
  y?: number
  z?: number
}

export interface SubNode {
  id: string
  parentId: string
  name: string
  type: NodeType
  color?: string         // inherits parent if not set
  status: 'active' | 'dormant' | 'blocked'
}
```

- [ ] **Step 2: Write failing test for node data**

Create `src/test/data/nodes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { DOMAIN_NODES } from '@/data/nodes'

describe('DOMAIN_NODES', () => {
  it('has exactly 8 top-level domain nodes', () => {
    expect(DOMAIN_NODES).toHaveLength(8)
  })

  it('all nodes have valid energy between 1 and 10', () => {
    DOMAIN_NODES.forEach(node => {
      expect(node.energy).toBeGreaterThanOrEqual(1)
      expect(node.energy).toBeLessThanOrEqual(10)
    })
  })

  it('all nodes have valid stability between 1 and 100', () => {
    DOMAIN_NODES.forEach(node => {
      expect(node.stability).toBeGreaterThanOrEqual(1)
      expect(node.stability).toBeLessThanOrEqual(100)
    })
  })

  it('all nodes have unique ids', () => {
    const ids = DOMAIN_NODES.map(n => n.id)
    expect(new Set(ids).size).toBe(8)
  })

  it('all nodes have a valid hex color', () => {
    DOMAIN_NODES.forEach(node => {
      expect(node.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('all nodes have valid sentiment', () => {
    const valid = ['energizing', 'neutral', 'draining']
    DOMAIN_NODES.forEach(node => {
      expect(valid).toContain(node.sentiment)
    })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- nodes.test.ts
```

Expected: FAIL — `Cannot find module '@/data/nodes'`

- [ ] **Step 4: Create static node data**

Create `src/data/nodes.ts`:

```ts
import type { DomainNode } from '@/types/nodes'

export const DOMAIN_NODES: DomainNode[] = [
  {
    id: 'work',
    name: 'Work',
    type: 'trackable',
    color: '#4a9eff',
    energy: 7,
    sentiment: 'neutral',
    bandwidthCost: 8,
    designation: 'maintenance',
    stability: 72,
    description: 'KPS (Mart, Other Apps), past roles (GAC, AmEx, Fujitsu)',
  },
  {
    id: 'business',
    name: 'Business',
    type: 'trackable',
    color: '#e8963a',
    energy: 9,
    sentiment: 'energizing',
    bandwidthCost: 12,
    designation: 'deep_work',
    stability: 65,
    description: 'Zaasu, Dhi\'s, Street League, EvolveviaAI, JunoAtlas',
  },
  {
    id: 'life-events',
    name: 'Life Events',
    type: 'reference',
    color: '#22d3ee',
    energy: 5,
    sentiment: 'neutral',
    bandwidthCost: 2,
    designation: 'maintenance',
    stability: 88,
    description: 'Apartment, school, LinkedIn, major milestones',
  },
  {
    id: 'family',
    name: 'Family & Friends',
    type: 'trackable',
    color: '#4ade80',
    energy: 8,
    sentiment: 'energizing',
    bandwidthCost: 6,
    designation: 'maintenance',
    stability: 80,
    description: 'Amu, Dhiya, parents, Niveth, close friends',
  },
  {
    id: 'personal',
    name: 'Personal Journey',
    type: 'trackable',
    color: '#f472b6',
    energy: 6,
    sentiment: 'neutral',
    bandwidthCost: 5,
    designation: 'maintenance',
    stability: 58,
    description: 'Finance (FIRE, IBKR), health (gym, diet), interests (Dota, Chess)',
  },
  {
    id: 'identity',
    name: 'Identity',
    type: 'reference',
    color: '#a855f7',
    energy: 7,
    sentiment: 'energizing',
    bandwidthCost: 1,
    designation: 'creative_flow',
    stability: 90,
    description: 'Values, personality, mental models, motivations, growth',
  },
  {
    id: 'foundation',
    name: 'Foundation',
    type: 'trackable',
    color: '#38bdf8',
    energy: 8,
    sentiment: 'energizing',
    bandwidthCost: 4,
    designation: 'creative_flow',
    stability: 85,
    description: 'Education (Iowa State, NIT Trichy), AI skills, PM methods, tools',
  },
  {
    id: 'now',
    name: 'Now',
    type: 'trackable',
    color: '#fbbf24',
    energy: 9,
    sentiment: 'energizing',
    bandwidthCost: 10,
    designation: 'deep_work',
    stability: 70,
    description: 'Current week priorities, active focus, what needs attention today',
  },
]

export const TOTAL_BANDWIDTH_MAX = 50
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- nodes.test.ts
```

Expected: PASS — all 6 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/data/nodes.ts src/types/nodes.ts src/test/data/nodes.test.ts
git commit -m "feat: add static domain node data and types"
```

---

### Task 3: Zustand Store

**Files:**
- Create: `src/store/useStore.ts`
- Create: `src/test/store/useStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `src/test/store/useStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStore } from '@/store/useStore'

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      selectedNodeId: null,
      zoomLevel: 1,
      cameraTarget: null,
    })
  })

  it('starts with no selected node', () => {
    const { result } = renderHook(() => useStore())
    expect(result.current.selectedNodeId).toBeNull()
  })

  it('starts at zoom level 1', () => {
    const { result } = renderHook(() => useStore())
    expect(result.current.zoomLevel).toBe(1)
  })

  it('selectNode updates selectedNodeId', () => {
    const { result } = renderHook(() => useStore())
    act(() => result.current.selectNode('business'))
    expect(result.current.selectedNodeId).toBe('business')
  })

  it('selectNode with null clears selection', () => {
    const { result } = renderHook(() => useStore())
    act(() => result.current.selectNode('business'))
    act(() => result.current.selectNode(null))
    expect(result.current.selectedNodeId).toBeNull()
  })

  it('setZoomLevel updates zoom level', () => {
    const { result } = renderHook(() => useStore())
    act(() => result.current.setZoomLevel(2))
    expect(result.current.zoomLevel).toBe(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- useStore.test.ts
```

Expected: FAIL — `Cannot find module '@/store/useStore'`

- [ ] **Step 3: Create the Zustand store**

Create `src/store/useStore.ts`:

```ts
import { create } from 'zustand'
import type { DomainNode } from '@/types/nodes'

interface Vector3Like {
  x: number
  y: number
  z: number
}

interface Resources {
  cogBandwidth: { current: number; max: number }
  resilience: number    // 0-100
  focus: number         // 0-100
}

interface StellarStore extends Resources {
  // Scene data
  nodes: DomainNode[]

  // Camera / interaction
  selectedNodeId: string | null
  hoveredNodeId: string | null
  zoomLevel: 1 | 2 | 3
  cameraTarget: Vector3Like | null

  // Actions
  setNodes: (nodes: DomainNode[]) => void
  selectNode: (id: string | null) => void
  hoverNode: (id: string | null) => void
  setZoomLevel: (level: 1 | 2 | 3) => void
  setCameraTarget: (v: Vector3Like | null) => void
  setResources: (r: Partial<Resources>) => void
}

export const useStore = create<StellarStore>((set) => ({
  // Scene data
  nodes: [],

  // Camera / interaction
  selectedNodeId: null,
  hoveredNodeId: null,
  zoomLevel: 1,
  cameraTarget: null,

  // Resources (defaults — updated after nodes load)
  cogBandwidth: { current: 0, max: 50 },
  resilience: 75,
  focus: 60,

  // Actions
  setNodes: (nodes) => set({ nodes }),
  selectNode: (id) => set({ selectedNodeId: id }),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setCameraTarget: (v) => set({ cameraTarget: v }),
  setResources: (r) => set((state) => ({
    cogBandwidth: r.cogBandwidth ?? state.cogBandwidth,
    resilience: r.resilience ?? state.resilience,
    focus: r.focus ?? state.focus,
  })),
}))
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- useStore.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/store/useStore.ts src/test/store/useStore.test.ts
git commit -m "feat: add Zustand store with node, camera, resource state"
```

---

### Task 4: Resource Calculations

**Files:**
- Create: `src/lib/resourceCalc.ts`
- Create: `src/test/lib/resourceCalc.test.ts`

- [ ] **Step 1: Write failing resource tests**

Create `src/test/lib/resourceCalc.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  calcCogBandwidth,
  calcResilience,
  calcFocus,
} from '@/lib/resourceCalc'
import type { DomainNode } from '@/types/nodes'

const makeNode = (overrides: Partial<DomainNode>): DomainNode => ({
  id: 'test',
  name: 'Test',
  type: 'trackable',
  color: '#ffffff',
  energy: 7,
  sentiment: 'neutral',
  bandwidthCost: 5,
  designation: 'maintenance',
  stability: 80,
  description: '',
  ...overrides,
})

describe('calcCogBandwidth', () => {
  it('sums bandwidthCost across all nodes', () => {
    const nodes = [makeNode({ bandwidthCost: 8 }), makeNode({ bandwidthCost: 12 })]
    const result = calcCogBandwidth(nodes, 50)
    expect(result.current).toBe(20)
    expect(result.max).toBe(50)
  })

  it('returns zero when no nodes', () => {
    expect(calcCogBandwidth([], 50).current).toBe(0)
  })

  it('flags overCapacity when current exceeds max', () => {
    const nodes = [makeNode({ bandwidthCost: 30 }), makeNode({ bandwidthCost: 25 })]
    const result = calcCogBandwidth(nodes, 50)
    expect(result.overCapacity).toBe(true)
  })
})

describe('calcResilience', () => {
  it('energizing nodes increase resilience', () => {
    const nodes = [makeNode({ sentiment: 'energizing', energy: 9 })]
    expect(calcResilience(nodes)).toBeGreaterThan(50)
  })

  it('draining nodes decrease resilience', () => {
    const nodes = [
      makeNode({ sentiment: 'draining', energy: 2 }),
      makeNode({ sentiment: 'draining', energy: 2 }),
    ]
    expect(calcResilience(nodes)).toBeLessThan(50)
  })

  it('returns value between 0 and 100', () => {
    const nodes = [makeNode({ sentiment: 'energizing', energy: 10 })]
    const val = calcResilience(nodes)
    expect(val).toBeGreaterThanOrEqual(0)
    expect(val).toBeLessThanOrEqual(100)
  })
})

describe('calcFocus', () => {
  it('nodes in deep_work designation cost focus', () => {
    const highFocus = [makeNode({ designation: 'maintenance' })]
    const lowFocus = [makeNode({ designation: 'deep_work' }), makeNode({ designation: 'deep_work' })]
    expect(calcFocus(highFocus)).toBeGreaterThan(calcFocus(lowFocus))
  })

  it('returns value between 0 and 100', () => {
    const nodes = [makeNode()]
    const val = calcFocus(nodes)
    expect(val).toBeGreaterThanOrEqual(0)
    expect(val).toBeLessThanOrEqual(100)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- resourceCalc.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/resourceCalc'`

- [ ] **Step 3: Implement resource calculations**

Create `src/lib/resourceCalc.ts`:

```ts
import type { DomainNode } from '@/types/nodes'
import { TOTAL_BANDWIDTH_MAX } from '@/data/nodes'

export function calcCogBandwidth(nodes: DomainNode[], max = TOTAL_BANDWIDTH_MAX) {
  const current = nodes.reduce((acc, n) => acc + n.bandwidthCost, 0)
  return {
    current,
    max,
    overCapacity: current > max,
  }
}

export function calcResilience(nodes: DomainNode[]): number {
  if (nodes.length === 0) return 75

  const sentimentScore = nodes.reduce((acc, n) => {
    const multiplier = n.sentiment === 'energizing' ? 1
      : n.sentiment === 'draining' ? -1
      : 0
    return acc + (n.energy / 10) * multiplier
  }, 0)

  // Normalize to 0-100, centered at 50
  const normalized = 50 + (sentimentScore / nodes.length) * 50
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

export function calcFocus(nodes: DomainNode[]): number {
  if (nodes.length === 0) return 80

  const deepWorkCount = nodes.filter(n => n.designation === 'deep_work').length
  const contextSwitchPenalty = deepWorkCount * 8

  const focus = 100 - contextSwitchPenalty
  return Math.max(0, Math.min(100, focus))
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- resourceCalc.test.ts
```

Expected: PASS — all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/resourceCalc.ts src/test/lib/resourceCalc.test.ts
git commit -m "feat: add resource calculation formulas with tests"
```

---

## Chunk 2: 3D Canvas Foundation

### Task 5: Force Simulation

**Files:**
- Create: `src/lib/forceSimulation.ts`
- Create: `src/types/d3-force-3d.d.ts`
- Create: `src/test/lib/forceSimulation.test.ts`

- [ ] **Step 1: Create d3-force-3d type declarations**

Create `src/types/d3-force-3d.d.ts`:

```ts
declare module 'd3-force-3d' {
  export interface SimulationNode {
    id?: string
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    fx?: number | null
    fy?: number | null
    fz?: number | null
    index?: number
  }

  export interface SimulationLink<N extends SimulationNode = SimulationNode> {
    source: string | N
    target: string | N
    index?: number
  }

  export interface Simulation<N extends SimulationNode> {
    nodes(): N[]
    nodes(nodes: N[]): this
    alpha(): number
    alpha(alpha: number): this
    alphaMin(alpha: number): this
    alphaDecay(decay: number): this
    force(name: string): any
    force(name: string, force: any): this
    tick(iterations?: number): this
    stop(): this
    restart(): this
    on(typenames: string, listener: (this: this) => void): this
  }

  export interface ForceManyBody<N extends SimulationNode> {
    strength(): number
    strength(strength: number): this
  }

  export interface ForceLink<N extends SimulationNode> {
    links(): SimulationLink<N>[]
    links(links: SimulationLink<N>[]): this
    id(fn: (d: N) => string): this
    distance(d: number): this
  }

  export function forceSimulation<N extends SimulationNode>(
    nodes?: N[],
    numDimensions?: number
  ): Simulation<N>

  export function forceCenter<N extends SimulationNode>(
    x?: number, y?: number, z?: number
  ): any

  export function forceManyBody<N extends SimulationNode>(): ForceManyBody<N>

  export function forceLink<N extends SimulationNode>(
    links?: SimulationLink<N>[]
  ): ForceLink<N>
}
```

- [ ] **Step 2: Write failing force simulation test**

Create `src/test/lib/forceSimulation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { runForceSimulation } from '@/lib/forceSimulation'
import { DOMAIN_NODES } from '@/data/nodes'

describe('runForceSimulation', () => {
  it('assigns x, y, z to all nodes', () => {
    const result = runForceSimulation(DOMAIN_NODES)
    result.forEach(node => {
      expect(typeof node.x).toBe('number')
      expect(typeof node.y).toBe('number')
      expect(typeof node.z).toBe('number')
    })
  })

  it('returns the same count of nodes as input', () => {
    const result = runForceSimulation(DOMAIN_NODES)
    expect(result).toHaveLength(DOMAIN_NODES.length)
  })

  it('nodes are spread out — not all at origin', () => {
    const result = runForceSimulation(DOMAIN_NODES)
    const allAtOrigin = result.every(n => n.x === 0 && n.y === 0 && n.z === 0)
    expect(allAtOrigin).toBe(false)
  })

  it('central node (id=consciousness) is NOT in the returned array', () => {
    const result = runForceSimulation(DOMAIN_NODES)
    const central = result.find(n => n.id === 'consciousness')
    expect(central).toBeUndefined()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- forceSimulation.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/forceSimulation'`

- [ ] **Step 4: Implement force simulation**

Create `src/lib/forceSimulation.ts`:

```ts
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceLink,
} from 'd3-force-3d'
import type { DomainNode } from '@/types/nodes'

interface SimNode extends DomainNode {
  x: number
  y: number
  z: number
}

// Central consciousness node (not in DOMAIN_NODES — rendered separately)
const CENTRAL_ID = 'consciousness'

export function runForceSimulation(domainNodes: DomainNode[]): SimNode[] {
  // Add central node as a fixed anchor
  const centralNode: SimNode = {
    id: CENTRAL_ID,
    name: 'The Central Consciousness',
    type: 'reference',
    color: '#ff9d2e',
    energy: 10,
    sentiment: 'energizing',
    bandwidthCost: 0,
    designation: 'deep_work',
    stability: 100,
    description: 'The central consciousness',
    x: 0, y: 0, z: 0,
  }

  const allNodes: SimNode[] = [
    centralNode,
    ...domainNodes.map(n => ({ ...n, x: 0, y: 0, z: 0 })),
  ]

  // Links from each domain node to the central consciousness
  const links = domainNodes.map(n => ({
    source: n.id,
    target: CENTRAL_ID,
  }))

  const sim = forceSimulation(allNodes, 3)
    .force('center', forceCenter(0, 0, 0))
    .force('charge', forceManyBody().strength(-400))
    .force('link',
      forceLink(links)
        .id((d: SimNode) => d.id)
        .distance(80)
    )
    .stop()

  // Fix central node at origin
  centralNode.fx = 0
  centralNode.fy = 0
  centralNode.fz = 0

  // Run synchronously for 300 ticks
  for (let i = 0; i < 300; i++) sim.tick()

  // Return only domain nodes (central rendered separately via CentralNode component)
  return allNodes.filter(n => n.id !== CENTRAL_ID) as SimNode[]
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- forceSimulation.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/forceSimulation.ts src/types/d3-force-3d.d.ts src/test/lib/forceSimulation.test.ts
git commit -m "feat: add d3-force-3d simulation for organic node positioning"
```

---

### Task 6: Galaxy Canvas Wrapper

**Files:**
- Create: `src/components/canvas/GalaxyCanvas.tsx`

- [ ] **Step 1: Create GalaxyCanvas with postprocessing pipeline**

Create `src/components/canvas/GalaxyCanvas.tsx`:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { CentralNode } from './CentralNode'
import { DomainNodesGroup } from './DomainNodesGroup'
import { ParticleDust } from './ParticleDust'
import { CameraController } from './CameraController'

export function GalaxyCanvas() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
      }}
      camera={{ position: [0, 0, 200], fov: 60, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Ambient lighting — very dim, 3D scene mostly self-lit via shaders */}
      <ambientLight intensity={0.05} />

      <Suspense fallback={null}>
        <CentralNode />
        <DomainNodesGroup />
        <ParticleDust />
        <CameraController />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={2}
        />
        <Vignette
          offset={0.3}
          darkness={0.8}
        />
      </EffectComposer>
    </Canvas>
  )
}
```

- [ ] **Step 2: Note on TypeScript at this stage**

`GalaxyCanvas` imports components that don't exist yet (`CentralNode`, `DomainNodesGroup`, `ParticleDust`, `CameraController`). TypeScript will error on those imports until Tasks 7-11 are complete. **Do not run `tsc --noEmit` until Task 17 Step 6** — the full TypeScript check is deferred until all components exist.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/GalaxyCanvas.tsx
git commit -m "feat: add GalaxyCanvas with R3F postprocessing pipeline"
```

---

### Task 7: Particle Dust

**Files:**
- Create: `src/components/canvas/ParticleDust.tsx`

- [ ] **Step 1: Create particle dust component**

Create `src/components/canvas/ParticleDust.tsx`:

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 2000

export function ParticleDust() {
  const meshRef = useRef<THREE.Points>(null)

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles in a large sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 100 + Math.random() * 400

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Warm amber/white tint
      const warmth = 0.6 + Math.random() * 0.4
      colors[i * 3] = warmth         // R
      colors[i * 3 + 1] = warmth * 0.8 // G
      colors[i * 3 + 2] = warmth * 0.5  // B
    }

    return [positions, colors]
  }, [])

  // Very slow rotation — makes the starfield feel alive
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.005
      meshRef.current.rotation.x += delta * 0.002
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/ParticleDust.tsx
git commit -m "feat: add ambient particle dust to galaxy canvas"
```

---

### Task 8: Camera Controller

**Files:**
- Create: `src/components/canvas/CameraController.tsx`

- [ ] **Step 1: Create camera controller with fly-to support**

Create `src/components/canvas/CameraController.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useStore } from '@/store/useStore'

export function CameraController() {
  const controlsRef = useRef<CameraControls>(null)
  const { selectedNodeId, nodes, zoomLevel } = useStore()

  useEffect(() => {
    if (!controlsRef.current) return

    if (selectedNodeId === null) {
      // Return to galaxy overview
      controlsRef.current.setLookAt(
        0, 0, 200,   // camera position
        0, 0, 0,     // target
        true         // animate
      )
      return
    }

    const node = nodes.find(n => n.id === selectedNodeId)
    if (!node || node.x === undefined || node.y === undefined || node.z === undefined) return

    // Fly to node — position camera 40 units in front
    controlsRef.current.setLookAt(
      node.x + 40, node.y + 20, node.z + 40,
      node.x, node.y, node.z,
      true // animate
    )
  }, [selectedNodeId, nodes])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={30}
      maxDistance={500}
      dampingFactor={0.05}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/CameraController.tsx
git commit -m "feat: add camera controller with smooth fly-to on node select"
```

---

## Chunk 3: Nodes, Shaders, Connections

### Task 9: Node Glow Shader Material

**Files:**
- Create: `src/components/shaders/NodeGlowMaterial.ts`

- [ ] **Step 1: Create custom GLSL glow shader**

Create `src/components/shaders/NodeGlowMaterial.ts`:

```ts
import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uEnergy;
  uniform float uPulseSpeed;
  uniform float uSelected;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = dot(vNormal, viewDir);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 1.8);

    // Pulse breathing
    float pulse = sin(uTime * uPulseSpeed) * 0.12 + 0.88;

    // Selected node brightens
    float selectionBoost = 1.0 + uSelected * 0.6;

    // Energy affects overall brightness
    float energyFactor = uEnergy / 10.0;

    float alpha = fresnel * pulse * selectionBoost;
    vec3 color = uColor * fresnel * pulse * selectionBoost * (0.6 + energyFactor * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`

export const NodeGlowMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#e8963a'),
    uEnergy: 7.0,
    uPulseSpeed: 1.0,
    uSelected: 0.0,
  },
  vertexShader,
  fragmentShader
)

// Register with R3F so <nodeGlowMaterial> JSX works
extend({ NodeGlowMaterial })

// TypeScript declaration for JSX (React 18+ requires module augmentation, not global JSX)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      nodeGlowMaterial: any
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shaders/NodeGlowMaterial.ts
git commit -m "feat: add GLSL node glow shader with Fresnel + pulse animation"
```

---

### Task 10: Central Node

**Files:**
- Create: `src/components/canvas/CentralNode.tsx`

- [ ] **Step 1: Create central consciousness node**

Create `src/components/canvas/CentralNode.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import '@/components/shaders/NodeGlowMaterial'

export function CentralNode() {
  const glowRef = useRef<any>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.uTime = clock.getElapsedTime()
    }
    // Gentle floating
    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 1.2
    }
  })

  return (
    <group>
      {/* Outer glow shell — larger, transparent */}
      <Sphere args={[14, 32, 32]} ref={coreRef}>
        <nodeGlowMaterial
          ref={glowRef}
          uColor={new THREE.Color('#ff9d2e')}
          uEnergy={10}
          uPulseSpeed={0.6}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Inner solid core */}
      <Sphere args={[6, 32, 32]}>
        <meshStandardMaterial
          color="#ffc857"
          emissive="#ff9d2e"
          emissiveIntensity={3}
          roughness={0.1}
          metalness={0.2}
        />
      </Sphere>

      {/* Label */}
      <Text
        position={[0, -18, 0]}
        fontSize={3}
        color="#e8963a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        font="/fonts/Orbitron-Regular.woff"
      >
        THE CENTRAL CONSCIOUSNESS
      </Text>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/CentralNode.tsx
git commit -m "feat: add central consciousness node with glow shader"
```

---

### Task 11: Domain Nodes Group

**Files:**
- Create: `src/components/canvas/DomainNode.tsx`
- Create: `src/components/canvas/DomainNodesGroup.tsx`

- [ ] **Step 1: Create single DomainNode component**

Create `src/components/canvas/DomainNode.tsx`:

```tsx
'use client'

import { useRef, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { Text, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import '@/components/shaders/NodeGlowMaterial'
import type { DomainNode as DomainNodeType } from '@/types/nodes'

interface DomainNodeProps {
  node: DomainNodeType & { x: number; y: number; z: number }
}

export function DomainNode({ node }: DomainNodeProps) {
  const glowRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const floatOffset = useRef(Math.random() * Math.PI * 2)

  const { selectedNodeId, hoveredNodeId, selectNode, hoverNode } = useStore()
  const isSelected = selectedNodeId === node.id
  const isHovered = hoveredNodeId === node.id

  const color = new THREE.Color(node.color)
  const nodeSize = 4 + (node.energy / 10) * 4 // 4-8 units based on energy
  const pulseSpeed = 0.5 + (node.energy / 10) * 0.8

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (glowRef.current) {
      glowRef.current.uTime = t
      glowRef.current.uSelected = isSelected || isHovered ? 1.0 : 0.0
    }
    // Gentle individual floating — each node has its own phase offset
    if (groupRef.current) {
      groupRef.current.position.y =
        node.y + Math.sin(t * 0.3 + floatOffset.current) * 2
    }
  })

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectNode(isSelected ? null : node.id)
  }, [isSelected, node.id, selectNode])

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hoverNode(node.id)
    document.body.style.cursor = 'pointer'
  }, [node.id, hoverNode])

  const handlePointerOut = useCallback(() => {
    hoverNode(null)
    document.body.style.cursor = 'auto'
  }, [hoverNode])

  return (
    <group
      ref={groupRef}
      position={[node.x, node.y, node.z]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Glow shell */}
      <Sphere args={[nodeSize * 1.6, 24, 24]}>
        <nodeGlowMaterial
          ref={glowRef}
          uColor={color}
          uEnergy={node.energy}
          uPulseSpeed={pulseSpeed}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Core sphere */}
      <Sphere args={[nodeSize, 24, 24]}>
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected || isHovered ? 4 : 2}
          roughness={0.2}
          metalness={0.3}
        />
      </Sphere>

      {/* Domain label — always faces camera via Text component */}
      <Text
        position={[0, -(nodeSize + 6), 0]}
        fontSize={2.5}
        color={isSelected || isHovered ? '#ffffff' : node.color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
        font="/fonts/Orbitron-Regular.woff"
      >
        {node.name.toUpperCase()}
      </Text>
    </group>
  )
}
```

- [ ] **Step 2: Create DomainNodesGroup (runs force simulation, renders all nodes)**

Create `src/components/canvas/DomainNodesGroup.tsx`:

```tsx
'use client'

import { useMemo, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { DOMAIN_NODES } from '@/data/nodes'
import { runForceSimulation } from '@/lib/forceSimulation'
import { calcCogBandwidth, calcResilience, calcFocus } from '@/lib/resourceCalc'
import { DomainNode } from './DomainNode'
import { NodeConnection } from './NodeConnection'

export function DomainNodesGroup() {
  const { setNodes, setResources } = useStore()

  // Run force simulation once — positions are stable
  const positionedNodes = useMemo(() => runForceSimulation(DOMAIN_NODES), [])

  // Hydrate store with positioned nodes on mount
  useEffect(() => {
    setNodes(positionedNodes)
    setResources({
      cogBandwidth: calcCogBandwidth(positionedNodes),
      resilience: calcResilience(positionedNodes),
      focus: calcFocus(positionedNodes),
    })
  }, [positionedNodes, setNodes, setResources])

  return (
    <group>
      {/* Connections from each node to center */}
      {positionedNodes.map((node, i) => (
        <NodeConnection
          key={`conn-${node.id}`}
          from={[node.x, node.y, node.z]}
          to={[0, 0, 0]}
          color={node.color}
          energy={node.energy}
          seed={i * 100}
        />
      ))}

      {/* Domain node spheres */}
      {positionedNodes.map(node => (
        <DomainNode key={node.id} node={node} />
      ))}
    </group>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/DomainNode.tsx src/components/canvas/DomainNodesGroup.tsx
git commit -m "feat: add domain nodes with glow, hover/click, force simulation"
```

---

### Task 12: Node Connections

**Files:**
- Create: `src/components/canvas/NodeConnection.tsx`

- [ ] **Step 1: Create organic curved tube connections**

Create `src/components/canvas/NodeConnection.tsx`:

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface NodeConnectionProps {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  energy: number
  // Stable seed for the curve offset — pass node.id or similar so the curve
  // never changes on re-render (Math.random() in useMemo is not safe with
  // array props since array refs change each render)
  seed: number
}

// Seeded pseudo-random from a number — stable across renders
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function NodeConnection({ from, to, color, energy, seed }: NodeConnectionProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { geometry } = useMemo(() => {
    const fromVec = new THREE.Vector3(...from)
    const toVec = new THREE.Vector3(...to)

    // Stable midpoint offset seeded from node identity — never changes on re-render
    const mid = fromVec.clone().add(toVec).multiplyScalar(0.5)
    const perpOffset = new THREE.Vector3(
      (seededRandom(seed) - 0.5) * 30,
      (seededRandom(seed + 1) - 0.5) * 30,
      (seededRandom(seed + 2) - 0.5) * 30
    )
    mid.add(perpOffset)

    const curve = new THREE.CatmullRomCurve3([fromVec, mid, toVec])
    const tubeRadius = 0.3 + (energy / 10) * 0.4
    const geometry = new THREE.TubeGeometry(curve, 20, tubeRadius, 6, false)

    return { geometry }
  }, [from, to, energy])

  // Pulse opacity based on time
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.2 + Math.sin(clock.getElapsedTime() * 0.8) * 0.08
    }
  })

  const threeColor = useMemo(() => new THREE.Color(color), [color])

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color={threeColor}
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/NodeConnection.tsx
git commit -m "feat: add organic curved tube connections between nodes"
```

---

## Chunk 4: HUD Chrome

### Task 13: Top HUD Bar

**Files:**
- Create: `src/components/hud/TopHUD.tsx`

- [ ] **Step 1: Create top resource bar**

Create `src/components/hud/TopHUD.tsx`:

```tsx
'use client'

import { useStore } from '@/store/useStore'

function ResourceItem({
  icon,
  value,
  net,
  label,
  overCapacity = false,
}: {
  icon: string
  value: string
  net?: string
  label: string
  overCapacity?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 group relative">
      <span className="text-sm">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className={`font-mono text-xs font-bold ${overCapacity ? 'text-red-400' : 'text-gray-200'}`}>
          {value}
          {net && (
            <span className={`ml-1 text-[10px] ${net.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {net}
            </span>
          )}
        </span>
        <span className="text-[9px] text-gray-500 tracking-widest uppercase">{label}</span>
      </div>
    </div>
  )
}

export function TopHUD() {
  const { cogBandwidth, resilience, focus, nodes } = useStore()

  const activeCommitments = nodes.filter(n =>
    n.designation !== 'dormant'
  ).length

  const avgStability = nodes.length > 0
    ? Math.round(nodes.reduce((acc, n) => acc + n.stability, 0) / nodes.length)
    : 100

  return (
    <div
      className="fixed top-0 left-0 right-0 z-10 flex items-center gap-6 px-4"
      style={{
        height: '44px',
        background: 'rgba(8, 12, 22, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(30, 42, 58, 0.8)',
      }}
    >
      {/* Left: raw resources */}
      <div className="flex items-center gap-5">
        <ResourceItem
          icon="⚡"
          value={`${cogBandwidth.current}/${cogBandwidth.max}`}
          label="Bandwidth"
          overCapacity={cogBandwidth.overCapacity}
        />
        <ResourceItem
          icon="♥"
          value={`${resilience}`}
          net={resilience > 50 ? `+${resilience - 50}` : `${resilience - 50}`}
          label="Resilience"
        />
        <ResourceItem
          icon="◈"
          value={`${focus}`}
          label="Focus"
        />
        <ResourceItem
          icon="◎"
          value={String(activeCommitments)}
          label="Active"
        />
        <ResourceItem
          icon="◈"
          value={`${avgStability}%`}
          label="Stability"
        />
      </div>

      {/* Center: empire identity */}
      <div className="flex-1 flex flex-col items-center leading-none">
        <span
          className="font-mono text-xs font-bold tracking-[0.25em] uppercase"
          style={{ color: '#e8963a' }}
        >
          Stellar Mind
        </span>
        <span className="text-[9px] text-gray-600 tracking-widest mt-0.5">
          System: Psyche — Neural Network Active
        </span>
      </div>

      {/* Right: stability indicator */}
      <div className="flex items-center gap-2">
        <div
          className="h-2 rounded-full"
          style={{
            width: '80px',
            background: 'rgba(30, 42, 58, 0.8)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(cogBandwidth.current / cogBandwidth.max) * 100}%`,
              background: cogBandwidth.overCapacity
                ? '#ef4444'
                : 'linear-gradient(90deg, #e8963a, #ffc857)',
            }}
          />
        </div>
        <span className="text-[9px] text-gray-500 tracking-widest">
          {cogBandwidth.overCapacity ? 'OVERLOADED' : 'NOMINAL'}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hud/TopHUD.tsx
git commit -m "feat: add Stellaris-style top HUD resource bar"
```

---

### Task 14: Left Toolbar

**Files:**
- Create: `src/components/hud/LeftToolbar.tsx`

- [ ] **Step 1: Create left icon toolbar**

Create `src/components/hud/LeftToolbar.tsx`:

```tsx
'use client'

const TOOLS = [
  { icon: '🧠', label: 'Empire Overview' },
  { icon: '👥', label: 'Social Graph' },
  { icon: '⚠', label: 'Situations' },
  { icon: '◈', label: 'Map Modes' },
  { icon: '⚡', label: 'Edicts' },
  { icon: '⚖', label: 'Factions' },
  { icon: '✦', label: 'Traditions' },
  { icon: '⊞', label: 'Expansion' },
  { icon: '⚙', label: 'Settings' },
]

export function LeftToolbar() {
  return (
    <div
      className="fixed left-0 z-10 flex flex-col items-center gap-1 py-2"
      style={{
        top: '44px',
        bottom: '40px',
        width: '40px',
        background: 'rgba(6, 10, 18, 0.88)',
        backdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(30, 42, 58, 0.6)',
      }}
    >
      {TOOLS.map(({ icon, label }) => (
        <button
          key={label}
          title={label}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:text-amber-400 hover:bg-amber-400/10 transition-colors text-sm"
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hud/LeftToolbar.tsx
git commit -m "feat: add left icon toolbar"
```

---

### Task 15: Right Sidebar

**Files:**
- Create: `src/components/hud/RightSidebar.tsx`

- [ ] **Step 1: Create contextual right sidebar**

Create `src/components/hud/RightSidebar.tsx`:

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/store/useStore'

function DomainList() {
  const { nodes, selectNode } = useStore()

  return (
    <div>
      <div
        className="text-[9px] tracking-[0.2em] uppercase mb-3 font-mono"
        style={{ color: '#e8963a' }}
      >
        Life Domains
        <span className="float-right text-gray-500">{nodes.length}</span>
      </div>
      <div className="space-y-1">
        {nodes.map(node => (
          <button
            key={node.id}
            onClick={() => selectNode(node.id)}
            className="w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors hover:bg-white/5 group"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: node.color, boxShadow: `0 0 4px ${node.color}` }}
              />
              <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                {node.name}
              </span>
            </div>
            <span className="text-[9px] text-gray-600 font-mono">
              {node.stability}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function NodeDetail() {
  const { selectedNodeId, nodes, selectNode } = useStore()
  const node = nodes.find(n => n.id === selectedNodeId)
  if (!node) return null

  const sentimentColor = {
    energizing: '#4ade80',
    neutral: '#94a3b8',
    draining: '#ef4444',
  }[node.sentiment]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div
          className="text-[9px] tracking-[0.2em] uppercase font-mono"
          style={{ color: '#e8963a' }}
        >
          Domain: {node.name}
        </div>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-600 hover:text-gray-300 text-xs"
        >
          ✕
        </button>
      </div>

      {/* Node color indicator */}
      <div
        className="w-full h-1 rounded mb-4"
        style={{ background: `linear-gradient(90deg, ${node.color}, transparent)` }}
      />

      <div className="space-y-3 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Energy</span>
          <span className="font-mono text-gray-200">{node.energy}/10</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Stability</span>
          <span className="font-mono text-gray-200">{node.stability}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Bandwidth Cost</span>
          <span className="font-mono text-gray-200">{node.bandwidthCost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Sentiment</span>
          <span className="font-mono capitalize" style={{ color: sentimentColor }}>
            {node.sentiment}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Mode</span>
          <span className="font-mono text-gray-200 capitalize">
            {node.designation.replace('_', ' ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Type</span>
          <span className="font-mono text-gray-400 capitalize">{node.type}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-[9px] text-gray-600 leading-relaxed">{node.description}</div>
      </div>

      {/* Placeholder sub-nodes — wired to DB in Session 2 */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div
          className="text-[9px] tracking-[0.15em] uppercase mb-2 font-mono"
          style={{ color: '#e8963a' }}
        >
          Sub-nodes
        </div>
        <div className="text-[10px] text-gray-600 italic">
          Loading in Session 2...
        </div>
      </div>

      <div className="mt-4">
        <div
          className="text-[9px] tracking-[0.15em] uppercase mb-2 font-mono"
          style={{ color: '#e8963a' }}
        >
          Stability Bar
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${node.stability}%`,
              background: node.stability > 70
                ? '#4ade80'
                : node.stability > 40
                ? '#e8963a'
                : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function RightSidebar() {
  const { selectedNodeId } = useStore()

  return (
    <div
      className="fixed right-0 z-10 overflow-y-auto"
      style={{
        top: '44px',
        bottom: '40px',
        width: '220px',
        background: 'rgba(10, 14, 26, 0.88)',
        backdropFilter: 'blur(8px)',
        borderLeft: '1px solid rgba(30, 42, 58, 0.6)',
        padding: '12px',
      }}
    >
      <AnimatePresence mode="wait">
        {selectedNodeId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <NodeDetail />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <DomainList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hud/RightSidebar.tsx
git commit -m "feat: add right sidebar with domain list and node detail panel"
```

---

### Task 16: Bottom Nav Bar

**Files:**
- Create: `src/components/hud/BottomNav.tsx`

- [ ] **Step 1: Create bottom navigation tab bar**

Create `src/components/hud/BottomNav.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'

const TABS = [
  { id: 'galaxy', label: 'Galaxy Map' },
  { id: 'command', label: 'Central Command' },
  { id: 'report', label: 'Cog. Report' },
  { id: 'processes', label: 'Processes' },
  { id: 'research', label: 'Research' },
  { id: 'consciousness', label: 'Consciousness' },
]

export function BottomNav() {
  const [activeTab, setActiveTab] = useState('galaxy')

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center gap-0"
      style={{
        height: '40px',
        background: 'rgba(4, 8, 14, 0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(30, 42, 58, 0.8)',
      }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="relative h-full px-4 text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap"
          style={{
            color: activeTab === tab.id ? '#ffffff' : '#444444',
            borderTop: activeTab === tab.id
              ? '2px solid #e8963a'
              : '2px solid transparent',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hud/BottomNav.tsx
git commit -m "feat: add Stellaris-style bottom nav tab bar"
```

---

## Chunk 5: Root Layout + Polish

### Task 17: Root Layout, Fonts, and Page Composition

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Create: `public/fonts/` (Orbitron font)

- [ ] **Step 1: Download Orbitron font for drei Text labels**

The drei `<Text>` component fetches fonts via URL at runtime. Use the npm package approach to get a reliable woff file:

```bash
mkdir -p public/fonts
# Download Orbitron woff2 from Google Fonts CDN (confirmed woff2 URL)
curl -L -o public/fonts/Orbitron-Regular.woff2 \
  "https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWg1.woff2"
```

drei's `<Text font="...">` works with `.woff2` directly. Update ALL `font=` references in `CentralNode.tsx` and `DomainNode.tsx` from `Orbitron-Regular.woff` to `Orbitron-Regular.woff2`:

```bash
# In CentralNode.tsx and DomainNode.tsx, replace the font path:
# font="/fonts/Orbitron-Regular.woff"  →  font="/fonts/Orbitron-Regular.woff2"
```

- [ ] **Step 2: Update globals.css with space theme base**

Replace contents of `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-space: #060a12;
  --bg-hud: rgba(8, 12, 22, 0.92);
  --amber: #e8963a;
  --amber-bright: #ffc857;
  --cyan-accent: #00e5ff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg-space);
  color: #e0e0e0;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden; /* Galaxy canvas fills the screen — no scroll */
  user-select: none;
}

::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 42, 58, 0.3);
}

::-webkit-scrollbar-thumb {
  background: rgba(232, 150, 58, 0.4);
  border-radius: 2px;
}
```

- [ ] **Step 3: Update layout.tsx**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StellarOS',
  description: 'A 3D personal life operating system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Compose root page**

Replace `src/app/page.tsx`:

```tsx
import { GalaxyCanvas } from '@/components/canvas/GalaxyCanvas'
import { TopHUD } from '@/components/hud/TopHUD'
import { LeftToolbar } from '@/components/hud/LeftToolbar'
import { RightSidebar } from '@/components/hud/RightSidebar'
import { BottomNav } from '@/components/hud/BottomNav'

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#060a12' }}>
      {/* 3D Galaxy — fixed, fills viewport, z-0 */}
      <GalaxyCanvas />

      {/* HUD Chrome — regular React DOM on top, z-10 */}
      <TopHUD />
      <LeftToolbar />
      <RightSidebar />
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 5: Verify dev server runs with no errors**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected:
- Dark space background visible
- Top HUD bar rendered with resource numbers
- Left toolbar icons visible
- Right sidebar shows domain list
- Bottom nav tabs visible
- 3D canvas loading (may take a moment — Suspense)
- 8 glowing nodes visible with connections
- Central consciousness node glowing at center

- [ ] **Step 6: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: All tests pass (nodes, store, resourceCalc, forceSimulation).

- [ ] **Step 8: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx public/fonts/
git commit -m "feat: compose root page with galaxy canvas + HUD chrome"
```

---

### Task 18: Depth-of-Field Integration + DepthOfField Interaction

**Files:**
- Modify: `src/components/canvas/GalaxyCanvas.tsx`

- [ ] **Step 1: Wire DepthOfField focus to selected node distance**

The DepthOfField effect's `focusDistance` should shift when a node is selected. Update `GalaxyCanvas.tsx` to use the store:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing'
import { Suspense } from 'react'
import { CentralNode } from './CentralNode'
import { DomainNodesGroup } from './DomainNodesGroup'
import { ParticleDust } from './ParticleDust'
import { CameraController } from './CameraController'
import { useStore } from '@/store/useStore'

function PostProcessing() {
  const selectedNodeId = useStore(s => s.selectedNodeId)

  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={selectedNodeId ? 0.01 : 0}
        focalLength={selectedNodeId ? 0.04 : 0.02}
        bokehScale={selectedNodeId ? 4 : 1}
      />
      <Vignette
        offset={0.3}
        darkness={0.8}
      />
    </EffectComposer>
  )
}

export function GalaxyCanvas() {
  const selectNode = useStore(s => s.selectNode)

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 0, 200], fov: 60, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => selectNode(null)}
    >
      <ambientLight intensity={0.05} />
      <Suspense fallback={null}>
        <CentralNode />
        <DomainNodesGroup />
        <ParticleDust />
        <CameraController />
      </Suspense>
      <PostProcessing />
    </Canvas>
  )
}
```

- [ ] **Step 2: Final visual smoke test**

```bash
npm run dev
```

Test the following manually:
1. Scene loads — galaxy visible with 8 nodes + connections + particle dust ✓
2. Rotate with mouse drag ✓
3. Zoom with scroll wheel ✓
4. Hover over a node — it brightens, label appears ✓
5. Click a node — camera flies to it, DoF blur increases, sidebar shows detail ✓
6. Click empty space — deselects, camera returns to overview ✓
7. Top bar shows resource values (bandwidth, resilience, focus) ✓
8. Right sidebar animates between domain list and node detail ✓
9. Bottom nav tabs are visible ✓

- [ ] **Step 3: Final commit**

```bash
git add src/components/canvas/GalaxyCanvas.tsx
git commit -m "feat: wire depth-of-field to node selection for focus effect"
```

---

## Session 1 Complete ✓

**Vibe check:** Open `http://localhost:3000`. A dark galaxy breathes. 8 glowing domain nodes orbit a warm central consciousness. You can spin the scene with your mouse. Click Business — the camera flies in, the background blurs, the right sidebar shows domain detail. The top bar shows real resource numbers. It feels like Stellaris.

**What's next (Session 2):**
- Neon database + Drizzle ORM setup
- All 12 DB tables from the spec
- API routes: GET /api/mindmap, GET /api/node/:id, POST /api/node/:id/items
- Replace static `data/nodes.ts` with DB queries
- Kanban/task list in right sidebar for trackable nodes
- Zoom levels 2 and 3 (system → planet view)
- Auth (simple password protection)
- Deploy to stellaros.life
