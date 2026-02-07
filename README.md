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
  ✓ Help page                      ✓ Invite toggle

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

---

## Key Decisions & Lessons

1. **No magic links** — Game code + PIN is perfect for 10 friends. Over-engineering auth would have added friction, not security.

2. **Supabase Realtime > polling** — postgres_changes subscriptions mean every pick, score, and status change is instant. No refresh needed.

3. **$0/month architecture** — Free tiers of Supabase (500MB, 200 realtime connections) and Vercel (100GB bandwidth) are more than enough for a friends-and-family pool app.

4. **Agent teams for speed** — Parallelizing across architect, ui-dev, and backend-dev meant features were designed, built, reviewed, and tested in the same session. The UAT tester caught bugs that humans would have missed.

5. **Delegate mode gotcha** — In Claude Code's delegate mode, the orchestrator can only coordinate (create tasks, send messages). All file operations must go through teammates. Learned to plan around this constraint.

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
