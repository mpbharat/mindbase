# Stellaris Mechanics → StellarOS Mapping

**Purpose:** This is the game design bible for StellarOS. Every Stellaris system is mapped to a StellarOS equivalent with implementation notes. When building, refer to this document to ensure the "game feel" is consistent — not just the visual style, but the actual mechanics that make Stellaris compelling.

**Project:** StellarOS (stellaros.life) | Internal shorthand: SOL
**Date:** March 10, 2026
**Reference:** Companion to `life-os-concept.md`

---

## Why Stellaris Works as the Model

Stellaris is not a combat game. It's a **systems management game.** You manage an interconnected web of resources, populations, planets, factions, research, and diplomacy — all happening simultaneously, all affecting each other, all evolving over time. The player's job isn't to "win battles" — it's to maintain a healthy, growing empire while balancing competing demands for limited resources.

That's exactly what managing a life is.

The reason Bharat's brain thinks in Stellaris terms is because Stellaris already simulates the problem: too many systems, not enough attention, everything connected, consequences cascade, time moves forward whether you're ready or not. StellarOS isn't borrowing Stellaris' skin — it's borrowing its **soul.**

---

## 1. The Resource Economy

### Stellaris
Five core resources form the backbone: **Energy Credits** (the universal currency, pays upkeep on everything), **Minerals** (raw materials for building), **Alloys** (refined materials for ships and advanced structures), **Consumer Goods** (keeps Pops happy), **Food** (keeps Pops alive and growing). Plus strategic resources (rare, unlocked later, enable advanced capabilities).

Everything in Stellaris both **produces** and **consumes** resources. A building doesn't just cost minerals to build — it costs energy every month to maintain. A fleet doesn't just cost alloys to build — it eats energy every month in upkeep. If your monthly energy income goes negative, things start shutting down.

The top bar shows all resources with their **monthly net** — production minus consumption. Green = surplus. Red = deficit. The player's primary job is keeping everything green or at least managing deficits intentionally.

### StellarOS Mapping

| Stellaris Resource | StellarOS Resource | Produces From | Consumed By | Visual When Deficit |
|-------------------|-----------------|---------------|-------------|-------------------|
| **Energy Credits** | **Cognitive Bandwidth** | Rest, completed tasks (dopamine), gym, sleep quality | Every active node (upkeep), every in-progress task, every unresolved situation | Central brain flickers, node glow dims system-wide, everything feels "thin" |
| **Minerals** | **Emotional Resilience** | Energizing nodes, family time, hobbies, wins/milestones, nature | Draining nodes, conflict, unresolved situations, guilt from neglected areas, stress | Node colors shift cooler/bluer, connections lose warmth, ambient particles slow |
| **Alloys** | **Willpower / Focus** | Deep sleep, gym consistency, meditation, completed deep-work sessions | Completing milestones, making big decisions, handling crises, context-switching (expensive!) | Milestone completion stalls, items stay in_progress longer, decision fatigue visible |
| **Consumer Goods** | **Satisfaction / Happiness** | Hobbies, family adventures, Dhiya time, date nights, personal interests (Dota, chess, cars) | Maintained by having active leisure/relationship nodes. Drops when all attention goes to Work/Business | Faction approval drops (internal tensions rise), node pulse patterns become erratic |
| **Food** | **Growth Capacity** | Learning (books, courses, experiments), networking, skill acquisition | Expanding into new areas — new projects, new responsibilities, scaling existing nodes | Foundation node stagnates, can't spawn new sub-nodes, "empire" stops growing |
| **Strategic Resources** | **Rare Capabilities** | Completing Tradition trees (Ascension), deep expertise, unique life experiences | Unlocking advanced features — automation, delegation, passive income streams | Can't access advanced "buildings" (life capabilities) without prerequisites |

### The Monthly Net (Top HUD Bar)

Just like Stellaris, the top bar should show **net flow** for each resource, not just current level:

```
Cognitive Bandwidth: 72/100  [+3/day]  ← green, recovering
Emotional Resilience: 45/100 [-2/day]  ← red, declining (draining nodes outweigh energizing)
Willpower/Focus: 28/100     [+1/day]  ← yellow, slowly recovering (gym streak resumed)
Satisfaction: 61/100         [-1/day]  ← yellow, drifting down (no family time this week)
Growth Capacity: 55/100      [+0/day]  ← grey, stagnant (no learning activity)
```

The **net indicator** (+3/day, -2/day) is critical. A resource at 45 but trending +3 feels different from 45 trending -2. Stellaris players check the trend constantly. Bharat should too.

### Upkeep Costs Are Real

Every node in active status has a bandwidth_cost. The sum of all active node costs is your "empire upkeep." If total upkeep exceeds your bandwidth regeneration, you're running a deficit. Things start to degrade — slowly at first, then faster.

Stellaris players learn this the hard way: building too fast, expanding too much, and suddenly energy goes -50/month and the whole empire collapses. StellarOS should make this equally visible. "You have 6 active projects consuming 87 bandwidth. Your daily regeneration is 65. You are running a deficit of -22/day."

---

## 2. Pops → Attention Units

### Stellaris
Pops are the fundamental workforce. They don't produce resources by existing — they produce by **working jobs.** An unemployed Pop costs housing and food but produces nothing. Too many unemployed Pops causes unrest and eventually rebellion.

Stellaris 4.0 introduced the **Workforce system** — instead of tracking individual Pops, it tracks "Workforce Efficiency." Pops are grouped by species, strata, and ethic. This is more efficient computationally and conceptually: you manage **capacity allocation**, not individual units.

