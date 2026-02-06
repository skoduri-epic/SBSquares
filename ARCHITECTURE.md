# Super Bowl Squares - Technical Architecture Design

## Current State Analysis

The existing Excel spreadsheet (`Chemicos2k 2025 Super Bowl Squares.xlsx`) contains:
- **Grid sheet**: 10x10 grid with player names, row/column digit assignments
- **ChiefsScore / EaglesScore sheets**: Digit-to-row/column mapping with RAND() values for randomization
- **Player Pick Order sheet**: 10 players with RAND()-based ordering
- **Teams**: Eagles (row axis) vs Chiefs (column axis) -- to be updated to Seahawks vs Patriots
- **Players**: Arun, Sharma, Routhu, KK, Ivs, Dms, Madhav, Suresh, Bob, Ramesh

---

## Option A: Web App with Magic Link Authentication

### Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | **Next.js 15 (App Router)** | SSR for fast initial load, React ecosystem, API routes built-in, eliminates need for separate backend |
| Styling | **Tailwind CSS** | Rapid UI development, responsive grid layout |
| Database | **Supabase (PostgreSQL)** | Free tier (2 projects, 500MB), built-in auth with magic links, real-time subscriptions, Row Level Security |
| Auth | **Supabase Auth (Magic Links)** | Zero-config email magic links, no password management, JWT tokens |
| Real-time | **Supabase Realtime** | PostgreSQL CDC (Change Data Capture), WebSocket-based, no additional infra |
| Email | **Supabase built-in** (or Resend for custom templates) | Supabase sends magic link emails natively; Resend ($0 for 100/day) for branded emails |
| Hosting | **Vercel** | Free tier, native Next.js support, edge functions, automatic preview deploys |
| Live Scores | **ESPN Hidden API** | Free, no auth required, JSON endpoints for NFL scoreboard |

### Why This Stack

- **Supabase as the centerpiece**: Provides database + auth + real-time in one service, all on the free tier. For 10 users, we will never exceed free limits.
- **Next.js on Vercel**: Zero-config deployment, server components reduce client bundle, API routes eliminate separate backend.
- **No separate backend needed**: Supabase client SDK + Next.js API routes + Supabase Edge Functions cover all server-side needs.

### Data Model (Supabase/PostgreSQL)

```sql
-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Chemicos2k Super Bowl 2025'
  team_row TEXT NOT NULL,                -- 'Eagles' (Y axis)
  team_col TEXT NOT NULL,                -- 'Chiefs' (X axis)
  status TEXT NOT NULL DEFAULT 'setup',  -- setup | draft | locked | live | completed
  espn_event_id TEXT,                    -- ESPN event ID for live score polling
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,                            -- for magic link auth
  phone TEXT,                            -- for WhatsApp (Option B/C)
  pick_order INT,                        -- randomized draft order
  auth_user_id UUID REFERENCES auth.users(id), -- Supabase auth link
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, name),
  UNIQUE(game_id, email)
);

-- Digit assignments (randomized per game)
CREATE TABLE digit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  axis TEXT NOT NULL CHECK (axis IN ('row', 'col')),  -- row = team_row, col = team_col
  position INT NOT NULL CHECK (position BETWEEN 0 AND 9), -- grid position (0-9)
  digit INT NOT NULL CHECK (digit BETWEEN 0 AND 9),       -- score digit assigned
  UNIQUE(game_id, axis, position),
  UNIQUE(game_id, axis, digit)
);

-- Squares table (the 100 squares)
CREATE TABLE squares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  row_pos INT NOT NULL CHECK (row_pos BETWEEN 0 AND 9),
  col_pos INT NOT NULL CHECK (col_pos BETWEEN 0 AND 9),
  player_id UUID REFERENCES players(id),  -- NULL if unclaimed
  claimed_at TIMESTAMPTZ,
  UNIQUE(game_id, row_pos, col_pos)
);

-- Scores table (quarter-by-quarter)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Final')),
  team_row_score INT,                    -- Eagles/Seahawks score
  team_col_score INT,                    -- Chiefs/Patriots score
  winning_row_digit INT,                 -- last digit of team_row_score
  winning_col_digit INT,                 -- last digit of team_col_score
  winner_player_id UUID REFERENCES players(id),
  payout_amount DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, quarter)
);

-- Audit/activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  action TEXT NOT NULL,                  -- 'square_claimed', 'score_updated', 'winner_declared'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Key API Endpoints (Next.js API Routes)

```
GET    /api/games/:id              -- Get game state (grid, players, scores)
POST   /api/games                  -- Create new game (admin)
PATCH  /api/games/:id              -- Update game status (admin)

