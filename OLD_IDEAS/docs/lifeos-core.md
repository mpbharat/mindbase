# LifeOS Core — System Definition

**What this document is:** The skin-agnostic definition of LifeOS — what it can do, what it tracks, how it thinks. No game language, no visual decisions. Just the engine.

**Relationship to Stellaris skin:** Stellaris (the 3D galaxy, the game terminology, the HUD) is one possible visualization of this system. LifeOS core doesn't know what a "galaxy" or "planet" is. It knows about domains, health, load, and people.

---

## What LifeOS Is

A personal life management engine that models your entire life as an interconnected graph of domains, tracks their health over time, surfaces tensions and developing problems, and gives you an honest read on where you actually stand — not where you think you stand.

It is not a to-do list. It is not a calendar. It is a **life state machine** with real metrics, real feedback loops, and real consequences for neglect.

---

## 1. The Domain Graph

Your life is a graph. Nodes are **domains** — areas of your life that demand attention and produce value.

### Domain Properties (the universal truth about any life area)

| Property | Type | What It Means |
|----------|------|---------------|
| `name` | string | What this area is called |
| `parent_id` | FK | What it belongs to (null = top-level) |
| `type` | enum | `trackable` (has tasks, measurable progress), `reference` (mostly static knowledge), `event` (timestamped, one-time) |
| `status` | enum | `active`, `paused`, `archived` |
| `health` | 0–100 | Composite score: is this area of your life in good shape? |
| `engagement` | 1–10 | How much energy/attention you're putting into this right now |
| `valence` | enum | `positive` (this area energizes you), `neutral`, `negative` (this area drains you) |
| `mode` | enum | `focused` (deep work, high output, high cost), `maintaining` (steady, low cost), `exploring` (creative, medium cost), `paused` (near-zero cost, no output) |
| `load` | int | How much mental bandwidth this domain demands when active |
| `last_active` | timestamp | When you last did something meaningful here |
| `metadata` | JSONB | Anything domain-specific that doesn't fit above |

### Top-Level Domains (Bharat's life, as User #1)

1. **Work** — employment, career, professional identity
2. **Ventures** — side businesses, entrepreneurial projects
3. **Life Events** — significant moments (past, present, planned)
4. **Relationships** — family, friends, key people
5. **Personal** — finance, interests, health, hobbies
6. **Identity** — values, personality, mental models, growth
7. **Foundation** — education, skills, tools, knowledge base
8. **Now** — current priorities, active focus, today's decisions