Key Pop behaviors:
- Pops **prefer higher-strata jobs.** A Specialist job opening will pull a Pop from a Worker job, leaving the Worker job empty.
- **Housing** constrains growth. No housing = no new Pops.
- **Amenities** affect happiness. Low amenities = low stability = low output.
- Pops have **ethics** that determine which factions they join and what policies make them happy/unhappy.

### StellarOS Mapping

Your "Pops" are **attention units** — discrete chunks of productive focus per day. You have maybe 10-12 hours of real productive capacity. Each hour assigned to a node is a Pop working a Job.

| Stellaris Pop Concept | StellarOS Equivalent | Mechanic |
|----------------------|-------------------|----------|
| Pop count | Hours of productive attention per day (~10-12) | Hard cap. Can't manufacture more. Sleep and health affect the number. |
| Unemployment | Unassigned attention — scrolling, context-switching, "what should I do" paralysis | Costs Satisfaction (guilt/unease) without producing anything |
| Pop growth | Can't grow more hours. But can increase **efficiency** per hour through deep work, flow states, better tools | Efficiency multiplier on attention_log entries |
| Housing | Calendar/schedule capacity — you can't fit a 13th hour into 12 | Time block slots. Overcommitting = homelessness (no time for anything) |
| Amenities | Breaks, leisure, micro-joys throughout the day | Low amenities = low stability across all nodes = lower output everywhere |
| Pop strata (Worker/Specialist/Ruler) | Task strata (Maintenance/Deep Work/Strategic) | Attention naturally gravitates UP. You'll abandon gym for Zaasu coding, and abandon Zaasu coding for StellarOS architecture. Must manually lock Worker tasks. |
| Pop happiness | Daily satisfaction score | Composite of: how many factions are satisfied, amenities level, unresolved situations count |

### The Strata Problem (Critical Insight)

In Stellaris, if you build a Specialist building, a Worker Pop will **automatically promote** to fill it — leaving the Worker job empty. You then have no one mining minerals. Your economy collapses because you have too many scientists and no miners.

This is exactly what happens to Bharat:
- You create a "Strategic" task (design StellarOS architecture) → your attention promotes from "Worker" tasks (gym, Dhiya plan, bookkeeping) to fill it
- Gym gets skipped. Dhiya plan gets skipped. Zoho books pile up. But the "cool" work gets done.
- The fix in Stellaris: **job priority locking.** You manually prevent Pops from promoting by setting Worker jobs to priority. They can't leave even if Specialist slots open.
- StellarOS fix: **locked time blocks.** Certain daily blocks are designated "Worker priority" and can't be overridden. Morning gym is locked. Evening Dhiya time is locked. The system should warn: "You're trying to schedule Zaasu coding during a locked Worker block."

---

## 3. Jobs → Task Types

### Stellaris
Jobs are created by Districts and Buildings. Each job has a stratum (Worker, Specialist, Ruler), produces specific resources, and consumes specific resources. A Researcher job produces Research but consumes Consumer Goods. A Metallurgist produces Alloys but consumes Minerals.

Job efficiency is affected by: Pop happiness, planet stability, planet designation bonuses, traditions, technologies, governor traits.

### StellarOS Mapping

| Stellaris Job | StellarOS Task Type | Produces | Consumes | Example |
|--------------|------------------|----------|----------|---------|
| **Farmer** (Worker) | Health maintenance | Growth Capacity, base Bandwidth regen | Time, mild Willpower | Gym session, meal prep, sleep routine |
| **Technician** (Worker) | Administrative upkeep | Bandwidth stability (prevents decay) | Time, low Focus | Email, bookkeeping, Zoho updates, routine reviews |
| **Miner** (Worker) | Raw execution | Progress on items (move tickets from todo → done) | Bandwidth, time | Bug fixes, routine Zaasu tickets, Dhi's inventory management |
| **Clerk** (Worker) | Social/relational upkeep | Satisfaction, Resilience | Time, low Bandwidth | Catching up with friends, LinkedIn engagement, family calls |
| **Researcher** (Specialist) | Learning & experimentation | Growth Capacity, long-term capability | Bandwidth, Consumer Goods (takes energy from leisure) | Reading, courses, OpenClaw experiments, new skill acquisition |
| **Metallurgist** (Specialist) | Deep building work | Progress on major milestones, high-quality output | Minerals (Resilience) + Bandwidth | Zaasu feature development, Mart pilot design, StellarOS coding |
| **Culture Worker** (Specialist) | Creative & identity work | Satisfaction, Resilience, Unity | Bandwidth, time | Journaling, content creation, LinkedIn thought pieces, identity reflection |
| **Administrator** (Ruler) | Strategic decision-making | Unity (direction), faction management | High Willpower, high Bandwidth | Priority setting, life decisions, career pivots, financial planning |
| **Enforcer** (Ruler) | Boundary enforcement | Stability across all nodes | Willpower | Saying no to new commitments, enforcing locked time blocks, cutting projects |

### The "No Empty Jobs" Rule

Stellaris penalizes you for having more job slots than Pops. Empty buildings are waste — they cost upkeep for zero output.

StellarOS equivalent: **don't create more commitments (items with status: todo) than you have attention to serve.** Every unfilled commitment is an empty job slot. It costs emotional overhead (you know it's sitting there undone) without producing anything. The backlog should have a "job capacity" metric: "This node has 12 todo items but only receives ~3 hours/week of attention. Estimated time to clear: 8 weeks at current rate."

---

## 4. Districts → Time Blocks

### Stellaris
Districts are the physical infrastructure of a planet. Four main types: **City** (housing + clerks), **Generator** (energy), **Mining** (minerals), **Farming** (food). Planet size limits total districts. You specialize planets by concentrating district types.

The key constraint: **you can only build so many.** A size 15 planet has 15 district slots. Period. You must choose what to build because you can't have everything.