GET    /api/games/:id/grid         -- Get full grid with digit assignments
POST   /api/games/:id/randomize    -- Randomize digit assignments (admin)

POST   /api/games/:id/squares/claim -- Claim a square (player)
GET    /api/games/:id/squares      -- Get all squares with owners

GET    /api/games/:id/scores       -- Get quarter scores and winners
POST   /api/games/:id/scores       -- Record/update score (admin or auto)

GET    /api/scores/live/:eventId   -- Proxy to ESPN API for live scores

POST   /api/auth/magic-link        -- Send magic link email
GET    /api/auth/verify             -- Verify magic link token
```

### Authentication Flow

1. Admin creates game, adds player names + emails
2. Each player receives a magic link email: `https://app.com/join?token=xxx`
3. Clicking the link authenticates via Supabase Auth (magic link)
4. Supabase JWT stored in httpOnly cookie
5. Row Level Security (RLS) policies ensure players only modify their own squares
6. Admin role checked via `players.is_admin` or Supabase custom claims

### Real-time Updates

- Supabase Realtime subscriptions on `squares` and `scores` tables
- When any square is claimed or score updates, all connected clients receive the change
- No polling needed for grid updates
- ESPN score polling: Vercel Cron Job every 30 seconds during game time, updates `scores` table, which triggers Realtime broadcast

### Deployment Architecture

```
[Browser] <--HTTPS--> [Vercel Edge Network]
                           |
                    [Next.js App]
                           |
                    [Supabase Cloud]
                      /    |    \
                [PostgreSQL] [Auth] [Realtime]
                                        |
                              [WebSocket to clients]

[Vercel Cron] --every 30s--> [ESPN API] --> [Supabase scores table]
```

### Build Complexity

| Component | Estimate |
|-----------|----------|
| Database schema + Supabase setup | 2-3 hours |
| Auth flow (magic links) | 2-3 hours |
| Grid UI (10x10 interactive board) | 4-6 hours |
| Square claiming flow | 2-3 hours |
| Score tracking + winner calculation | 3-4 hours |
| ESPN live score integration | 2-3 hours |
| Admin dashboard | 3-4 hours |
| Mobile responsiveness | 2-3 hours |
| Testing + polish | 3-4 hours |
| **Total** | **~25-35 hours (3-5 days)** |

### Monthly Operating Cost

| Service | Cost |
|---------|------|
| Supabase (free tier) | $0 |
| Vercel (free tier) | $0 |
| Domain (optional) | $0-12/year |
| Resend emails (optional) | $0 (100/day free) |
| **Total** | **$0/month** |

---

## Option B: WhatsApp Bot

### Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| WhatsApp API | **Twilio WhatsApp Sandbox** (dev) / **Meta Cloud API** (prod) | Twilio sandbox is free for testing; Meta Cloud API has 1,000 free conversations/month |
| Bot Framework | **Node.js + whatsapp-web.js** or **Baileys** (unofficial) / **Meta Cloud API** (official) | For a small group, unofficial libraries work; official API for reliability |
| Backend | **Node.js (Express/Fastify)** | Webhook handler for incoming messages |
| Database | **Supabase (PostgreSQL)** | Same schema, shared with Option A if doing Option C |
| Image Generation | **Node-canvas** or **Puppeteer** | Generate grid images to send in WhatsApp |
| Hosting | **Railway** or **Fly.io** | Always-on server needed for webhook receiver ($5/month) |

### WhatsApp API Options Comparison

| Feature | Meta Cloud API (Official) | Twilio WhatsApp | whatsapp-web.js (Unofficial) |
|---------|--------------------------|-----------------|------------------------------|
| Cost | 1000 free conv/month | $0.005/msg | Free |
| Reliability | High | High | Medium (can break) |
| Setup | Business verification needed | Quick sandbox | Scan QR code |
| Rich messages | Templates, buttons, lists | Templates | Images, text |
| Best for | Production | Quick start | Hobby/prototype |

