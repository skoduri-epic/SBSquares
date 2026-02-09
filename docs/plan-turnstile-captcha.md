# Plan: Add Cloudflare Turnstile CAPTCHA to Game Creation

**Status:** Planned
**Priority:** High
**Reason:** A spam bot created a fake game ("Kyleigh Bode" / HOLLOW) via direct Supabase insert. Game creation is entirely client-side with no server verification.

## Approach

- Move game creation from client-side Supabase inserts to a new server API route
- Add Turnstile widget to the create game form
- Server verifies the CAPTCHA token with Cloudflare before performing DB inserts
- Graceful fallback: if Turnstile not configured (local dev), skip verification

## Files

| File | Action | What |
|------|--------|------|
| `app/api/games/create/route.ts` | CREATE | Server API: verify Turnstile token, validate inputs, insert game+player+squares |
| `app/page.tsx` | MODIFY | Add Turnstile widget to create form, replace direct Supabase calls with `fetch("/api/games/create")` |
| `.env.local` | MODIFY | Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` |

## Steps

### 1. Install package

```bash
npm install @marsidev/react-turnstile
```

### 2. Environment variables

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA       # test key for local dev
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA       # test key for local dev
```

Production: real keys from Cloudflare Turnstile dashboard.

### 3. Create `app/api/games/create/route.ts`

POST handler that:
1. Validates all inputs server-side (code format, PIN format, teams different)
2. Verifies Turnstile token via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
3. If `TURNSTILE_SECRET_KEY` not set, skip verification (local dev fallback)
4. Checks game count < MAX_GAMES (20)
5. Inserts game, player, and 100 squares (with cleanup on partial failure)
6. Returns `{ success: true, session: { gameId, gameCode, playerId, playerName, isAdmin } }`

Pattern follows existing `app/api/live-scores/route.ts` and `app/api/superadmin/verify/route.ts`.

### 4. Modify `app/page.tsx`

- Add imports: `Turnstile` from `@marsidev/react-turnstile`
- Add state: `turnstileToken`, `turnstileStatus`, `turnstileRef`
- Add `<Turnstile>` widget in create form, above the submit button, `theme: "dark"`
- Replace `handleCreateGame()` body: call `/api/games/create` instead of direct Supabase inserts
- On error: reset Turnstile widget for retry (tokens are single-use)
- Disable submit button while Turnstile is loading
- If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` not set: widget not rendered, show "CAPTCHA not configured"

### 5. Token flow

```
Form filled -> Turnstile auto-generates token -> User clicks "Create Game"
-> POST /api/games/create { turnstileToken, code, name, ... }
-> Server verifies token with Cloudflare siteverify
-> If valid: insert game+player+squares, return session
-> Client: setSession() + router.push()
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Widget still loading | Submit button disabled |
| Token expired | "Verification expired" + refresh link |
| Cloudflare rejects token | 403 -> "CAPTCHA verification failed" |
| Duplicate game code | 409 -> "This game code is already taken" |
| Game limit reached | 409 -> "Maximum number of games reached" |
| Secret key not set | Skip verification (dev mode) |
| Any error | Reset Turnstile widget for retry |

## Verification

1. `npm run build` passes
2. Local dev with test keys: create game form shows Turnstile widget, game creation works
3. Without keys: "CAPTCHA not configured" shown, creation still works (dev fallback)
4. Production: real Cloudflare keys, bot submissions blocked
