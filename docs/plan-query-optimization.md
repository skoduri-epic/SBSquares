# Plan: Supabase Query Optimization

**Status:** Planned
**Priority:** High
**Reason:** `realtime.list_changes` consumes 97.9% of total DB time (1.3M polls, 5ms mean, only 2,081 rows found). Combined with subscription churn (28K inserts), the realtime infrastructure dominates database compute.

---

## Query-by-Query Analysis

### Category A: Supabase Internal / Dashboard (No Action Needed)

| # | Query | Calls | Mean ms | % Total | Notes |
|---|-------|-------|---------|---------|-------|
| 2 | pg_available_extensions | 47 | 168 | 0.12% | Dashboard introspection only |
| 3 | pg_timezone_names | 75 | 200 | 0.22% | Virtual table, 0% cache hit by design |
| 6 | pg_proc functions CTE | 8 | 137 | 0.016% | Dashboard only |
| 7 | pg_type introspection | 104 | 52 | 0.08% | Infrastructure query |
| 8 | PostgREST function introspection | 76 | 28 | 0.032% | Schema cache refresh |
| 10 | set_config request context | 38,873 | 0.08 | 0.048% | Per-API-call overhead, reduced by cutting reload frequency |
| 11 | CREATE TABLE realtime.messages partition | 119 | 8.4 | 0.015% | Auto daily partition maintenance |

### Category B: Realtime Infrastructure (CAN Reduce - 99.3% of Total Time)

| # | Query | Calls | Mean ms | % Total | Root Cause |
|---|-------|-------|---------|---------|------------|
| 1 | realtime.list_changes (WAL polling) | 1,303,697 | 5.09 | 97.93% | 6 table subscriptions per client, polls continuously |
| 4 | realtime.subscription INSERT/upsert | 27,972 | 3.27 | 1.35% | Subscription churn from reconnects/remounts |
| 5 | realtime.subscription DELETE | 2,969 | 0.57 | 0.025% | Channel cleanup |
| 13 | pg_publication_tables lookup | 3,175 | 1.90 | 0.089% | Checked on each new subscription |

### Category C: App Queries (Already Fast - 0.07% of Total Time)

| # | Query | Calls | Mean ms | % Total | Notes |
|---|-------|-------|---------|---------|-------|
| 9 | SELECT squares WHERE game_id | 2,890 | 0.74 | 0.032% | Has index, 100% cache hit |
| 12 | SELECT squares WHERE game_id (variant) | 3,265 | 0.84 | 0.041% | Same query, different PostgREST context |

---

## Optimization Plan

### Priority 1: Reduce Realtime WAL Polling (97.9% of DB Time)

#### 1A. State-Conditional Subscriptions (HIGH IMPACT)

**Problem:** All 6 table subscriptions (`games`, `players`, `squares`, `digit_assignments`, `draft_order`, `scores`) are active regardless of game state. During `live` phase when most users are watching, we only need `games` + `scores`.

**Solution:** Modify `useGameRealtime` to accept `gameStatus` and conditionally subscribe.

| Game Status | Subscribe To | Skip |
|-------------|-------------|------|
| `setup` | `games`, `players` | `squares`, `digit_assignments`, `draft_order`, `scores` |
| `batch1`/`batch2` | `games`, `squares`, `draft_order`, `players` | `digit_assignments`, `scores` |
| `locked` | `games`, `digit_assignments` | `squares`, `draft_order`, `scores`, `players` |
| `live` | `games`, `scores` | `squares`, `digit_assignments`, `draft_order`, `players` |
| `completed` | `games`, `scores` | everything else |

**Files:** `hooks/use-realtime.ts`, `components/GameProvider.tsx`
**Estimated reduction:** ~50-67% fewer WAL polls during most-watched phases.

#### 1B. Remove Low-Change Tables from Publication (MEDIUM IMPACT)

**Problem:** `digit_assignments` and `draft_order` are in the `supabase_realtime` publication but change only a handful of times per game lifetime.

**Solution:** Remove them from the publication and rely on manual refetch when game status transitions.

```sql
ALTER PUBLICATION supabase_realtime DROP TABLE digit_assignments;
ALTER PUBLICATION supabase_realtime DROP TABLE draft_order;
```

App-side: when `games` status changes to `locked` or `batch1`/`batch2`, the existing `reload()` already fetches these tables via REST.

**Estimated reduction:** ~33% less WAL scanning overhead per poll.

#### 1C. Selective Reload Instead of Full Reload (MEDIUM IMPACT)

**Problem:** Every realtime change on ANY table triggers `reload()` which re-fetches ALL 6 tables. A score update triggers unnecessary re-fetches of squares, players, draft_order, etc.

**Solution:** Pass the changed table name from the realtime callback to reload, and only re-fetch that table.

```typescript
// In use-realtime.ts:
.on("postgres_changes", { table: "scores", ... }, () => onUpdate("scores"))
.on("postgres_changes", { table: "games", ... }, () => onUpdate("games"))

// In use-game.ts: selective fetch that merges into existing state
```

**Files:** `hooks/use-realtime.ts`, `hooks/use-game.ts`, `components/GameProvider.tsx`
**Estimated reduction:** ~80% fewer app queries (Q9, Q10, Q12).

---

### Priority 2: Reduce Subscription Churn (1.35% of DB Time)

#### 2A. Stabilize onUpdate Callback with useRef

**Problem:** 28K subscription upserts suggests the channel is being recreated frequently. The `useEffect` dependency on `onUpdate` may cause re-subscription when callback identity changes.

**Solution:** Use a `useRef` pattern to avoid re-subscribing:

