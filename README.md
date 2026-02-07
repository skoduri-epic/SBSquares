```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ███████╗██████╗     ███████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ███████╗   ║
║    ██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔══██╗██╔════╝   ║
║    ███████╗██████╔╝    ███████╗██║   ██║██║   ██║███████║██████╔╝█████╗     ║
║    ╚════██║██╔══██╗    ╚════██║██║▄▄ ██║██║   ██║██╔══██║██╔══██╗██╔══╝     ║
║    ███████║██████╔╝    ███████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║███████╗   ║
║    ╚══════╝╚═════╝     ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ║
║                                                                              ║
║                    Built with Claude Code + Agent Teams                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# SB Squares

A full-stack Super Bowl Squares pool app for 10 friends to play the classic football squares game — digitally, in real-time, for $0/month.

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  0   1   2   3   4   5   6   7   8   9    <-- Random Digits    │
  │ ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐                     │
  │ │ S │ A │ V │ R │ M │ D │ B │ K │ I │ S │  0                  │
  │ ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤                     │
  │ │ R │ M │ S │ B │ A │ K │ V │ D │ S │ I │  1                  │
  │ ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤                     │
  │ │ K │ D │ I │ S │ R │ A │ M │ V │ B │ S │  2  <-- 10 players  │
  │ ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤      10 squares each│
  │ │ V │ S │ A │ M │ D │ B │ S │ I │ K │ R │  3   100 total      │
  │ ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤                     │
  │ │ ...         10 x 10 grid            ...│  ...                │
  │ └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘                     │
  │  Winner = last digit of each team's score -> find the square   │
  │  * Gold = Winner ($125)  * Silver = Runner-up ($125)           │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

```
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │   Next.js 15 │    │   Supabase   │    │    Vercel    │
  │  App Router  │<-->│  PostgreSQL  │    │  Free Tier   │
  │  shadcn/ui   │    │  + Realtime  │    │  Auto-Deploy │
  │ Tailwind v4  │    │  + RLS       │    │  from GitHub │
  └──────────────┘    └──────────────┘    └──────────────┘
        |                    |                    |
        └────────────────────┴────────────────────┘
                     Total cost: $0/month
```

- **Auth:** Game code + Player name + 4-digit PIN
- **Realtime:** postgres_changes on 5 tables (instant updates)
- **Design:** Dark theme (#0B0F1A) / Bebas Neue / Source Sans 3
- **State:** setup -> batch1 -> batch2 -> locked -> live -> completed

---

## Features (38)

```
  PLAYER-FACING                    ADMIN DASHBOARD
  ─────────────                    ───────────────
  ✓ Game code login                ✓ Draft management
  ✓ PIN authentication             ✓ Bulk add players
  ✓ Interactive 10x10 grid         ✓ Pick-on-behalf
  ✓ Color-coded player squares     ✓ Team name editing
  ✓ Real-time pick updates         ✓ Game config (max players,
  ✓ Animated digit reveals             price, prize split)
  ✓ Winner/runner-up highlights    ✓ QR code invites (copy + save)
  ✓ Progress bar scoreboard        ✓ Score entry per quarter
  ✓ Help page                      ✓ Auto-update scores from ESPN
                                   ✓ Invite toggle

  SUPERADMIN (/superadmin)         INFRASTRUCTURE
  ────────────────────────         ──────────────
  ✓ Server-side PIN auth           ✓ Realtime subscriptions
  ✓ Platform game overview         ✓ Session persistence
  ✓ Status badges (live=pulsing)   ✓ Cascade deletes
  ✓ Delete with confirmation       ✓ Migration scripts
  ✓ Game limit (max 20)            ✓ RLS policies
```

---

## By The Numbers

```
  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │   21 commits    37 TypeScript files    3,685 lines (key files)│
  │   5 pages       1 API route            6 DB tables             │
  │   143 UAT tests (100% pass rate)       73 tracked tasks        │
  │   0 bugs remaining                     $0/month hosting        │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

**Biggest file:** `admin/page.tsx` — 2,075 lines
(draft management, game config, score entry, player admin, QR invites)

---

## How We Built It: Agent Teams

Claude Code's agent team system let us parallelize development across specialized agents — each with their own role, tools, and autonomy.

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  │                     ┌─────────────┐                             │
  │                     │ ORCHESTRATOR│  (me -- the user's          │
  │                     │  (team lead)│   direct interface)         │
  │                     └──────┬──────┘                             │
  │                            │                                    │
  │              ┌─────────────┼─────────────┐                      │
  │              │             │             │                      │
  │        ┌─────┴─────┐ ┌────┴────┐ ┌──────┴──────┐               │
  │        │ ARCHITECT │ │ UI-DEV  │ │ TEAM-LEAD-2 │               │
  │        │           │ │         │ │             │               │
  │        │ * Design  │ │ * Build │ │ * Implement │               │
  │        │ * Review  │ │ * Style │ │ * Review    │               │
  │        │ * Verify  │ │ * Test  │ │ * Coordinate│               │
  │        └───────────┘ └─────────┘ └─────────────┘               │
  │                                                                 │
  │   Additional agents spawned per session:                        │
  │   * backend-dev   -- Supabase queries, schema, migrations      │
  │   * uat-tester    -- 143 test cases across all features         │
  │   * devops        -- deployment research, Vercel/Supabase limits│
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### Agent Workflow

