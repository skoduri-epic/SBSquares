# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm start            # Production server
```

No test framework is configured. Verify changes with `npm run build`.

## Architecture

Super Bowl Squares pool app. Next.js 15 App Router + Supabase (PostgreSQL + Realtime) + shadcn/ui (new-york) + Tailwind CSS v4. Deployed on Vercel.

**Path alias:** `~/` maps to project root (`import { cn } from "~/lib/utils"`).

### Game Flow State Machine

```
setup → batch1 → batch2 → locked → live → completed
```

- `setup`: Players join, admin configures game
- `batch1`/`batch2`: Draft rounds where players pick squares (≤10 players = 2 batches of 5; >10 = single batch)
- `locked`: All squares assigned, digits randomized
- `live`: Game in progress, scores entered per quarter
- `completed`: All 4 quarters scored

### Auth Model

No OAuth. Game-code-based auth with 4-digit PINs:
1. Enter game code → fetch game + players
2. Select player name → enter PIN (verified against `players.pin`)
3. Session stored in `localStorage` key `sb-squares-session`
4. Superadmin uses server-side PIN via `/api/superadmin/verify` (env var `SUPERADMIN_PIN`)

### State Management

- `GameProvider` (React Context) wraps all game pages, exposes `useGameContext()`
- `useGame(gameId)` hook fetches all 6 tables via `Promise.all`, returns `GameState`
- `useGameRealtime()` subscribes to Supabase `postgres_changes` on all tables filtered by `game_id` — triggers `reload()` on any change

### Database Tables

| Table | Purpose |
|-------|---------|
| `games` | Game metadata, status, team names, config |
| `players` | Participants with name, PIN, color, admin flag |
| `squares` | 100 rows per game (10x10 grid), player_id when picked |
| `digit_assignments` | Random 0-9 mapping for row/col axes |
| `draft_order` | Pick order per batch |
| `scores` | Quarter results with winner/runner-up |

All tables have RLS enabled with permissive policies (auth handled at app level). All are in `supabase_realtime` publication.

### Winner Calculation (`lib/game-logic.ts`)

- Last digit of each team score → maps to row/col position via `digit_assignments`
- Square at intersection = winner; opposite square (digits swapped) = runner-up
- Same digit for both teams = no runner-up (winner gets full prize)

## Key Files

| File | What it does |
|------|-------------|
| `app/page.tsx` | Landing: game code entry, player select, PIN verify |
| `app/game/[gameId]/page.tsx` | Main game view (grid + scores) |
| `app/game/[gameId]/admin/page.tsx` | Admin dashboard (2,075 lines — draft, config, scores, invites) |
| `app/superadmin/page.tsx` | Platform-level game management (PIN gated) |
| `components/GameProvider.tsx` | React Context for game state |
| `hooks/use-game.ts` | Data fetching + session helpers |
| `hooks/use-realtime.ts` | Supabase realtime subscriptions |
| `lib/game-logic.ts` | Winner calc, draft order, prize math |
| `lib/types.ts` | All TypeScript interfaces + `PLAYER_COLORS` |

## Design System

- Dark theme: `#0B0F1A` background
- Fonts: Bebas Neue (headers), Source Sans 3 (body) — loaded via `@import url()` in `globals.css`
- 25 player colors in `PLAYER_COLORS` array (`lib/types.ts`)
- Winner = gold `#F59E0B`, runner-up = silver `#94A3B8`
- Team color schemes defined as CSS custom properties in `globals.css` (Seahawks, Patriots, Chiefs, Eagles, etc.)
- Tailwind v4: no `tailwind.config` file — theme configured inline in `globals.css`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon/public key
SUPERADMIN_PIN=9999                 # Server-only, not NEXT_PUBLIC_
```

## Workflow Preferences

- After completing tasks, always append them to `SBSquares_Task_Report.xlsx`. Each row should include: Task #, Type (feature/bugfix/research/docs/devops), Description, Assignee, and Status. Use `openpyxl` via Python to write rows — do not overwrite existing data, only append new tasks.

## Gotchas

- Tailwind v4: `@import url(...)` for fonts must come BEFORE `@import "tailwindcss"` in `globals.css`
- shadcn v4 registry missing `toast` — custom `Toaster` built in `components/ui/toaster.tsx`
- Supabase table names: `digit_assignments` (not `digits`), `scores` (not `quarters`), `draft_order` exists
- Game creation capped at `MAX_GAMES = 20` (`lib/constants.ts`) — checked client-side before insert
- `QRCodeCanvas` from `qrcode.react` used (not `QRCodeSVG`) to support image copy/download