Each top-level domain has sub-domains (e.g., Ventures → Zaasu, Dhi's, Street League). Sub-domains can have sub-domains. It's a tree, rendered as a graph with cross-connections.

### Connections

Domains connect to each other. Connections have:
- `source_id`, `target_id` — the two domains
- `strength` — 1–10, how coupled they are
- `type` — `dependency`, `feeds_into`, `competes_with`, `supports`

Example: Health *feeds_into* everything (when gym drops, ventures stall). Ventures *competes_with* Relationships (time is zero-sum).

---

## 2. Items (Tasks & Trackables)

Every trackable domain contains **items** — the actual work.

| Property | Type | What It Means |
|----------|------|---------------|
| `title` | string | What needs to be done |
| `description` | text | Context, details |
| `status` | enum | `todo`, `in_progress`, `done`, `blocked`, `archived` |
| `priority` | enum | `critical`, `high`, `medium`, `low` |
| `due_date` | date | Optional deadline |
| `created_at` | timestamp | When it was created |
| `completed_at` | timestamp | When it was finished |

Items are the ground truth of progress. They feed into domain health calculations.

---

## 3. Derived Metrics (The Dashboard)

LifeOS computes five core metrics from raw domain data. These are the vital signs of your life.

### 3a. Capacity (How much bandwidth do you have?)

**What it measures:** Are you overloaded or do you have room?

```
Total Load = sum of (domain.load) for all active domains
Capacity = your self-set maximum (e.g., 100)
Available = Capacity - Total Load
```

When Available < 0, you're overloaded. Things start slipping. This is the most important single number in the system.

**What feeds it:** Domain load values, number of active domains, number of in-progress items.

**What drains it:** Every active domain, every open task, every unresolved challenge.

### 3b. Emotional Balance (How do you feel about your life?)

**What it measures:** Net emotional state across all domains.

```
For each active domain:
  if valence == positive: +weight (scaled by engagement)
  if valence == negative: -weight (scaled by engagement)
  if valence == neutral: 0

Emotional Balance = normalize to 0–100 scale
```

A life full of draining domains with high engagement = low balance (you're pouring energy into things that hurt). A life with energizing domains = high balance.

**What feeds it:** Energizing domains, completed milestones, quality time in positive areas.

**What drains it:** Draining domains you can't escape, neglected relationships, guilt from paused areas.

### 3c. Focus (Can you do deep work?)

**What it measures:** Your ability to concentrate and make progress on hard things.

```
Focus penalty for each domain in "focused" mode (context-switching cost)
Focus bonus from health signals (sleep, exercise)
Focus drain from unresolved challenges
```

More things in focused mode = less actual focus (ironic but true — spreading "focus" across 5 things means none get it).

**What feeds it:** Sleep, exercise, completing deep work sessions, reducing active focused domains.

**What drains it:** Context-switching, too many focused domains, sleep debt, unresolved challenges.

### 3d. Satisfaction (Are your internal drives being met?)

**What it measures:** Whether the different parts of your identity are getting what they need.

This is a composite of **drive satisfaction** (see Section 6: Internal Drives). Each drive has needs. When they're met, satisfaction rises. When they're neglected, it falls.

### 3e. Growth Rate (Are you learning and expanding?)

**What it measures:** Rate of skill acquisition, learning, and capability building.

```
Based on: learning log entries, new skills, experiments run, books read
Penalized by: complexity overload (too many active things slows learning)
```

Stagnation is visible. Growth is visible. The trend matters more than the absolute number.

---

## 4. Activity Log

Everything meaningful gets logged. This is the audit trail of your life.

| Property | Type |
|----------|------|
| `domain_id` | FK — which domain |
| `action` | string — what happened |
| `source` | enum — `manual`, `api`, `automation`, `git_hook` |
| `message` | text — human-readable description |
| `timestamp` | when |

Activity feeds into: domain health (recency), attention tracking, and time-travel snapshots.

---

## 5. Progressive Challenges

Not binary alerts. **Developing situations** with severity that escalates over time if ignored and reverses when addressed.

| Property | Type | What It Means |
|----------|------|---------------|
| `name` | string | e.g., "Fitness Decline", "Relationship Drift" |
| `domain_id` | FK | Which domain it affects |
| `severity` | 0–100 | Current severity level |
| `daily_tick` | int | How much severity increases per day of inaction |
| `reversal_per_action` | int | How much severity decreases per positive action |
| `trigger_condition` | text | What starts it (e.g., "3+ days no gym") |
| `crisis_threshold` | int | Severity level that triggers crisis mode (usually 80) |
| `status` | enum | `developing`, `crisis`, `resolving`, `resolved` |

### Built-in Challenges (active from day 1)

- **Fitness Decline** — triggers at 3+ days no gym. +7/day inactive, -15/day active. Crisis at 80: affects focus, cascades.
- **Relationship Drift** — triggers per key person at 14+ days no interaction. +3/day, -10 per interaction.
- **Backlog Overflow** — triggers when domain has >20 todo items. +2/day while growing.
- **Learning Stagnation** — triggers at 21+ days no learning activity. +3/day.
- **Financial Blindspot** — triggers at 30+ days no finance review. +2/day.
- **Sleep Debt** — triggers at 3+ nights under 6 hours. +10/night under 6hrs, -5/night over 7hrs.

Challenges are the system's way of saying "this is getting worse and you should know." They progress whether you're paying attention or not — just like real life.

### Challenge Chains

Resolving one challenge can trigger another. Ignoring one can spawn related ones. Health crisis → Focus drops → Backlog overflows → Ventures stall. The cascade is real and the system models it.

---

## 6. Internal Drives (The Parts of You)

You are not one person. You are several competing drives that can't all be satisfied simultaneously. LifeOS models this honestly.

Each drive has:
- `name` — what part of you this is
- `needs` — what it requires to be satisfied
- `satisfaction` — 0–100, current score
- `key_metric` — what data point measures it
- `satisfied_when` — threshold for happiness
- `frustrated_when` — threshold for frustration

### Bharat's Drives

| Drive | Core Need | Satisfied When | Frustrated When |
|-------|-----------|----------------|-----------------|
| **The Builder** | Ship things, see progress | ≥3 meaningful completions/week | No progress for 5+ days |
| **The Father** | Quality time with Dhiya, consistency | Plan executed ≥3 nights/week | Plan skipped 3+ days in a row |
| **The Partner** | Connection with Amu | ≥1 meaningful activity/week | 2+ weeks with no dedicated time |
| **The Investor** | Financial progress, FIRE path | Savings rate ≥30% + monthly review | Overspending, no review in 30+ days |
| **The Athlete** | Physical health, energy | ≥3 gym sessions/week | <1 session/week |
| **The Student** | Learning, growth | ≥4 learning sessions/month | Zero activity for 21+ days |

### The Tension Map

Drives conflict. This is by design — it's honest.

- Builder vs. Father: "Code tonight" vs. "Dhiya chess time"
- Investor vs. Builder: "Save everything" vs. "Invest in Zaasu hosting"
- Student vs. Athlete: "Stay up reading" vs. "Sleep by 10pm"

LifeOS surfaces these tensions. You can't resolve them — you can only choose which drives to prioritize this week/month. That choice is logged and its consequences are tracked.

---

## 7. Complexity Score

Every active commitment has overhead beyond its direct load. LifeOS tracks total life complexity.

```
Complexity = (active domains × 5) + (total open items × 1) + (active challenges × 10) + (unresolved decisions × 15)

Admin Capacity = base(50) + bonuses from automation + bonuses from delegation

Overload = max(0, Complexity - Admin Capacity)
```

When overloaded: everything takes longer, learning slows, focus drops. The fix isn't "do more" — it's either reduce complexity (pause domains, clear backlogs, resolve challenges) or increase capacity (automate, delegate, build better systems).

---

## 8. Temporary Interventions

Time-boxed, deliberate shifts in how you operate. They have real costs and real benefits.

| Intervention | Scope | Effect | Cost | Duration |
|-------------|-------|--------|------|----------|
| **Sprint** | Single domain | Double progress rate | Heavy focus drain, emotional drain | 1–2 weeks max |
| **Rest** | System-wide | Double recovery on all metrics | All domains pause (zero output) | 1–3 days |
| **Focus Lock** | System-wide | Only 2 domains can be active | Everything else forced to maintaining/paused | Until cancelled |
| **Delegation** | Multiple domains | Reduce load by routing to others | Financial cost + requires capable people | Ongoing |
| **Learning Sprint** | Foundation | Double growth rate | Other domains get reduced output | 1 month |
| **Family First** | Relationships | All relationship domains get health boost | Work/venture output drops | 1 month |
| **Audit & Triage** | System-wide | Review everything, archive stale items, reduce complexity | 1–2 hours of focused time | One-shot |

---

## 9. People

People orbit domains. They're not domains themselves — they're satellites connected to the areas of your life they're part of.

| Property | Type |
|----------|------|
| `name` | string |
| `relationship` | string |
| `primary_domain_id` | FK — which domain they're most connected to |
| `closeness` | 1–10 |
| `last_interaction` | date |
| `interaction_frequency_target` | days — how often you want to connect |

Drift detection: when `days_since_last_interaction > interaction_frequency_target × 2`, a "Relationship Drift" challenge triggers for that person.

---

## 10. Health Signals

Simple daily signals that feed into capacity, focus, and emotional balance.

| Signal | Type | Feeds Into |
|--------|------|-----------|
| `gym` | boolean | Focus, Capacity |
| `energy_level` | 1–10 | Capacity, Emotional Balance |
| `sleep_hours` | decimal | Focus, Capacity |
| `notes` | text | Context |

Not a fitness tracker. A life signal. When health drops, everything else follows.

---

## 11. Learning Log

Track what you're learning and how fast.

| Property | Type |
|----------|------|
| `type` | `book`, `course`, `skill`, `certification`, `experiment` |
| `title` | string |
| `domain_id` | FK — which domain it connects to |
| `status` | `in_progress`, `completed`, `abandoned` |
| `started_at` | date |
| `completed_at` | date |

Feeds into: Growth Rate metric, The Student drive satisfaction, domain health for Foundation.

---

## 12. Attention Log

Where did your time actually go? Not planned — actual.

| Property | Type |
|----------|------|
| `domain_id` | FK |
| `date` | date |
| `minutes_spent` | int |
| `source` | `manual`, `inferred` |

The gap between "where I think my time goes" and "where it actually goes" is the most powerful insight LifeOS produces.

---

## 13. Life Events

Significant moments captured with full context.

| Property | Type |
|----------|------|
| `event_type` | `birth` (new domain/project), `death` (ended), `merge`, `drift`, `growth`, `transfer`, `rebalance`, `decision` |
| `domain_id` | FK |
| `related_domain_id` | FK (optional) |
| `description` | text |
| `event_date` | date |
| `decision_context` | JSONB — for decisions: alternatives, reasoning, sentiment |

Life events + snapshots = time travel. You can scrub back to any point and see what your life looked like, what you were dealing with, and why you made the choices you made.

---

## 14. Snapshots (Time Travel)

Periodic captures of full system state.

| Property | Type |
|----------|------|
| `snapshot_date` | date |
| `snapshot_type` | `weekly_auto`, `event_triggered`, `manual` |
| `full_state` | JSONB — all domain positions, health, engagement, connections |
| `priorities` | text — what mattered that week |
| `reflection_notes` | text — optional personal notes |

Start recording from day 1. The timeline UI can come later. Data accumulation is the bottleneck, not visualization.

---

## 15. Seasonal Rhythms

Recurring patterns that affect how the whole system behaves.

| Property | Type |
|----------|------|
| `name` | string — Ramadan, school year, Q4 retail, etc. |
| `start_month`, `start_day` | when it begins |
| `end_month`, `end_day` | when it ends |
| `affected_domain_ids` | which domains it touches |
| `intensity` | float — how much it pulls attention |
| `active` | boolean |

During Ramadan, everything shifts pace. Before school starts, Dhiya's domain demands more. Q4 retail affects Mart. These aren't events — they're gravitational fields that change how the system operates for weeks at a time.

---

## 16. The API

LifeOS exposes everything through a REST API. This is how skins consume data, how external tools push data in, and how automations work.

### Read Endpoints
- `GET /api/state` — full current state (all domains, metrics, challenges)
- `GET /api/domains` — all domains with current properties
- `GET /api/domains/:id` — single domain with items, activity, people
- `GET /api/metrics` — derived metrics (capacity, balance, focus, satisfaction, growth)
- `GET /api/challenges` — all active progressive challenges
- `GET /api/drives` — internal drives with satisfaction scores
- `GET /api/timeline` — snapshots for time travel
- `GET /api/context` — condensed current state for AI tool bootstrap

### Write Endpoints
- `POST /api/domains/:id/items` — add item to domain
- `PUT /api/items/:id` — update item status
- `POST /api/activity` — log an activity
- `POST /api/health` — log health signal
- `POST /api/learning` — log learning entry
- `POST /api/attention` — log attention/time spent
- `POST /api/events` — record a life event
- `POST /api/snapshots` — trigger manual snapshot
- `PUT /api/domains/:id` — update domain properties (mode, valence, etc.)
- `POST /api/interventions` — activate a temporary intervention

### Automation Endpoints
- `POST /api/hooks/git` — receive git commit data
- `POST /api/tick` — run daily tick (update challenge severity, recalculate metrics)
- `POST /api/snapshot/auto` — weekly auto-snapshot (cron)

---

## What LifeOS Does NOT Do

- **No visualization opinions.** It doesn't know if domains are planets, neurons, garden plots, or city blocks. That's the skin's job.
- **No gamification language.** No "energy credits," no "edicts," no "factions." Those are skin-level translations of capacity, interventions, and drives.
- **No scheduling.** It tracks what happened and what needs attention. It doesn't tell you when to do it (that's a calendar).
- **No notifications.** It surfaces challenges and tensions. How they're presented (push notification, glowing node, red card) is the skin's decision.
- **No social features.** It's a single-user system. Bharat is User #1 and the only user.

---

## How a Skin Consumes LifeOS

A skin (like Stellaris) does three things:

1. **Translates terminology.** LifeOS "capacity" becomes Stellaris "Cognitive Bandwidth." LifeOS "health" becomes "stability." LifeOS "drives" become "factions."

2. **Maps data to visuals.** LifeOS `engagement: 8` becomes a large, brightly glowing planet. LifeOS `health: 30` becomes a red-pulsing node with storm particles. LifeOS `valence: negative` becomes cool/blue color temperature.

3. **Adds presentation-layer features.** The 3D galaxy, shaders, post-processing, HUD layout, camera behavior, map modes — these are all skin decisions. A "Calm Garden" skin might show domains as plants in a garden. A "City" skin might show them as neighborhoods.

The skin reads from the API. The skin never writes game-specific data to the core. If Stellaris wants to show "Cognitive Bandwidth," it computes that from LifeOS capacity data in the adapter layer — it doesn't store "cognitive_bandwidth" in the database.

---

*This is LifeOS. The engine. The truth layer. Everything else is presentation.*
