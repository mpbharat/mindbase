# Bharat's Workflow System

## The Problem
Too many tools, no clear "home base." Context scattered across Claude.ai, Cowork, Perplexity, Claude Code CLI, OpenClaw, and more. Decision fatigue before work even starts.

## The Fix: Three Bases, Clear Lanes

```
┌─────────────────────────────────────────────────────────┐
│                    BHARAT'S TOOL MAP                    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   COWORK     │  │  CLAUDE CODE │  │   OPENCLAW   │  │
│  │  (Mac App)   │  │    (CLI)     │  │  (Home PC)   │  │
│  │              │  │              │  │              │  │
│  │ Command      │  │ Zaasu Dev    │  │ Local AI     │  │
│  │ Center       │  │ Only         │  │ Lab          │  │
│  │              │  │              │  │              │  │
│  │ Strategy     │  │ Code         │  │ Experiments  │  │
│  │ Documents    │  │ Tests        │  │ Agents       │  │
│  │ Research     │  │ Git          │  │ LinkedIn     │  │
│  │ Planning     │  │ Deploy       │  │ Content*     │  │
│  │ All projects │  │              │  │ Tinkering    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ▲                  ▲                ▲           │
│         │                  │                │           │
│    Daily driver      When coding       When home       │
│    (work hours)      Zaasu only        (evenings/      │
│                                        weekends)       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              DEMOTED / SUPPORT ONLY             │    │
│  │  Claude.ai web → throwaway questions only       │    │
│  │  Perplexity    → cited research when needed     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Base 1: Cowork (Mac App) — Command Center
**When:** Daily driver, work hours and on-the-go
**Use for:** Everything that isn't writing Zaasu code or local AI experiments.

- Mart strategy, GTM docs, pilot tracking, presentations
- Dhi's business planning, B2B outreach materials
- EvolveviaAI client work and proposals
- Street League analysis (if/when needed)
- LinkedIn content drafting and planning
- Personal planning, weekly reviews, goal tracking
- Research (market, competitors, tools)
- Document creation (decks, spreadsheets, PDFs, Word docs)
- Browser automation and web tasks
- Scheduled tasks and reminders
- Supabase access (Zaasu DB queries, monitoring)

**Why Cowork is the base:** File access, code execution, browser control, document creation, scheduling, web search, Supabase access — all in one. Remembers your folder. Builds on previous work.

---

## Base 2: Claude Code CLI — Zaasu Dev Only
**When:** Active Zaasu development sessions
**Use for:** Writing, testing, and shipping Zaasu code.

- Connected to the Zaasu repo
- Terminal-native, git-integrated
- Available on both Mac and Ubuntu (home PC)
- Connected to Claude Max plan

**Rule:** Don't pull coding into Cowork. Don't pull strategy into CLI.

---

## Base 3: OpenClaw (Home PC) — Local AI Lab
**When:** Evenings, weekends, when at the home desktop
**Use for:** AI experimentation, agent building, and content that comes from tinkering.

### What's Running
- OpenClaw agent platform (multi-agent, memory, skills)
- SearXNG (private search on localhost:8080)
- Clawmetry dashboard (http://100.76.193.90:8900 via Tailscale)
- 5-layer memory architecture (hot → warm → daily → long-term → active context)
- Security stack (skillguard, agentguard, skills-audit)
- Custom behavior protocols (WAL, Working Buffer, Compaction Recovery)

### What OpenClaw Is For
- Testing new AI agent patterns and skills
- Running local LLMs (when GPU support matures)
- Autonomous agent experiments
- LinkedIn content SOURCE: the tinkering you do here becomes the posts you draft in Cowork
- Building your AI builder credibility

### What OpenClaw Is NOT For
- Day job work (Mart, KPS)
- Business document creation
- Project management or planning
- Anything that needs to be shared with colleagues

---

## Demoted / Support Only
| Tool | New Role |
|------|----------|
| Claude.ai (web) | Quick throwaway questions only. Nothing you need to save or act on. |
| Perplexity | Specific research when you want cited sources. Not a workspace. |

---

## Decision Flowchart

```
New task arrives
    │
    ├── "Am I writing/debugging Zaasu code?"
    │       YES → Claude Code CLI
    │
    ├── "Am I experimenting with AI agents/skills/local models?"
    │       YES → OpenClaw (home PC)
    │
    └── Everything else → Cowork
            │
            ├── Need a document? → Cowork creates it
            ├── Need research? → Cowork searches it
            ├── Need to check Zaasu DB? → Cowork (Supabase)
            ├── LinkedIn post? → Cowork drafts it
            └── Weekly review? → Cowork runs it
```

---

## The Content Pipeline

```
OpenClaw tinkering → learnings/stories → Cowork drafts post → LinkedIn
    (home PC)          (raw material)       (Mac)              (publish)
```

Your LinkedIn content about AI setups, agent architecture, and local AI stack comes from your OpenClaw experiments. But the actual writing, editing, and scheduling of posts happens in Cowork where you have document tools and can save drafts.

---

## Folder Structure (in Cowork workspace)

```
Claude/
├── Personal/
│   ├── bharat-profile.md        ← Who you are, current situation
│   ├── projects.md              ← All projects, status, priorities
│   ├── workflow-system.md       ← This file
│   ├── openclaw-setup.md        ← Home PC stack documentation
│   └── weekly-reviews/          ← Weekly check-ins (future)
├── Mart/                        ← Day job work
│   ├── gtm/
│   ├── pilots/
│   └── pim/
├── Zaasu/                       ← Strategy docs only (code stays in CLI)
├── Dhis/                        ← Business planning, B2B materials
├── EvolveviaAI/                 ← Client proposals, site work
├── LinkedIn/                    ← Content drafts, post ideas, calendar
│   ├── drafts/
│   ├── openclaw-series/         ← Posts from your setup journey
│   └── ideas.md
└── StreetLeague/                ← Backburner, analysis if needed
```

---

## Weekly Rhythm (Suggested)

**Sunday evening (15 min):** Open Cowork → review the week → update projects.md → plan top 3 priorities for the week.

**Daily (work):** Open Cowork first. If the task is Zaasu code → open Claude Code CLI. Everything else stays in Cowork.

**Evenings/weekends (home):** OpenClaw tinkering. Document what you learn. That becomes LinkedIn content.

---

## Cross-Tool Bridges

- **Tailscale:** Connects home PC to Mac. Monitor Clawmetry from anywhere.
- **Supabase:** Accessible from both Cowork (monitoring/queries) and Claude Code CLI (Zaasu dev).
- **LinkedIn folder in Cowork:** Where OpenClaw learnings get turned into publishable content.
- **Personal/ folder:** Single source of truth for who you are and what you're working on. Referenced by both Cowork sessions and OpenClaw bootstrap files (USER.md).