**Recommendation**: Meta Cloud API for reliability, but whatsapp-web.js for fastest prototype.

### Message Handlers

```
Commands:
  /grid                    -- Show current grid as image
  /mysquares               -- Show your claimed squares
  /claim <row> <col>       -- Claim a square (during draft)
  /score                   -- Show current score and winners
  /score Q1 14 7           -- Admin: set Q1 score (Eagles 14, Chiefs 7)
  /standings               -- Show player standings/payouts
  /help                    -- Show available commands
  /randomize               -- Admin: randomize digits
```

### Grid Image Generation

```javascript
// Using node-canvas to render 10x10 grid as PNG
// Each cell: 60x60px, total: ~660x660px with labels
// Color-coded by player (10 distinct colors)
// Highlighted winning squares per quarter
```

### Authentication

- Player identified by phone number (WhatsApp sender ID)
- Admin identified by specific phone number(s)
- No passwords or tokens needed -- WhatsApp itself is the auth layer
- Player-phone mapping stored in `players` table

### Deployment

```
[WhatsApp Users] <--> [Meta Cloud API / Twilio]
                            |
                      [Webhook URL]
                            |
                    [Node.js on Railway]
                            |
                    [Supabase PostgreSQL]
```

### Build Complexity

| Component | Estimate |
|-----------|----------|
| WhatsApp API setup + webhook | 3-4 hours |
| Message parser + router | 2-3 hours |
| Grid image generation | 4-6 hours |
| Square claiming flow | 2-3 hours |
| Score tracking + winners | 3-4 hours |
| Admin commands | 2-3 hours |
| Testing in group chat | 2-3 hours |
| **Total** | **~20-28 hours (3-4 days)** |

### Monthly Operating Cost

| Service | Cost |
|---------|------|
| Supabase (free tier) | $0 |
| Railway (Starter) | $5/month |
| Meta Cloud API (< 1000 conv) | $0 |
| OR Twilio (~200 msgs) | ~$1 |
| **Total** | **~$5-6/month** |

### Limitations

- No persistent visual grid (images sent on demand, scroll away in chat)
- Complex grid interactions awkward via text commands
- Group chat can get noisy with bot responses
- Image generation adds latency (~1-2 seconds)
- Hard to show real-time updates (must poll or be triggered)

---

## Option C: Unified Backend (Recommended)

### Architecture

```
                    [Supabase Cloud]
                   /       |        \
            [PostgreSQL] [Auth]  [Realtime]
                   \       |        /
                    [Shared Data Layer]
                      /           \
            [Next.js Web App]   [WhatsApp Bot]
            (Vercel)            (Railway/Fly.io)
               |                     |
          [Browsers]          [WhatsApp Users]
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Shared Database | **Supabase PostgreSQL** |
| Shared Auth | Supabase Auth (web) + phone-number matching (WhatsApp) |
| Web Frontend | **Next.js 15** on **Vercel** |
| WhatsApp Bot | **Node.js** on **Railway** |
| Shared Logic | **Supabase Edge Functions** (Deno) for game logic |
| Live Scores | **ESPN Hidden API** polled by Vercel Cron |
| Image Gen | **Supabase Edge Function** with SVG-to-PNG |

### Why Unified

1. **Single source of truth**: One database, both interfaces read/write the same data
2. **Build incrementally**: Start with web app (richer UX), add WhatsApp later as notification/quick-view layer
3. **Shared game logic**: Score calculation, winner determination, validation in Edge Functions
4. **WhatsApp as companion**: Use WhatsApp for notifications ("Q1 winner: Arun!") and quick lookups, web for full interaction
5. **No data sync issues**: Both interfaces hit the same tables

### Shared Business Logic (Supabase Edge Functions)

```typescript
// supabase/functions/calculate-winner/index.ts
// Given a quarter's scores, find the winning square owner

// supabase/functions/randomize-digits/index.ts
// Randomly assign digits 0-9 to rows and columns

// supabase/functions/validate-claim/index.ts
// Check if square is available, player hasn't exceeded limit

// supabase/functions/poll-live-scores/index.ts
// Fetch ESPN API, update scores table, trigger notifications
```

### Notification Flow (Unified)

```
[ESPN API] --> [Cron Job polls every 30s]
                    |
            [Score changed?]
                    |
            [Update Supabase scores table]
                   / \
    [Realtime WS]     [WhatsApp notification]
         |                    |
    [Web clients]      [Group chat message]
    (auto-update)      ("Q1 Score: Eagles 14, Chiefs 7 -- Winner: Arun!")