### StellarOS Mapping

Your day has a fixed number of "district slots" — time blocks. Roughly:

```
BHARAT'S DAILY PLANET (Size: ~16 waking hours)
┌────────────────────────────────────────────────┐
│ Morning (6-9am)     │ 3 slots                  │
│ Work Core (9am-1pm) │ 4 slots                  │
│ Work Late (2-6pm)   │ 4 slots                  │
│ Evening (6-9pm)     │ 3 slots                  │
│ Night (9-11pm)      │ 2 slots                  │
│                     │ Total: 16 district slots  │
└────────────────────────────────────────────────┘
```

Each slot can be assigned a district type:

| District Type | Stellaris Equivalent | What It Produces | Best Time Block |
|--------------|---------------------|-----------------|-----------------|
| **Generator Block** | Generator District | Bandwidth regeneration, Willpower regen | Morning (gym, sleep recovery, morning routine) |
| **Mining Block** | Mining District | Raw progress on tasks, execution output | Work Core (9am-1pm when focus is highest) |
| **Research Block** | Research building | Growth Capacity, new capabilities | Night (9-11pm, OpenClaw tinkering, reading) |
| **City Block** | City District | Satisfaction, Housing (capacity for more) | Evening (family, Dhiya, Amu, leisure) |
| **Farming Block** | Farming District | Growth Capacity base, health maintenance | Morning (gym), Evening (family dinner = nourishment literal + emotional) |

**The Stellaris lesson: don't overbuild.** If you only have 2 hours of evening time, don't schedule 4 hours of evening activities. That's building districts on a planet that's too small. It creates unfilled jobs (broken promises to yourself) and costs more than it produces.

---

## 5. Planetary Designation → Node Designation

