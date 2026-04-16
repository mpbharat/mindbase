# Next Session Instructions — CLI Claude

**Date written:** March 16, 2026
**For:** Claude Code CLI, next working session
**Goal:** Build Screen 1 (Today view) — mobile-first, replacing the current 3D home screen.

Read `CLAUDE.md` first. Then come back here.

---

## Context: What Happened in This Session

The product pivoted. What started as a Stellaris-themed 3D life OS is now a focused mobile-first commitment protection app (working name: Anchor).

**The insight:** Bharat's core problem isn't visibility into his life. It's that he can't say no to new things, which causes his existing commitments to silently break. He needs a gate — a moment that makes the cost of saying yes visible before he decides.

**The product:** Three screens.
1. Today — your commitments, done/not done, streak, energy bar
2. Detail — tap a commitment, see context and current focus
3. Gate — add something new, see the trade-off, decide consciously

The existing 3D scene is preserved and rerouted to `/galaxy`. The new home screen is Screen 1.

---

## Session Goal: Screen 1

Build the Today screen as a mobile-first Next.js page. Replace `src/app/page.tsx`.

**What it needs:**
- Dark background (#0a0c12 or similar)
- Energy bar at top — shows X/100 used. Simple progress bar.
- 4 commitment cards — each with: name, energy cost indicator, streak count, done toggle
- Streak: number of consecutive days the commitment was completed
- Done toggle: tap to mark complete for today. Visual state change (dim → bright, grey → green)
- "+" FAB button bottom-right → navigates to Screen 3 (gate) — build the route but can be a placeholder for now
- Tap a card → navigates to Screen 2 (detail) — placeholder route for now

**Seed data (hardcode for now, no DB):**
```typescript
const commitments = [
  { id: '1', name: 'Gym', emoji: '💪', energyCost: 15, streak: 4, doneToday: false, color: '#4ade80' },
  { id: '2', name: 'Zaasu', emoji: '⚡', energyCost: 30, streak: 12, doneToday: false, color: '#e8963a' },
  { id: '3', name: 'Dhiya time', emoji: '👧', energyCost: 20, streak: 7, doneToday: false, color: '#f472b6' },
  { id: '4', name: 'KPS / Mart', emoji: '🏗️', energyCost: 25, streak: 21, doneToday: false, color: '#4a9eff' },
]
// Total energy: 90/100
```

**State:** Use React useState for now. No Zustand needed yet. No database. When Bharat closes the app, it resets — that's fine for prototype.

**Design references:**
- The Commit app screenshot Bharat shared: dark, clean, cards with green checkboxes, streak numbers
- Mobile viewport: design for 390px wide (iPhone 14 Pro). Use Tailwind.
- Font: Keep Orbitron for the energy number/bar. Use Inter or system font for card text.

---

## File Changes Required

### 1. Move the existing 3D scene to a sub-route

Create `src/app/galaxy/page.tsx`:
```typescript
// Move everything from current src/app/page.tsx here
// This preserves all 15 commits of 3D work
// Route: /galaxy
```

### 2. Rebuild src/app/page.tsx as Screen 1

New `src/app/page.tsx` = Today screen. Mobile-first. See spec above.

### 3. Create placeholder routes

- `src/app/commitment/[id]/page.tsx` — Screen 2 placeholder ("Detail coming soon")
- `src/app/gate/page.tsx` — Screen 3 placeholder ("Gate coming soon")

### 4. Update BACKLOG.md

Replace the old 47-task Phase 1 Stellaris backlog with the new 3-screen roadmap.

---

## New BACKLOG Structure

```
## Phase 1: Three Screens (current)

### Screen 1 — Today (MVP)
- [ ] Rebuild page.tsx as mobile-first Today view
- [ ] Energy bar component (X/100, colour shifts red when >85%)
- [ ] Commitment card component (name, emoji, cost, streak, toggle)
- [ ] Done toggle with animation (grey → green, satisfying)
- [ ] Seed Bharat's 4 real commitments
- [ ] Streak logic (localStorage, persists across refreshes)
- [ ] "+" FAB button → /gate route

### Screen 2 — Detail
- [ ] /commitment/[id] route
- [ ] Header: commitment name, energy cost, streak
- [ ] Current focus field (editable text)
- [ ] Activity log (last 5 entries, manual add)
- [ ] Sub-items (simple checklist)
- [ ] "Galaxy view" button → /galaxy?commitment=id

### Screen 3 — The Gate
- [ ] /gate route
- [ ] Name input
- [ ] Energy cost picker (Low 10 / Medium 20 / High 30)
- [ ] Live trade-off display: current + new = total, bar fills in real time
- [ ] Over-capacity warning: "You're at 110%. What pauses?"
- [ ] Confirm / Cancel — log the decision

### Infrastructure
- [ ] localStorage persistence for streaks + daily done state
- [ ] Daily reset (midnight, done states clear, streaks increment/break)
- [ ] Reroute 3D scene to /galaxy
- [ ] Mobile viewport meta tags, PWA manifest
- [ ] Deploy to Vercel

### Phase 2: Real App (later)
- [ ] Expo/React Native migration
- [ ] Neon Postgres — proper persistence
- [ ] iPhone home screen widget
- [ ] Mac menu bar widget
- [ ] Notification: daily reminder at set time
- [ ] Basic integrations: Apple Health (gym auto-detect), GitHub (Zaasu activity)
```

---

## Definition of Done for This Session

Bharat can open the app on his iPhone (via Vercel deploy or local dev), see his 4 commitments, tap them to mark done, see the energy bar, and feel like it's a real product he'd actually use every day.

That's it. No database. No gate logic. No galaxy. Just Screen 1 working on mobile.

---

## Notes on Energy Cost

Energy is not a real unit. It's a relative constraint visualiser. The values don't have to be scientifically accurate — they have to *feel* right to Bharat.

90/100 means he's almost fully committed already. Adding anything new hits the red zone immediately. That's the point. The number is honest.

If he ever gets to 70/100 it means he's successfully paused or dropped something. That should feel like relief, not failure.