```typescript
const onUpdateRef = useRef(onUpdate);
onUpdateRef.current = onUpdate;
// Remove onUpdate from useEffect deps, use onUpdateRef.current in listeners
```

**File:** `hooks/use-realtime.ts`

#### 2B. Debounce Rapid Reconnections

Add a 100-200ms delay before subscribing to a new channel, and cancel if the component unmounts within that window. Prevents thrashing on rapid page navigation.

---

### Priority 3: App Query Optimization (0.07% of DB Time - Low Priority)

- **Squares index:** Already has `idx_squares_game_id`, queries are 0.74-0.84ms with 100% cache hit. No action needed.
- **Column selection:** Could use specific columns instead of `select("*")` for marginal payload reduction. Low impact.
- **Volume reduction:** Handled by Priority 1C (selective reload).

---

## Implementation Order

| Step | Change | Files | Effort | Expected Impact |
|------|--------|-------|--------|-----------------|
| 1 | Stabilize onUpdate ref (2A) | `hooks/use-realtime.ts` | Small | Reduces 28K subscription churn |
| 2 | State-conditional subscriptions (1A) | `hooks/use-realtime.ts`, `GameProvider.tsx` | Medium | ~50-67% fewer WAL polls |
| 3 | Remove low-change tables from publication (1B) | New SQL migration | Small | ~33% less WAL scanning |
| 4 | Selective reload per table (1C) | `use-realtime.ts`, `use-game.ts`, `GameProvider.tsx` | Medium | ~80% fewer app queries |

**Combined estimated impact:** Steps 1-3 should reduce the 1.3M WAL polls by 60-80%, dropping `realtime.list_changes` total time from ~6.6M ms to ~1.3-2.6M ms. Step 4 further reduces app-level query volume.

---

## Additional Recommendations (from backend research)

### Debounce reload() Calls (QUICK WIN)

**Problem:** During draft phase, a single square pick triggers events on BOTH `squares` AND `draft_order` tables, causing 2 reload cycles (12 queries) for one user action. Live score updates via `/api/live-scores` write to Supabase, which triggers realtime, which triggers another full reload -- a feedback amplification loop.

**Solution:** Add 300ms debounce to `handleRealtimeUpdate` in `GameProvider.tsx`:

```typescript
const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleRealtimeUpdate = useCallback(() => {
  if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
  reloadTimeoutRef.current = setTimeout(() => {
    gameState.reload();
  }, 300);
}, [gameState.reload]);
```

**Expected impact:** 50-70% fewer SELECT bursts during active phases.

### Also Remove `players` from Publication

Backend research found that `players` table also changes very rarely (only during setup when players join). Adding it to the DROP list:

```sql
ALTER PUBLICATION supabase_realtime DROP TABLE digit_assignments;
ALTER PUBLICATION supabase_realtime DROP TABLE draft_order;
ALTER PUBLICATION supabase_realtime DROP TABLE players;
```

This reduces subscriptions per client from 6 to 3 tables (`games`, `squares`, `scores`), a ~50% reduction.

### Long-term: Switch to Broadcast from Database (ELIMINATES list_changes entirely)

**Problem:** `postgres_changes` has inherent per-subscriber authorization overhead. Even with `USING (true)` RLS, the check still runs. Changes are processed on a single thread -- compute upgrades don't help.

**Solution:** Use Supabase "Broadcast from Database" -- create DB triggers that call `realtime.send()`, then subscribe to broadcast channels on the client. Broadcast messages bypass the WAL polling and per-subscriber authorization entirely.

**Example trigger for `squares`:**
```sql
CREATE OR REPLACE FUNCTION public.broadcast_squares_change()
RETURNS trigger SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', 'squares', 'game_id', COALESCE(NEW.game_id, OLD.game_id)),
    'db_change',
    'game:' || COALESCE(NEW.game_id, OLD.game_id)::text,
    FALSE
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_squares_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.squares
FOR EACH ROW EXECUTE FUNCTION public.broadcast_squares_change();
```

**Client-side:**
```typescript
const channel = supabase
  .channel(`game-${gameId}`)
  .on('broadcast', { event: 'db_change' }, (payload) => {
    onUpdate(payload.payload.table);
  })
  .subscribe();
```

Then remove ALL tables from the publication. This eliminates `realtime.list_changes` entirely.

**Effort:** High (new migrations + triggers for each table + client refactor)
**Impact:** Eliminates the 97.9% query entirely. This is Supabase's officially recommended approach for scaling.

---

## Revised Implementation Order

| Step | Change | Effort | Impact |
|------|--------|--------|--------|
| 1 | Debounce reload (300ms) | Low | 50-70% fewer SELECT bursts |
| 2 | Stabilize onUpdate with useRef | Low | Prevents subscription churn |
| 3 | Remove 3 tables from publication (players, digit_assignments, draft_order) | Low | ~50% fewer WAL polls |
| 4 | State-conditional subscriptions | Medium | ~50-67% fewer remaining polls |
| 5 | Selective per-table reload | Medium | 5x fewer SELECTs per event |
| 6 | Switch to Broadcast from Database | High | Eliminates list_changes entirely |

Steps 1-3 are quick wins that can ship in a single PR. Steps 4-5 are medium-effort refactors. Step 6 is the definitive long-term solution.

### Supabase Dashboard Actions
- **Database > Publications > supabase_realtime**: Toggle OFF `digit_assignments`, `draft_order`, and `players`
- **Realtime > Inspector**: Monitor subscription counts and message rates after changes
- **Compute tier note**: WAL pull pool size scales with compute add-ons (Nano = 2 connections). Single-thread WAL processing is a hard bottleneck on free/small tiers.