### Stellaris
Mid-game, you designate planets: Mining World (+20% mineral output), Tech World (+20% research output), Forge World (+20% alloy output), etc. A designated planet gets bonuses to matching activities and implicit penalties to non-matching ones (because you're concentrating resources).

Advanced designations unlock with technology: Ecumenopolis (all-city mega planet), Ring World (artificial habitat), Habitat (space station).

The critical insight: **generic planets are inefficient.** A planet doing a little of everything is worse than three planets each doing one thing well. Specialization is power.

### StellarOS Mapping

Node designations aren't just labels — they should carry **mechanical bonuses and costs:**

| Designation | Stellaris Equivalent | Bonus | Cost | Visual |
|------------|---------------------|-------|------|--------|
| **Deep Work** | Forge World | +30% progress on milestones. Tasks complete faster. | +50% bandwidth cost. Drains Focus rapidly. Can't sustain for more than 2-3 weeks. | Intense glow, tight pulse, hot colors (orange/white). Energy streams visibly flowing in. |
| **Maintenance** | Mining World | Stability naturally increases. Backlog stays healthy with minimal attention. | -30% milestone progress. No big breakthroughs happen. | Steady dim glow, slow pulse, cool stable colors (blue/green). Quiet. |
| **Creative Flow** | Tech World | +50% idea generation. New sub-nodes more likely to spawn. Insights connect across nodes. | +20% bandwidth, +30% Resilience drain (creative work is emotionally expensive). | Shifting colors, irregular pulse (not erratic — organic), sparkle particles. |
| **Dormant** | Uncolonized but claimed | Near-zero bandwidth cost. Preserved but not progressing. | Zero output. No progress. If left dormant too long, stability slowly decays (neglect). | Ghost glow — translucent, barely visible. Slow drift outward. |
| **Sprint** (edict, not permanent) | Martial Law edict | +100% progress for duration. Everything moves fast. | Costs Willpower rapidly. Resilience tanks. Cannot sustain beyond edict timer. Burnout risk. | Pulsing red/orange, accelerated particle flow, visible energy drain from central brain. |

### Specialization Over Generalization

Stellaris teaches that spreading equally across all planets produces a weak empire. You need to **specialize.**

StellarOS equivalent: not every node deserves equal attention. Zaasu in sprint mode while Dhi's Accessories is in maintenance mode while Street League is dormant — that's good specialization. Trying to give all three "Deep Work" designation simultaneously is like trying to make every planet a Forge World: you run out of alloys (Focus) and everything stalls.

The node designation should be a **conscious choice** logged in the decision journal, not a default. "I'm putting Zaasu into Deep Work for the next 2 weeks. Street League moves to Dormant. Dhi's stays Maintenance." That's an empire management decision.

---

## 6. Stability → Node Stability

### Stellaris
Every planet has a Stability score (0-100). High stability = production bonuses. Low stability = production penalties, and below 25 triggers revolts.

Stability is affected by: Pop happiness, amenities, housing, crime, governor traits, decisions, events. It's a composite health metric for the planet.

### StellarOS Mapping

Every trackable node has a Stability score. It's the single best indicator of "is this area of my life healthy?"

**Stability formula:**

```
Node Stability = Base(50)
  + Backlog Health bonus    (backlog is manageable, not overflowing)
  + Recency bonus           (engaged recently, not neglected)
  + Sentiment bonus         (feels energizing, not draining)
  + Designation match bonus (current work matches the node's designation)
  - Overdue penalty         (items past their expected completion)
  - Neglect penalty         (days since last activity × decay rate)
  - Blocker penalty         (unresolved blockers dragging things down)
  - Faction disapproval     (related internal faction is unhappy)
```

**Stability thresholds:**

| Range | State | Visual | Effect |
|-------|-------|--------|--------|
| 80-100 | Thriving | Bright, warm glow. Smooth pulse. Particles radiate outward. | +20% output bonus. Connected nodes get +5% stability boost. |
| 60-79 | Stable | Normal glow. Steady pulse. | Normal output. No bonuses or penalties. |
| 40-59 | Stressed | Dimmer, cooler colors. Pulse becomes slightly irregular. | -10% output. Starts consuming Resilience. |
| 20-39 | Critical | Pulsing red. Erratic movement. Storm particles nearby. | -30% output. Heavy Resilience drain. Attention Alert triggers. |
| 0-19 | Crisis | Dark, flickering. Connection tubes thin and crack. | No output. Active Resilience drain. Adjacent nodes affected. Demands immediate attention (Stellaris equivalent: revolt). |

### The Cascade Effect

Stellaris: when one planet revolts, it affects nearby systems. Trade routes break. Fleet supply weakens. Neighboring planets lose stability.

StellarOS: when one node enters Crisis, connected nodes lose stability. If Health goes to Crisis → Willpower regeneration stops → Deep Work nodes can't complete milestones → Business nodes stall → Financial nodes lose progress → Emotional Resilience drops → more nodes destabilize. This is the cascade.

The visual: watching a cascade in the 3D map should be like watching a system failure propagate through a neural network. Darkness spreading from one node outward through the connections. Terrifying — but honest.

---

## 7. Trade Routes → Value Collection

### Stellaris
Planets generate Trade Value (representing civilian economy). But trade value doesn't automatically reach your treasury. It must be **collected** by starbases with Trade Hub modules and **routed** through trade routes back to the capital. Unprotected routes leak value to piracy. The longer the route without protection, the more piracy accumulates (up to 25% loss over 10 years).

Trade Policy determines what collected trade value converts into: pure Energy Credits, or a mix of Energy + Consumer Goods, or Energy + Unity.

### StellarOS Mapping

Nodes generate value constantly — ideas, insights, progress, emotional returns. But that value only counts when it's **captured and routed** back to your central awareness.

| Stellaris Trade Concept | StellarOS Equivalent | Implementation |
|------------------------|-------------------|----------------|
| Trade Value generation | Raw value created by working on any node — ideas, progress, insights, emotional rewards | Implicit in activity. Exists whether captured or not. |
| Starbase collection | **Logging/capture mechanism** — the act of writing down what happened, what you learned, what you decided | activity_log entries, decision journal, health logs, learning_log. Each log entry = collected value. |
| Trade route to capital | **Reflection and integration** — connecting node-level activity back to the central brain/overview | Weekly review (snapshot), daily quick-capture, API calls from external tools |
| Piracy (value leakage) | **Context loss** — insights forgotten, decisions unmemorialized, progress unrecorded | The 2am Mart idea you didn't write down. The Zaasu architecture decision you made verbally but never logged. Gone. |
| Trade Hub modules (extend collection range) | **Quick-capture tools** — ways to log from anywhere quickly | API endpoints, Cowork quick-log, mobile input, voice note → transcription pipeline |
| Trade Policy (what value converts to) | **What you optimize for** — same activity can produce different "resources" depending on your current policy | "Wealth generation" policy: all activity logs weighted toward financial impact. "Growth" policy: weighted toward learning/capability. "Balance" policy: distributed. |

### Piracy Prevention

In Stellaris, you prevent piracy by building starbases along trade routes. Every gap in coverage leaks value.

StellarOS: every gap in your capture system leaks value. The most common leaks:

- **No quick-capture from mobile** → ideas during commute are lost
- **No post-meeting log habit** → decisions and context from work meetings evaporate
- **No end-of-day reflection** → the day's emotional texture disappears
- **No commit-message discipline** → why you made technical decisions is lost

Phase 3 (Tool Integration) should prioritize building "starbases" — quick, low-friction capture points at every part of the day. The API endpoint `POST /api/node/:id/items` is the starbase. Claude Code calling it post-session is the trade route. n8n workflows routing WhatsApp saves to Supabase is extending trade hub range.

---

## 8. Technology & Traditions → Personal Growth

### Stellaris
**Technology** is researched by scientist Pops working Researcher jobs. Three branches: Physics, Society, Engineering. Each tech unlocks buildings, ship components, policies, or edicts. Research is semi-random: you pick from 3 options per branch, weighted by your scientist's expertise.

**Traditions** are purchased with Unity (produced by Ruler Pops and certain buildings). Seven tradition trees: Expansion, Domination, Prosperity, Discovery, Harmony, Diplomacy, Supremacy. Completing a full tree unlocks an **Ascension Perk** — a powerful permanent upgrade that fundamentally changes your empire's capabilities.

Ascension paths are game-defining:
- **Genetic Ascension** → modify your species' traits
- **Synthetic Ascension** → become robots (immortal, no food needed, different ethics)
- **Psionic Ascension** → unlock the Shroud (psychic powers, risk/reward)

### StellarOS Mapping

**Technology = Skills & Knowledge**

| Stellaris Tech Branch | StellarOS Branch | Examples | What It Unlocks |
|----------------------|---------------|----------|-----------------|
| Physics | Technical skills | React, Three.js, Supabase, AI/ML, data analysis | Better tooling for all projects. Higher efficiency on Specialist tasks. |
| Society | People & leadership skills | Product management, stakeholder alignment, parenting methods, relationship communication | Better faction management. Higher stability across social nodes. |
| Engineering | Systems & operations | Automation (n8n), CI/CD, financial modeling, habit systems | Infrastructure improvements. Lower upkeep costs. Better trade routes. |

Research is semi-random in Stellaris — you don't always get to pick exactly what you learn. Life mirrors this: sometimes you stumble onto a skill you didn't plan to learn. Anomalies (unexpected discoveries) can trigger new research paths.

**Traditions = Sustained Practice Paths**

| Tradition Tree | StellarOS Path | Milestones | Ascension Perk |
|---------------|-------------|------------|----------------|
| **Expansion** | Career Growth | Job promotions, new roles, salary milestones, LinkedIn influence | **Ascension: Industry Authority** — your professional opinion carries weight. Unlocks consulting income, speaking opportunities. Permanent Bandwidth bonus (confidence reduces cognitive overhead). |
| **Prosperity** | Financial Independence | Emergency fund, investment milestones, savings rate targets, passive income | **Ascension: Financial Freedom** — base anxiety removed. Permanent Resilience bonus. All nodes get stability boost (financial security reduces stress everywhere). |
| **Discovery** | AI & Technology Mastery | OpenClaw stack complete, first AI automation, first agent built, models fine-tuned | **Ascension: Augmented Intelligence** — AI tools amplify all nodes. Permanent efficiency bonus on every task type. Can "automate" Worker-strata tasks. |
| **Harmony** | Family & Relationships | Consistent Dhiya plan execution, regular date nights, family adventure completion rate | **Ascension: Inner Peace** — Satisfaction baseline permanently raised. Faction tensions reduced. Resilience regeneration doubled. |
| **Supremacy** | Health & Physical | 6-month gym streak, sleep consistency, energy level sustained above 7 | **Ascension: Physical Foundation** — Willpower regeneration permanently boosted. Bandwidth cap increases. Can sustain Sprint edicts longer without burnout. |
| **Domination** | Venture Building | Zaasu launched, first revenue, first 100 users, first profitable month | **Ascension: Venture Founder** — unlocks delegation capability. Can "transfer" bandwidth to others (hire/outsource). Empire sprawl penalty reduced. |
| **Diplomacy** | Community & Network | Mentorship relationships, strategic partnerships, community building | **Ascension: Network Effects** — information flows to you passively. Anomaly discovery rate increases. New opportunities spawn organically. |

**Ascension Perks are not badges.** In Stellaris, they fundamentally change gameplay mechanics. StellarOS Ascension Perks should **actually modify the system:**
- Financial Freedom ascension → all nodes get a permanent +10 stability boost (because financial stress is removed from the equation)
- Physical Foundation → bandwidth_cap increases from 100 to 120 (you literally have more energy)
- Augmented Intelligence → certain Worker tasks can be automated (n8n handles them), freeing attention units for Specialist work

---

## 9. Situations → Progressive Challenges

### Stellaris
Situations are **progressive events** with a bar from 0 to 100. They develop over time — positively or negatively depending on your actions. Some situations have multiple approach options that lead to different outcomes. Ignoring a situation lets it progress to a crisis point. Addressing it can reverse the progression.

Situations can have monthly progress that ticks automatically. Some are urgent (30-day timer). Some simmer for years.

### StellarOS Mapping

Situations replace binary "attention alerts" with nuanced, developing challenges:

| Stellaris Situation Feature | StellarOS Equivalent | Example |
|---------------------------|-------------------|---------|
| Progress bar (0-100) | Severity meter | "Fitness Decline" situation: Day 1 skipped = 10/100. Week skipped = 50/100. Two weeks = 80/100. |
| Monthly auto-progress | Daily tick based on inaction | Each day without gym adds +7 to the Fitness Decline bar. |
| Player intervention reverses progress | Positive action reduces severity | One gym session: -15 from the bar. Three consecutive days: -30. Situation resolved at 0. |
| Multiple approach options | Different ways to address the same situation | "Burnout Warning" situation: Option A) Sprint Edict off, switch to Maintenance. Option B) Take a full rest day. Option C) Delegate key tasks. Each has different resource costs and outcomes. |
| Situation chains | One resolved situation can trigger another | Resolving "Financial Anxiety" by getting a raise triggers "Lifestyle Inflation Risk" situation |
| Crisis threshold | Below 80 = warning. Above 80 = crisis mode. | "Relationship Drift (Amu)" at 85/100: date night is no longer optional, it's crisis intervention |

