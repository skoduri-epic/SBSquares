# Pre-Deployment Research Findings

## 1. Supabase Free Tier Capacity (Task #88)

### Free Tier Limits (as of early 2026)

| Resource | Free Tier Limit |
|----------|----------------|
| Database size | 500 MB |
| Storage | 1 GB |
| Bandwidth | 5 GB / month |
| API requests | Unlimited (fair use) |
| Realtime connections | 200 concurrent |
| Realtime messages | 2 million / month |
| Edge Functions invocations | 500K / month |
| Auth users | 50,000 MAU |
| Projects | 2 active projects |

### Per-Game Footprint (10 players)

| Table | Rows per Game | Est. Row Size | Est. Total Size |
|-------|---------------|---------------|-----------------|
| games | 1 | ~500 bytes (UUID, game_code, status, team names, config cols) | ~500 B |
| players | 10 | ~200 bytes (UUID, game_id FK, name, pin, is_admin, color_index) | ~2 KB |
| squares | 100 | ~150 bytes (UUID, game_id FK, player_id FK, row, col, batch) | ~15 KB |
| quarter_results | 4 | ~200 bytes (UUID, game_id FK, quarter, scores, winner/runner-up FKs) | ~800 B |
| game_digits | 20 | ~100 bytes (UUID, game_id FK, axis, position, digit, revealed) | ~2 KB |
| **TOTAL per game** | **135 rows** | | **~20 KB raw** |

Plus indexes, TOAST overhead, and PostgreSQL row overhead (HeapTupleHeader = 23 bytes/row), the realistic per-game footprint is approximately **40-50 KB**.

### Capacity Estimates

| Scenario | Games | Rows | Est. DB Size | % of Free Tier |
|----------|-------|------|--------------|----------------|
| 100 games (10 players each) | 100 | 13,500 | ~5 MB | 1% |
| 1,000 games | 1,000 | 135,000 | ~50 MB | 10% |
| 5,000 games | 5,000 | 675,000 | ~250 MB | 50% |
| ~10,000 games | 10,000 | 1,350,000 | ~500 MB | 100% |

### Bottleneck Analysis

| Constraint | Limit | Games Supported |
|-----------|-------|----------------|
| Storage (500 MB) | Lifetime | ~5,000-7,000 total |
| Realtime connections (200) | Concurrent | ~18-20 active games |
| Realtime messages (2M/mo) | Monthly | ~1,300 game lifecycles |
| Bandwidth (5 GB/mo) | Monthly | ~5,000 games |

**Primary bottleneck:** 200 concurrent realtime connections. Each player viewing a game page opens a realtime subscription (postgres_changes on 5 tables). With 10 players per game = 10 connections per game = ~20 concurrent active games max.

For a Super Bowl pool app, this is actually fine since:
- Games are typically viewed sporadically (check scores during the game)
- Not all 10 players will have the app open simultaneously
- The Super Bowl is one event; most usage is concentrated in a few hours

**Realtime Messages (2M/month):** Each score update, pick, or status change broadcasts to all subscribers. A full game lifecycle (setup through completion) generates ~300-500 DB changes = ~3,000-5,000 realtime messages per game. 2,000,000 / 5,000 = ~400 active games per month.

### Recommendations

1. **Storage is NOT the bottleneck** - room for thousands of games
2. **Realtime connections (200)** are the tightest constraint for concurrent usage - fine for a small-scale pool app
3. **Realtime messages (2M/month)** could matter if you scale to hundreds of simultaneous games
4. Consider adding a **cleanup mechanism** to archive/delete completed games older than X months
5. **No need for paid tier** for current use case (handful of games among friends)
6. **Inactivity pausing**: Supabase pauses free projects after 1 week of inactivity. Set up a simple cron ping during football season
7. **Upgrade path**: Pro plan ($25/month) gives 8 GB database, 500 realtime connections, 5M messages/month

**Verdict:** Free tier is more than sufficient for friends/family pools.

---

## 2. Vercel Free (Hobby) Tier (Task #89)

### Limits

| Resource | Free Tier Limit | Relevance to SB Squares |
|----------|----------------|------------------------|
| Bandwidth | 100 GB / month | Low risk - static Next.js app, small payloads |
| Serverless Function Execution | 100 GB-hours / month | Low risk - most logic is client-side + Supabase direct |
| Serverless Function Duration | 10 seconds max | Fine - no long-running server functions |
| Build Minutes | 6,000 min / month | Low risk - builds only on push to main |
| Deployments | Unlimited | No issue |
| Preview Deployments | Unlimited | No issue |
| Edge Function Invocations | 500K / month | Not using edge functions |
| Image Optimization | 1,000 source images / month | Low risk - only ESPN team logos (~32) |
| Concurrent Builds | 1 | Slight wait if pushing rapidly |
| Team Members | 1 (personal) | Hobby is single-user only |
| Commercial Use | NOT allowed | Important limitation |
| Custom Domains | Yes (unlimited) | Good |
| Analytics | Basic (Web Vitals) | Sufficient |
| DDoS Protection | Included | Good |
| Log Retention | 1 hour | Limited debugging (Pro gets 1 day) |

### Risk Assessment with Multiple Games

| Limit | Threshold | Risk with ~5 games (50 users) | Risk with ~20 games (200 users) |
|-------|-----------|-------------------------------|--------------------------------|
| Bandwidth (100 GB) | Very high | Negligible | Negligible |
| Serverless invocations (100K) | Moderate | Safe (~5-10K/month) | Safe (~20-40K/month) |
| Image optimization (1K sources) | Low | Safe (~32 logos) | Safe (~32 logos) |
| Build minutes (6K) | Moderate | Safe (development-driven) | Same |
| Commercial use prohibition | Policy | OK if non-commercial | Gray area if charging |