1. **Task Creation** — Orchestrator creates tasks with dependencies (e.g., Task #7 blocked by Task #6)
2. **Parallel Assignment** — Independent tasks assigned simultaneously (e.g., ui-dev builds UI while architect designs schema)
3. **Inter-Agent Communication** — Agents message each other directly via SendMessage (e.g., team-lead-2 sends architecture recs to architect)
4. **Build / Review / Verify Loop** — ui-dev implements -> team-lead-2 builds & reviews -> architect verifies -> uat-tester validates
5. **Teardown** — Shutdown requests sent, agents confirm, team deleted

### Real Example From This Session

```
  ┌──────────┐  "Design game limit       ┌───────────┐
  │Orchestrat│──+ superadmin"───────────>│ team-lead │
  │   or     │                           │    -2     │
  └──────────┘                           └─────┬─────┘
                                               │
                              architecture     │  briefs
                              recommendations  │  ui-dev
                                               │
                                         ┌─────▼─────┐
                                         │ architect  │
                                         └─────┬─────┘
                                               │
                     ┌─────────────────────────┘
                     │ 3 tasks created:
                     │  #5: Game limit (ui-dev)    --> parallel
                     │  #6: PIN API route (ui-dev) --> parallel
                     │  #7: Dashboard (ui-dev)     --> blocked by #6
                     │
               ┌─────▼─────┐
               │  ui-dev   │──── implements all 3
               └─────┬─────┘
                     │
               ┌─────▼─────┐
               │ team-lead │──── build check + code review
               │    -2     │     "All clear, no issues"
               └─────┬─────┘
                     │
               ┌─────▼─────┐
               │ ui-dev    │──── creates 20 test games
               └─────┬─────┘
                     │
               ┌─────▼─────┐
               │ architect │──── verifies cascade delete,
               └───────────┘     game limit, recovery
                                 "All 3 tests PASS"
```

### Agent Team Sessions Across the Project

**Session 1: Core Build**
- team-lead, architect, ui-dev, backend-dev
- Built: schema, game flow, grid, admin dashboard, auth
- ~45 tasks

**Session 2: Feature Expansion + UAT**
- team-lead-2, architect, ui-dev, backend-dev, uat-tester
- Built: game config, QR invites, bulk add, prize split
- 143 UAT test cases — 100% pass rate
- Bug #80 found and fixed (max_players lock after reset)
- ~28 tasks

**Session 3: Pre-Deployment Research**
- team-lead-2, architect, ui-dev, backend-dev, devops
- Researched: Supabase capacity, Vercel limits, migration plan
- Created: docs/research-findings.md, migration SQL
- Deployed to production (14 commits pushed)

**Session 4: Safeguards**
- team-lead-2, architect, ui-dev
- Built: game limit (max 20), superadmin dashboard, PIN API
- Verified: cascade delete, limit enforcement, recovery
- 9 tasks — all completed

**Session 5: Live Score Auto-Update -- Agent Team Success Story**

The night before Super Bowl LX, the user gave one instruction:

```
  "Add automatic live score updates. Here's a GitHub gist with
   ESPN API endpoints. Use the researcher to find the API, the
   architect for the plan, and the dev to build it."
```

What happened next required almost zero human involvement:

```
  MINUTE 0    User sends the request
              |
              v
  MINUTE 1    Team Lead (team-lead-2) reads the codebase,
              creates 7 tasks with dependencies, and dispatches:
              |
              |---> Product Researcher: "Find a free NFL score API"
              |---> Architect: "Design the feature architecture"
              +---> UI Dev: "Stand by -- you'll implement once
                           the plan is ready"
              |
              v
  MINUTE 3    Researcher reports back:
              * ESPN scoreboard API -- free, no auth, no rate limits
              * SB LX event ID: 401772988 (Seahawks vs Patriots)
              * Linescores are per-quarter deltas, need cumulative
                mapping for our app
              * Recommends 30s adaptive polling
              |
              v
  MINUTE 5    Architect delivers full plan:
              * 6 files, data flow diagram, sequence diagram
              * Edge cases: overtime, mid-quarter, halftime,
                multi-admin, ESPN down
              * Chose "espn_event_id" over "nfl_event_id"
                (source-explicit naming)
              * Client-driven polling (no server cron -- works
                on Vercel free tier)
              |
              v
  MINUTE 6    Team Lead reviews plan, approves with 3 notes:
              * OT folds into Q4 (confirmed)
              * Add auto-detect Super Bowl helper
              * Match team.name for fuzzy matching
              |
              Team Lead sends researcher's findings to architect
              with 6 specific follow-up questions
              |
              v
  MINUTE 8    Researcher returns verified data:
              * Tested with actual SB LIX and OT game responses
              * Confirmed linescore structure: {value, displayValue,
                period}
              * Found that ?event= param works on scoreboard
              * Verified OT appears as linescores[4] with period: 5
              |
              v
  MINUTE 9    Team Lead merges research into plan, sends full
              implementation brief to UI Dev with:
              * Exact TypeScript interfaces
              * ESPN response field mappings
              * Code structure for each of 4 implementation tasks
              |
              v
  MINUTES     Implementation proceeds -- architect and UI Dev
  10-25       build in parallel:
              |
              |-- DB migration (2 new columns)
              |-- ESPN client (fetch, parse, cumulative mapping,
              |   team matching, OT handling, auto-detect)
              |-- API route (validate, fetch ESPN, calculate
              |   winners, upsert scores, complete game)
              |-- Polling hook (adaptive 30s/60s, auto-stop)
              +-- Admin UI toggle (status dots, disable manual
                  inputs, "last checked" timer)
              |
              v
  MINUTE 12   Team Lead catches a bug during code review:
              matchTeamToAxis() called with 4 args instead of 5
              (missing displayName param). Reports to architect
              with the exact fix. Fixed immediately.
              |
              v
  MINUTE 20   Architect adds bonus: /api/live-scores/detect
              endpoint for auto-detecting the Super Bowl game.
              UI Dev integrates it into the toggle flow.
              |
              v
  MINUTE 25   All code complete. Build passes. Team Lead
              requests free tier safety analysis.
              |
              v
  MINUTE 27   Architect analyzes: 30s polling = 340 requests
              over 5 hours. Uses <1% of every free tier limit
              (Vercel + Supabase). No changes needed.
              |
              v
  MINUTE 30   User tests locally. Toggle stuck on "Connecting"
              -- Team Lead diagnoses: migration not applied to
              local DB. Applies it. Discovers ESPN ?event= param
              doesn't work for historical games. Implements
              summary endpoint fallback.
              |
              v
  MINUTE 35   Full pipeline test with SB LIX data:
              ESPN fetch -> cumulative mapping -> winner calc ->
              Supabase upsert -> Realtime broadcast -> UI update
              ALL FOUR QUARTERS populated live. No page refresh.
              |
              v
              User: "i saw it update live not needed to refresh"

  -----------------------------------------------------------
  RESULT: 7 tasks, 5 new files, ~900 lines of code
          1 bug caught in review, 1 bug caught in testing
          Production-ready in ~35 minutes
          Human involvement: 1 initial instruction +
                             2 clarifying answers
  -----------------------------------------------------------
```

**What made this work:**

```
  1. SPECIALIZATION
     Each agent had a clear role. The researcher didn't
     write code. The architect didn't build UI. The dev
     didn't do research. This prevented conflicts and
     let each agent go deep in their domain.

  2. DEPENDENCY-DRIVEN PIPELINE
     Tasks had explicit blockers (Task #8 blocked by #5,
     #6, #7). The team lead enforced execution order
     while allowing parallel work where possible.

  3. INTER-AGENT REVIEW
     The team lead reviewed every deliverable before
     passing it downstream. Caught the matchTeamToAxis
     bug before it reached production. The architect
     independently verified the UI dev's work.

  4. GRACEFUL DEBUGGING
     When the user hit "Connecting..." the team lead
     didn't guess -- diagnosed the root cause (missing
     DB columns), fixed it, then found a second issue
     (ESPN API quirk with historical events) and added
     a fallback. Systematic, not reactive.

  5. MINIMAL HUMAN OVERHEAD
     The user gave 1 instruction and answered 2 questions.
     Everything else -- task breakdown, research, design,
     implementation, review, testing, documentation --
     was agent-to-agent coordination.
```

---

## Key Decisions & Lessons

1. **No magic links** — Game code + PIN is perfect for 10 friends. Over-engineering auth would have added friction, not security.

2. **Supabase Realtime > polling** — postgres_changes subscriptions mean every pick, score, and status change is instant. No refresh needed.

3. **$0/month architecture** — Free tiers of Supabase (500MB, 200 realtime connections) and Vercel (100GB bandwidth) are more than enough for a friends-and-family pool app.

4. **Agent teams for speed** — Parallelizing across architect, ui-dev, and backend-dev meant features were designed, built, reviewed, and tested in the same session. The UAT tester caught bugs that humans would have missed.

5. **Delegate mode gotcha** — In Claude Code's delegate mode, the orchestrator can only coordinate (create tasks, send messages). All file operations must go through teammates. Learned to plan around this constraint.

6. **ESPN public API over paid alternatives** — The undocumented ESPN scoreboard API provides exactly what we need (quarter linescores, game status) with no API key, no rate limits, and <50KB responses. Server-side polling from 1 admin client means ESPN sees ~340 requests over the entire Super Bowl — negligible load.

---

```
       ┌──────────────────────────────────────────────────┐
       │                                                  │
       │   "A spreadsheet with better CSS" -- UX Analysis │
       │                                                  │
       │   We made it more than that.                     │
       │                                                  │
       │   Real-time. Interactive. Social.                │
       │   Built by humans and agents, together.          │
       │                                                  │
       │                 SB SQUARES                       │
       │                                                  │
       └──────────────────────────────────────────────────┘
```