**Key situations to track from day 1:**

```
Fitness Decline         → triggers at: 3+ days no gym
                        → auto-progress: +7/day inactive, -15/day active
                        → crisis at 80: affects Willpower regen, cascades to other nodes

Relationship Drift      → triggers at: 14+ days no quality interaction with key person
                        → auto-progress: +3/day, -10 per meaningful interaction
                        → crisis at 80: Satisfaction tanks, Faction disapproval spikes

Backlog Overflow        → triggers at: node has >20 todo items
                        → auto-progress: +2/day while items accumulate
                        → crisis at 80: node stability drops to Critical, must triage

Creative Drought        → triggers at: 21+ days no learning_log entry
                        → auto-progress: +3/day, -20 per learning session
                        → crisis at 80: Growth Capacity stagnates, Foundation node dims

Financial Drift         → triggers at: 30+ days no finance review
                        → auto-progress: +2/day, -30 per review session
                        → crisis at 80: "Flying blind" — spending could be out of control

Sleep Debt              → triggers at: 3+ nights under 6 hours
                        → auto-progress: +10/night under 6hrs, -5/night over 7hrs
                        → crisis at 80: Bandwidth cap temporarily reduced by 30%
```

---

## 10. Factions → Internal Tensions

### Stellaris
Factions are groups of Pops with shared demands regarding governance. Each ethic produces a faction. Faction approval (0-100) is based on whether their demands are met. Low approval drains Unity. High approval generates bonus Unity. You can **promote** or **suppress** factions using Influence.

Factions have specific demands: "We want militarism" or "We want pacifism." Meeting demands raises approval. Contradicting demands lowers it. You can't please all factions simultaneously — they contradict each other. Managing faction balance is a core mid-game challenge.

### StellarOS Mapping

