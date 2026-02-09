# Plan: Server-Side Live Score Polling

## Problem

ESPN live score updates currently rely on a client-side polling loop (`useLiveScores` hook) that only runs on the **admin page**. If the admin closes their browser tab, polling stops and scores are no longer updated automatically.

## Current Architecture

```
Admin Browser Tab
  └── useLiveScores hook (setInterval every 30-60s)
        └── POST /api/live-scores { gameId }
              ├── Fetch ESPN API
              ├── Calculate winners
              └── Write to Supabase
                    └── Realtime → All player clients
```

## Goal

Remove the dependency on an open admin browser tab. Scores should update automatically as long as the game is in `live` or `locked` status with `auto_scores_enabled = true`.

---

## Options Evaluated

### Option 1: Supabase pg_cron + pg_net (Recommended)

**How it works:** Use Postgres-native `pg_cron` to schedule a recurring job that calls the existing Vercel `/api/live-scores` endpoint via `pg_net`.

**Pros:**
- No new infrastructure; both extensions available on Supabase free tier
- Reuses existing `/api/live-scores` API route — minimal code changes
- Runs server-side, no browser needed
- Easy to enable/disable per game

**Cons:**
- Minimum interval is 1 minute (vs current 30s client-side)
- Requires hardcoding the Vercel deployment URL in the cron job
- Need to manage cron jobs per game (create on enable, delete on disable)
- pg_net on free tier may have reliability limitations

**Implementation:**

1. Enable `pg_cron` and `pg_net` extensions in Supabase dashboard
2. Create a new API route `POST /api/live-scores/cron` that:
   - Queries all games where `auto_scores_enabled = true` AND `status IN ('live', 'locked')`
   - Calls the existing score update logic for each game
   - Secured with a secret header/token (env var `CRON_SECRET`)
3. Register a single pg_cron job that hits this endpoint every minute:

```sql
-- Store the cron secret in Supabase Vault
select vault.create_secret('cron-auth-token', 'your-secret-here');

-- Schedule the job
select cron.schedule(
  'poll-live-scores',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://your-app.vercel.app/api/live-scores/cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron-auth-token')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

4. Remove or make `useLiveScores` hook optional on admin page (keep as fallback/status indicator)

**Estimated effort:** Small — new API route + SQL setup

---

### Option 2: Supabase Edge Function + pg_cron

**How it works:** Write a Deno Edge Function that contains the ESPN fetch + score update logic, triggered by pg_cron.

**Pros:**
- All logic stays within Supabase (no round-trip to Vercel)
- Lower latency

**Cons:**
- Duplicates logic already in `/api/live-scores` (ESPN fetching, winner calc)
- Edge Functions have a 150s timeout on free tier
- Need to maintain two copies of score update logic
- More complex deployment (Supabase CLI for Edge Functions)

**Verdict:** Not recommended — too much duplication for little benefit.

---

### Option 3: External Cron Service (cron-job.org)

**How it works:** Use a free external service to hit the Vercel endpoint on a schedule.

**Pros:**
- Zero code changes — just configure a URL
- 1-minute intervals on free tier
- Simple setup

**Cons:**
- Third-party dependency outside your stack
- Need to manage game-specific URLs or build a "poll all active games" endpoint
- Security: endpoint must be protected (anyone could trigger score updates)
- Service may have reliability/uptime issues

**Verdict:** Good as a quick interim solution, but pg_cron is cleaner long-term.

---

### Option 4: Poll from All Clients (Not Just Admin)

**How it works:** Move `useLiveScores` to the main game page so any connected player triggers polling.

**Pros:**
- Trivial code change — add hook to game page component
- No infrastructure changes

**Cons:**
- Multiple clients polling simultaneously (wasteful, potential race conditions)
- Still requires at least one browser tab open
- ESPN API could rate-limit with 10+ clients polling every 30s
- Duplicate score writes if two clients poll at the same moment

**Verdict:** Not recommended — shifts the problem rather than solving it.

---

## Recommended Approach: Option 1 (pg_cron + pg_net)

### Implementation Steps

#### Step 1: Create batch polling endpoint

Create `app/api/live-scores/cron/route.ts`:
- Accepts a `CRON_SECRET` bearer token for auth
- Queries all games needing polling: `auto_scores_enabled = true` AND `status IN ('live', 'locked')`
- Runs the existing score update logic for each active game
- Returns summary of updates

#### Step 2: Add environment variable

Add `CRON_SECRET` to Vercel environment variables (a random string, not `NEXT_PUBLIC_`).

#### Step 3: Enable Supabase extensions

In Supabase SQL Editor:
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

#### Step 4: Register the cron job

```sql
select cron.schedule(
  'poll-live-scores',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://sbsquares.vercel.app/api/live-scores/cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Step 5: Update admin UI

- Keep `useLiveScores` for status display (show NFL status, last poll time)
- Remove it as the primary polling mechanism
- Add a status indicator showing "Server-side polling active" when `auto_scores_enabled` is true

#### Step 6: Add cron management helpers

Optional SQL functions to pause/resume:
```sql
-- Pause polling (e.g., offseason)
select cron.unschedule('poll-live-scores');

-- Resume polling
select cron.schedule('poll-live-scores', '* * * * *', $$ ... $$);
```

### Migration Considerations

- The client-side hook can remain as a fallback during transition
- No database schema changes required
- The existing `/api/live-scores` route stays unchanged
- Only additive changes (new route, new env var, new cron job)

### Testing Plan

1. Enable extensions in Supabase dashboard
2. Deploy the new `/api/live-scores/cron` route
3. Test manually with `curl -H "Authorization: Bearer $CRON_SECRET" -X POST .../api/live-scores/cron`
4. Register the cron job and verify it fires every minute via `select * from cron.job_run_details order by start_time desc limit 10;`
5. Confirm scores update in the UI without admin tab open
