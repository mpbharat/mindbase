# Anchor — Claude Instructions

**Working name:** Anchor (pending Bharat's final choice)
**Owner:** Bharat Sankar (YOUR_EMAIL)
**Location:** Dubai, UAE
**Status:** Pivoted — read this fully before touching any code.

---

## What This Product Is

A mobile-first commitment protection app. Not a life OS. Not a habit tracker. Not another to-do list.

**The one problem it solves:** Bharat knows what matters. He sets his priorities. Then something new appears — an opportunity, someone else's urgency, a shiny idea — and he says yes without seeing the cost. The gym drops. Dhiya evenings disappear. Zaasu stalls. Three weeks later he's wondering why nothing's moving.

**The core loop:**
1. You hold a small number of protected commitments (3–5). These are non-negotiable.
2. Every commitment costs energy. You have a finite amount. The system shows you the real number.
3. When a new thing appears, before you say yes, the app shows you the trade-off: "This costs X energy. Here's what gets displaced. Still want it?"
4. Daily: open the app, see your commitments, mark them done. That's it.
5. Tap any commitment to go deeper — see what you're working on, where you are, what's next.

**What makes it different from Commit, Habitica, or Notion Life OS templates:**
Nothing else shows you the cost of saying yes *before* you decide. They all track damage after it happens.

---

## Bharat's Context (User #1)

- Senior PM at KPS, Dubai. Survived layoffs Jan 2026 by creating Mart GTM solo.
- Building Zaasu (zaasu.com) — AI finance coaching. His main venture.
- Wife Amu, daughter Dhiya (starting pre-KG April 2026, in swimming classes).
- Gym + diet started Feb 2026 with Amu. Early days, building the habit.
- Core struggle: can't say no. Gets pulled into new things. Loses track of commitments.
- Has overcome alcohol addiction, gambling addiction, 150kg+ weight. Systems-thinker. Atomic Habits worked.
- Wants to be the driver of his life, not a passenger.

**Bharat's current 4 commitments (seed data for Screen 1):**
1. **Gym** — 5x/week. 45 min. Non-negotiable health baseline. Energy cost: 15.
2. **Zaasu** — 2 hrs deep work daily. Getting it live is the priority. Energy cost: 30.
3. **Dhiya time** — Every evening, 45 min minimum. Chess, reading, swimming plan. Energy cost: 20.
4. **KPS / Mart** — Deliver Graphtec + Het Anker pilots. Keep Viktor's trust. Energy cost: 25.

Total: 90/100 energy committed. 10 left. That's the real number.

---

## Product Shape: Three Screens

### Screen 1 — Today (Home, default view)
- Commitments as simple cards. Name, energy cost dot, done/not-done toggle.
- Energy bar at top: X/100. Simple. Like a battery.
- Streak counter per commitment.
- Tap any card → Screen 2 (detail).
- One FAB button: "+" → Screen 3 (gate).
- **Feel:** Dark, calm, minimal. Exactly like the Commit app screenshot Bharat shared.

### Screen 2 — Commitment Detail (tap-in)
- What this commitment is and why it matters.
- Current focus: what does "doing this today" actually mean.
- Recent log: last 3–5 activity notes.
- Sub-items: optional nested work items.
- Deep view button: opens the Stellaris 3D galaxy scene for this commitment's world (existing code, rerouted to `/galaxy/:id`).

### Screen 3 — The Gate (new commitment)
- Name the new thing.
- Set energy cost: Low (10) / Medium (20) / High (30).
- Shows instantly: current load + new cost = total. Bar fills visually.
- If over 100: "You're at 110%. Something has to give. Which commitment do you pause?" — force the trade-off consciously.
- Log the decision either way (said yes / said no).

---

## Tech Stack

**Now (prototype):** Next.js (existing codebase). Rebuild `src/app/page.tsx` as mobile-first Screen 1. Keep existing 3D scene at `/galaxy`. Use localStorage — no database yet.

**Phase 2 (real app):** Expo + React Native. iOS, Android, macOS. Home screen widgets and Mac menu bar come via native extensions later.

**The existing 3D scene:** Don't delete it. Move it to `/galaxy` route. It becomes Screen 2's deep view for a commitment's sub-world. All 15 commits of visual work are preserved and repurposed.

---

## What's Already Built (15 commits)

In `stellaros/` — working 3D visual prototype:
- Full galaxy scene: R3F, GLSL shaders, bloom/DOF/vignette post-processing, particle dust
- 8 domain nodes with d3-force-3d layout
- Stellaris-style HUD chrome (top bar, sidebars, bottom nav)
- Zustand store, resource calculation logic, type definitions
- Tests stubbed for store, forceSimulation, resourceCalc

**Not wasted.** The resource calc → energy system. The nodes → commitment detail views. The 3D scene → galaxy deep view.

---

## Naming (Pending Decision)

- **Anchor** ← recommended. Tagline: *"Stay anchored."* Visual, emotional, maps to Bharat's story.
- **Hold** — hold the line. Short and sharp.
- **Vow** — a vow to yourself. More intimate.
- **Few** — do fewer things fully.

Use "anchor" in code/filenames until Bharat decides.

---

## Docs

- `docs/lifeos-core.md` — underlying data model, still valid architecture
- `docs/next-session.md` — **start here for next CLI session**
- `docs/archive/` — old Stellaris specs, keep for reference only
- `reference/` — Bharat's personal data for seeding

---

## Don't

- Don't touch the 3D scene code. Just reroute it to `/galaxy`.
- Don't start with the database. localStorage first, then Neon.
- Don't add features to Screen 1. It must stay as simple as the Commit app.
- Don't call it a habit tracker, life OS, or productivity system.
- Don't build beyond 3 screens before Bharat tests it.