| Stellaris Faction Concept | StellarOS Equivalent | Mechanic |
|--------------------------|-------------------|----------|
| Faction | Internal drive/identity | The Builder, The Father, The Partner, The Investor, The Athlete, The Student |
| Faction approval (0-100) | Satisfaction score per internal drive | Calculated from attention allocation + node health in that drive's domain |
| Demands | What each drive needs to stay satisfied | See table below |
| Faction generates Unity when happy | Satisfied drives produce Resilience | When The Father is at 80+ approval, family-related stress drops, Resilience gets bonus |
| Faction drains Unity when unhappy | Unsatisfied drives drain Resilience (guilt, tension) | When The Athlete is at 20 approval, guilt about skipping gym actively erodes Resilience |
| Promote/Suppress (costs Influence) | Conscious priority setting (costs Willpower) | "This month I'm promoting The Builder and suppressing The Student" — logged as a decision |
| Factions contradict each other | Internal tensions are real | The Builder wants to code all night. The Father wants to be home by 6. Both can't be at 100%. |

**Faction Demands:**

| Faction | Core Demand | Key Metric | Satisfied When | Angry When |
|---------|------------|------------|----------------|------------|
| **The Builder** | Ship features, see progress, close tickets | Specialist task completion rate | ≥3 meaningful commits/completions per week | Stalled backlogs, blocked items, no progress for >5 days |
| **The Father** | Quality Dhiya time, consistency with plan | Dhiya plan execution rate + attention_log on Family nodes | Evening plan executed ≥3 nights/week | Plan skipped ≥3 days in a row, Dhiya node in Dormant |
| **The Partner** | Connection with Amu, shared experiences | Interaction frequency + quality time logged | ≥1 meaningful date/activity per week | >2 weeks with no dedicated partner time |
| **The Investor** | FIRE progress, savings rate, portfolio growth | Monthly savings rate + financial review recency | Savings rate ≥30% + monthly review done | Overspending, no review in 30+ days |
| **The Athlete** | Gym consistency, energy, physical health | Gym days per week + energy level average | ≥3 gym sessions/week + energy avg ≥6 | <1 gym session/week or energy avg <4 |
| **The Student** | Learning, growth, new skills | Learning_log entries per month | ≥4 learning sessions/month (books, courses, experiments) | Zero learning activity for 21+ days |

**The Contradiction Map:**

Not all factions can be at 100% simultaneously. This is by design. The visual:

```
The Builder (80%) ←──conflict──→ The Father (60%)
     "Wants to code tonight"    "Wants Dhiya chess time"

The Investor (75%) ←──conflict──→ The Builder (80%)
     "Save everything"          "Invest in Zaasu hosting"

The Student (40%) ←──conflict──→ The Athlete (55%)
     "Stay up reading"          "Sleep by 10pm"
```

Surfacing these contradictions honestly — as a visual tension map overlaid on the 3D galaxy — is more valuable than pretending you can do everything. Stellaris players know: you pick 2-3 factions to please and manage the rest. Life works the same way.

---

## 11. Empire Sprawl → Life Complexity Tax

### Stellaris
Empire Sprawl increases with every system claimed, planet colonized, district built, and pop grown. High sprawl increases the cost of: research, traditions, edicts, leaders. It's the game's way of saying: **growth has overhead.**

A large empire with 200 sprawl over the cap pays significantly more for every technology, every tradition, every edict. Some empires are deliberately kept small and tall (few planets, highly developed) rather than wide (many planets, thinly spread).

Administrative Capacity can be increased with buildings and technologies, but sprawl always grows faster if you expand carelessly.

### StellarOS Mapping

**Every node you keep active has a sprawl cost** — not just the bandwidth upkeep, but the meta-cost of carrying it in your mind.

```
Empire Sprawl = (Active nodes × 5) + (Total todo items × 1) + (Active situations × 10) + (Unresolved decisions × 15)

Administrative Capacity = Base(50) + (Completed traditions × 10) + (Automation bonuses) + (Delegation bonuses)

Sprawl Penalty = max(0, Empire Sprawl - Administrative Capacity) × 0.01

Effect of Sprawl Penalty:
  - All research (learning) takes (1 + Sprawl Penalty) × longer
  - All traditions (growth paths) cost (1 + Sprawl Penalty) × more attention
  - All edicts (sprints, decisions) cost (1 + Sprawl Penalty) × more Willpower
```

**Why this matters:** This is why you feel scattered. Your empire sprawl is high (6 active projects, dozens of todo items, multiple unresolved situations, scattered tools) and your administrative capacity hasn't grown to match. The solution isn't "do more" — it's either reduce sprawl (Dormant mode, cutting projects, clearing backlogs) or increase admin cap (build better systems, automate, delegate).

**Tall vs. Wide empires:**
- **Wide play** (Bharat currently) = many projects, thin attention each, high sprawl, everything progresses slowly
- **Tall play** (recommended) = fewer active projects, deep attention each, low sprawl, things actually ship

The visual: sprawl could be shown as a subtle "fog" or "static" that thickens at the edges of the 3D map as sprawl increases. When sprawl is well-managed, the universe is crisp and clear. When it's overloaded, edges blur, particles slow down, the whole scene feels "heavy."

---

## 12. Edicts → Life Edicts

### Stellaris
Edicts are temporary empire-wide or planet-specific bonuses that cost resources (usually Unity or Energy) and have a duration. Some are toggled (ongoing cost), some are one-shot. Ambition Edicts (endgame) are extremely powerful but extremely expensive.

Examples: "Encourage Free Thought" (+10% research speed, costs Unity/month), "Capacity Subsidies" (+20% planet build speed, costs Energy/month), "Map the Stars" (anomaly discovery chance +10%).