### Key Concerns

1. **Commercial Use Restriction**: Hobby tier explicitly prohibits commercial use. If charging per square (price_per_square), this is technically commercial. Pro tier ($20/month) removes this restriction. For friends-and-family pool, unlikely to be enforced.
2. **No WebSocket concern**: Supabase Realtime runs on Supabase's infrastructure, not Vercel's servers.
3. **Serverless Functions**: Since the app uses Supabase client-side SDK for most operations, serverless function usage is minimal.

**Verdict:** Free tier more than sufficient. Architecture is favorable -- most data goes directly to Supabase, not through Vercel.

---

## 3. Super-Admin Screen Assessment (Task #90)

**Recommendation: Not needed now.** Build it when you have 10+ games.

### Why Not Now

- You currently have a handful of games (friends/family)
- You can manage games directly via Supabase Dashboard (Table Editor + SQL Editor) for free
- The Supabase dashboard already lets you view, edit, and delete rows in any table
- Building a super-admin screen is significant effort (auth layer, protected routes, CRUD for all games)
- Your free tier supports ~10,000 games -- no cleanup pressure

### When to Build It

- When you have 10+ games and lose track of them
- When non-technical people need to manage the platform
- When you want automated stale-game cleanup
- If you ever open it up beyond friends/family

### What It Would Include (If Built)

| Feature | Priority | Description |
|---------|----------|-------------|
| Game List | P0 | All games with status, player count, created_at, last_activity |
| Game Detail | P0 | View players, squares, scores for any game |
| Delete Game | P0 | Remove stale/test games (CASCADE handles cleanup) |
| Game Stats | P1 | Active vs completed vs stale, games by status |
| Player Lookup | P1 | Find a player across all games (for support) |
| Bulk Cleanup | P2 | Delete all games older than X or in setup status for >30 days |
| Export Data | P2 | CSV export of game results for record-keeping |
| Usage Metrics | P3 | Realtime connection count, storage usage |

**Estimated effort:** Minimal version (game list + delete): ~2-3 tasks. Full version: ~6-8 tasks.

### Lightweight Alternative (Recommended for Now)

A simple SQL query in Supabase SQL Editor for game overview:

```sql
SELECT g.id, g.game_code, g.status, g.created_at,
       COUNT(p.id) as player_count,
       MAX(s.created_at) as last_pick_at
FROM games g
LEFT JOIN players p ON p.game_id = g.id
LEFT JOIN squares s ON s.game_id = g.id
GROUP BY g.id ORDER BY g.created_at DESC;
```

A periodic cleanup script (Supabase Edge Function on a cron) that deletes games older than 6 months in "completed" status.

---

## 4. Production DB Migration (Task #91)

### New Columns Added

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| max_players | integer | 10 | Max players allowed in a game |
| price_per_square | numeric | 0 | Cost per square in dollars |
| prize_split | text | 'equal' | How prizes are split |
| winner_pct | integer | 100 | Winner percentage of prize pool |
| invite_enabled | boolean | false | Whether QR/invite join is enabled |
| is_secondary_admin (players) | boolean | false | Secondary admin support |

### Required SQL (run in Supabase Dashboard > SQL Editor BEFORE code deploy)

```sql
-- Step 1: Add new columns to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_players integer NOT NULL DEFAULT 10;
ALTER TABLE games ADD COLUMN IF NOT EXISTS price_per_square numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS prize_split text NOT NULL DEFAULT 'equal';
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_pct integer NOT NULL DEFAULT 100;
ALTER TABLE games ADD COLUMN IF NOT EXISTS invite_enabled boolean NOT NULL DEFAULT false;

-- Step 2: Add secondary admin support to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_secondary_admin boolean NOT NULL DEFAULT false;

-- Step 3: Backfill existing games with defaults
UPDATE games SET
  max_players = COALESCE(max_players, 10),
  price_per_square = COALESCE(price_per_square, 0),
  prize_split = COALESCE(prize_split, 'equal'),
  winner_pct = COALESCE(winner_pct, 100),
  invite_enabled = COALESCE(invite_enabled, false)
WHERE max_players IS NULL
   OR price_per_square IS NULL
   OR prize_split IS NULL
   OR winner_pct IS NULL
   OR invite_enabled IS NULL;

-- Step 4: Refresh realtime publication
ALTER PUBLICATION supabase_realtime SET TABLE games, players, squares, digits, quarters;

-- Step 5: Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('games', 'players')
ORDER BY table_name, ordinal_position;
```

**Notes:**
- All statements use `IF NOT EXISTS` for safe re-runs (idempotent)
- PostgreSQL's `ALTER TABLE ADD COLUMN ... DEFAULT` automatically backfills existing rows
- No RLS policy changes needed -- existing SELECT policies cover new columns on same tables

### Post-Migration Steps

1. Reload schema cache: Supabase Dashboard > Settings > API > Reload Schema Cache
2. Verify columns appear in Table Editor for both `games` and `players` tables
3. Verify existing game data has correct defaults
4. Deploy latest code to Vercel (`git push origin main`)
5. Test that existing game still loads correctly
6. Test creating a new game with new settings

### Pre-Deploy Checklist

- [ ] Run migration SQL in Supabase Dashboard > SQL Editor
- [ ] Verify columns appear in Table Editor
- [ ] Verify existing game data has correct defaults
- [ ] Reload schema cache (Settings > API)
- [ ] Deploy latest code (git push to main)
- [ ] Smoke test: existing game loads
- [ ] Smoke test: new game creation with settings