```

### Build Complexity (Incremental)

| Phase | Component | Estimate |
|-------|-----------|----------|
| Phase 1 | Web app (full experience) | 25-35 hours |
| Phase 2 | WhatsApp bot (companion) | 12-18 hours |
| Phase 3 | Live score integration | 4-6 hours |
| **Total** | | **~40-55 hours** |

But Phase 1 alone delivers a complete product. Phase 2 and 3 are enhancements.

### Monthly Operating Cost (Unified)

| Service | Cost |
|---------|------|
| Supabase (free tier) | $0 |
| Vercel (free tier) | $0 |
| Railway for WhatsApp bot | $5/month |
| Meta Cloud API | $0 |
| **Total** | **$0-5/month** |

---

## Comparative Analysis

| Criteria | Option A: Web App | Option B: WhatsApp | Option C: Unified |
|----------|-------------------|--------------------|--------------------|
| **UX Richness** | Excellent (interactive grid, animations) | Limited (text + images) | Best of both |
| **Auth Friction** | Low (magic link) | None (phone = identity) | Lowest |
| **Real-time** | Native (WebSocket) | Manual (on-demand) | Full coverage |
| **Build Time** | 3-5 days | 3-4 days | 5-7 days |
| **Monthly Cost** | $0 | $5-6 | $0-5 |
| **Mobile UX** | Good (responsive) | Native (WhatsApp) | Best |
| **Notifications** | Needs push/email | Native (WhatsApp) | Both channels |
| **Admin Tools** | Full dashboard | Text commands | Dashboard + commands |
| **Maintenance** | Low | Medium (API changes) | Medium |
| **Fun Factor** | High (visual) | Medium | Highest |
| **Accessibility** | URL sharing | Already in WhatsApp | Both entry points |

---

## Recommendation

**Option C (Unified) with Phase 1 priority on Web App.**

Rationale:
1. Web app provides the richest experience for a visual game like Squares
2. Supabase gives us database + auth + real-time for free
3. WhatsApp bot adds natural notification channel without replacing the web UI
4. ESPN hidden API provides free live score data
5. Total cost: $0-5/month
6. Start with web app (Phase 1), add WhatsApp notifications later (Phase 2)

### Immediate Next Steps
1. Set up Supabase project with schema
2. Scaffold Next.js app with Tailwind
3. Build the 10x10 grid component
4. Implement magic link auth
5. Import existing player/square data from Excel

---

## Live Score Integration Details

### ESPN Hidden API (Free, No Auth)

```
# Get Super Bowl scoreboard
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard

# Response includes:
# - events[].competitions[].competitors[].score
# - events[].status.type.completed
# - events[].status.period (quarter)
```

### Polling Strategy

- **Pre-game**: Poll every 5 minutes to detect game start
- **During game**: Poll every 15-30 seconds for score updates
- **Halftime**: Poll every 2 minutes
- **Post-game**: Final poll, mark game as completed
- **Implementation**: Vercel Cron Job or Supabase pg_cron

### Score-to-Winner Calculation

```
For each quarter:
  row_digit = team_row_score % 10    -- last digit of Eagles/Seahawks score
  col_digit = team_col_score % 10    -- last digit of Chiefs/Patriots score

  Find square at intersection of:
    row where digit_assignments(axis='row', digit=row_digit).position
    col where digit_assignments(axis='col', digit=col_digit).position

  Winner = squares(row_pos, col_pos).player_id
```

---

## Scalability Notes

While the game is designed for ~10 users, the architecture supports:
- **Multiple concurrent games**: UUID-based game_id isolation
- **Larger groups**: Schema supports any number of players/grid sizes
- **Multi-sport**: Generic enough for any sport with quarter/period scoring
- **Supabase free tier limits**: 500MB storage, 2GB transfer, 50K monthly active users -- all far above our needs
- **Vercel free tier**: 100GB bandwidth, 100 hours serverless -- more than sufficient

If the group grows beyond free tier limits, Supabase Pro ($25/month) and Vercel Pro ($20/month) provide generous headroom.