### StellarOS Mapping

| Edict | Scope | Effect | Cost | Duration | Stellaris Equivalent |
|-------|-------|--------|------|----------|---------------------|
| **Sprint Mode** | Single node | +100% progress rate on that node | -5 Willpower/day, -3 Resilience/day | 1-2 weeks max | Capacity Subsidies |
| **Deep Rest** | Empire-wide | +200% Willpower regen, +100% Resilience regen | All nodes pause (zero output) | 1-3 days | Recovery edict |
| **Focus Lock** | Empire-wide | Only 2 nodes can be in active status. All others forced to Maintenance or Dormant. | Reduces available "districts" | Until cancelled | Martial Law |
| **Delegation Wave** | Multiple nodes | Reduce bandwidth cost by routing work to others | Costs financial resources + requires capable delegates | Ongoing while active | Encourage Free Thought |
| **Learning Sprint** | Foundation node | +50% learning velocity, Growth Capacity doubles | Other Specialist nodes get -20% output | 1 month | Map the Stars |
| **Family First** | Family & Friends branch | All family-related nodes get +30% stability bonus. The Father and The Partner factions get +20 approval. | Work/Business nodes get -15% output. The Builder faction -10 approval. | 1 month | Social Welfare Programs |
| **FIRE Austerity** | Financial nodes | Savings rate forced to 40%+. All discretionary spending flagged. | Satisfaction -15 (less fun money). But financial nodes glow brighter. | Ongoing | Nutritional Plenitude (inverted) |
| **Audit & Triage** | Empire-wide | Review every todo item. Archive stale items. Clear resolved situations. Reduce sprawl. | 1-2 hours of focused triage time. Costs Bandwidth. | One-shot | Administrative reform |

---

## 13. Anomalies → Life Discoveries

### Stellaris
During exploration, Science Ships discover anomalies — unexpected findings that require a scientist to investigate. Higher-level scientists succeed faster and are less likely to fail. Anomalies yield: resources, special projects, storyline events, or unique planet modifiers. Some anomalies chain into multi-step stories.

### StellarOS Mapping

Anomalies are **unplanned discoveries** that can alter your trajectory. They appear as glowing markers on the map — visible but unresearched until you invest time.

| Anomaly Type | StellarOS Equivalent | Example | Resolution |
|-------------|-------------------|---------|------------|
| Resource deposit | Unexpected financial windfall | Tax refund, bonus, unexpected client payment | Log it, allocate it (savings? investment? treat?) |
| Special project | Serendipitous opportunity | "Hey, want to speak at this conference?" or "My friend needs a PM consultant" | Investigate: is this worth the sprawl increase? |
| Story chain | Multi-step unplanned journey | Started tinkering with OpenClaw → led to AI skills → led to StellarOS concept → potentially leads to open-source project | Follow the chain. Each step is an anomaly that reveals the next. |
| Dangerous anomaly (can fail) | Risky opportunity | "Join this startup?" or "Invest in this" | Higher "scientist level" (experience + data) = better odds. Log the risk assessment in decision journal. |
| Unique modifier | Life-changing insight | A conversation that permanently changes how you think about parenting, or a book that restructures your worldview | Apply the modifier to the relevant node. Permanent stat change. Log as cosmic event. |

The key Stellaris insight: **anomalies reward exploration.** Empires that never send out science ships never find them. StellarOS equivalent: time spent exploring (reading, conversations, tinkering, traveling) isn't "unproductive" — it's anomaly scanning. The Growth Capacity resource and the Discovery tradition tree should explicitly value this.

---

## 14. War & Diplomacy → External Relationships

### Stellaris
Not all interactions are internal. Empires have relationships with other empires: rivals, allies, federations, tributaries. War is expensive and destructive. Diplomacy can achieve goals without war. Federations provide collective bonuses.

### StellarOS Mapping (light touch — this is a personal tool)

| Stellaris Concept | StellarOS Equivalent |
|------------------|-------------------|
| Allied empire | Key supporters — Amu, family, close friends, mentor relationships |
| Rival empire | Competing demands — other people's expectations, societal pressure, comparison trap (LinkedIn keeping-up) |
| Federation | Partnerships — Zaasu co-founder relationship, Mart team, EvolveviaAI clients |
| Trade agreements | Mutual benefit relationships — mentorship (give and receive), networking (share and learn) |
| War exhaustion | Conflict fatigue — how much energy a disagreement or external pressure has drained |
| Diplomatic weight | Influence/reputation — LinkedIn presence, professional standing, community position |

This layer is lighter because StellarOS is personal. But the framing helps: not everything that pulls on you is your own node. Some demands come from **external empires** (other people's priorities). Recognizing "this task isn't from my empire, it's diplomatic pressure from an allied empire" changes how you prioritize it.

---

## 15. Endgame Crises → Life Crises

### Stellaris
Three endgame crises can spawn: **The Prethoryn Scourge** (extragalactic invaders), **The Contingency** (rogue AI), **The Unbidden** (extradimensional entities). They arrive whether you're ready or not. They threaten to destroy everything. The entire galaxy must respond.

Crises have escalation phases. They can be detected early. Preparation matters enormously. An unprepared empire is destroyed. A prepared empire survives and becomes stronger.

### StellarOS Mapping

| Stellaris Crisis | StellarOS Equivalent | Signals | Preparation |
|-----------------|-------------------|---------|-------------|
| **Prethoryn Scourge** (overwhelming external force) | Job loss, health crisis, family emergency | Situations developing in background, stability declining, financial buffer thinning | Financial Freedom ascension (savings buffer), Health ascension (physical resilience), strong support network |
| **The Contingency** (internal system failure) | Burnout, mental health crisis, relationship breakdown | Multiple factions at <20% approval, Willpower at 0, Resilience at 0, multiple situations at crisis threshold | Balance policies, regular Deep Rest edicts, faction contradiction management |
| **The Unbidden** (unexpected external disruption) | Market crash, pandemic, geopolitical disruption, unexpected opportunity that upends everything | Anomaly detection, news awareness, financial diversification | Diversified nodes (not everything depends on one income), liquid savings, adaptable skills |

**Post-crisis restructuring:** After a Stellaris crisis, the galaxy is different. Empires that survived are stronger. StellarOS equivalent: after a life crisis, the orbit_shift cosmic event fires. Multiple nodes reposition simultaneously. Some are stronger (you gained resilience, perspective, new priorities). Some are gone (project abandoned, relationship ended). The time-travel system lets you see: "this is who I was before the crisis, and this is who I became after."

---

## 16. The Galaxy Map → The Neural Map

### Stellaris
The galaxy map is the primary view. Hundreds of stars, systems, hyperlane connections, borders, trade routes — all visible simultaneously. You can zoom from full galaxy → single system → single planet. The map communicates information through color, icons, borders, and movement.

Map modes overlay different information: political map, trade routes map, expansion map, opinion map. Each reveals a different layer of the same geography.

### StellarOS Mapping — Map Modes

| Stellaris Map Mode | StellarOS Map Mode | What It Shows |
|-------------------|-----------------|---------------|
| Default (political) | Default Neural Map | Nodes colored by branch, sized by importance, positioned by engagement distance |
| Trade routes | Value Flow | Visible flows of attention, money, ideas between nodes. Shows where value is being created and collected. |
| Expansion planner | Growth Potential | Highlights nodes with high Growth Capacity, shows where new sub-nodes could spawn, dim nodes with no growth headroom |
| Diplomacy | Relationship Web | People satellites visible around nodes, orbit distances shown, drift warnings highlighted |
| Military | Situation Map | All active situations shown with severity. Crisis zones pulsing. Stable areas calm. |
| Faction | Internal Tensions | Faction approval overlaid on map. Nodes colored by which faction they serve. Contradiction lines visible. |
| Economic | Economy Layer | Financial flows, income/expense streams, FIRE gravitational field, venture drain/generate colors |
| Attention Heatmap | Attention Heatmap | Time-based heat overlay showing where focus actually went this week/month |

Toggle between these modes with keyboard shortcuts or the bottom nav bar. Each mode tells a different story about the same life.

---

## Implementation Priority

Not everything here needs to be in MVP. Here's what maps to each build phase:

**Phase 1 (MVP):** Resources (top bar with 3 core resources + net flow), Nodes with designation + stability, Basic upkeep math, Zoom levels (galaxy → system → planet), Default map mode

**Phase 2:** Situations (progressive challenges), Cosmic events, Time travel, Ghost nodes, Map modes (situation map, default)

**Phase 3:** Trade routes (value collection via logging), Quick-capture starbases (API integration), Automated upkeep updates from git hooks

**Phase 4:** Factions (internal tensions), Faction approval mechanics, Contradiction map, Sprawl calculation, Attention heatmap mode, Situation chains

**Phase 5:** Economy map mode, Financial flows, FIRE gravitational field, Trade policy equivalent

**Phase 6:** Traditions & Ascension paths, Ascension perks with mechanical effects, Anomaly system, Full map mode suite, Crisis detection

---

## Summary Table: Complete Mapping

| # | Stellaris System | StellarOS System | Core Mechanic |
|---|-----------------|---------------|---------------|
| 1 | Resources (Energy, Minerals, Alloys, Consumer Goods, Food) | Cognitive Bandwidth, Emotional Resilience, Willpower/Focus, Satisfaction, Growth Capacity | Production and consumption. Every node both produces and consumes. Monthly net shown in top bar. |
| 2 | Pops | Attention Units (hours/day) | Finite. Can't grow more. Can improve efficiency. Prefer higher-strata work. |
| 3 | Jobs (Worker/Specialist/Ruler) | Task Strata (Maintenance/Deep Work/Strategic) | Attention gravitates up. Must manually lock Worker tasks. |
| 4 | Districts | Time Blocks | Fixed capacity per day. Overbuilding = broken promises. |
| 5 | Planetary Designation | Node Designation | Specialize for bonuses. Generic = inefficient. |
| 6 | Stability | Node Stability (0-100) | Composite health. Cascades when critical. |
| 7 | Trade Routes | Value Collection (logging habits) | Value exists only when captured. Piracy = context loss. |
| 8 | Technology | Skills & Knowledge | Three branches. Unlocks capabilities. |
| 9 | Traditions + Ascension | Growth Paths + Life Perks | Complete a path → permanent mechanical upgrade. |
| 10 | Situations | Progressive Challenges | Severity bar. Auto-progresses. Intervention reverses. |
| 11 | Factions | Internal Tensions | Competing drives. Can't please all. Must choose. |
| 12 | Empire Sprawl | Life Complexity Tax | More active nodes = higher overhead on everything. |
| 13 | Edicts | Life Edicts | Temporary bonuses with real costs. |
| 14 | Anomalies | Life Discoveries | Reward exploration. Unplanned but valuable. |
| 15 | War & Diplomacy | External Relationships | Not all demands are internal. Some are diplomatic pressure. |
| 16 | Crises | Life Crises | Existential threats. Preparation matters. Post-crisis = orbit_shift. |
| 17 | Galaxy Map modes | Neural Map modes | Same data, different overlays. Each tells a different story. |

---

*This document is the game design bible. Every feature built should pass the test: "Does this feel like managing an empire in Stellaris, applied to managing a life?"*
