# SB Squares - Smoke Test Checklist (New Features)

Priority P0 tests for the 6 local commits. Run these first before diving into the full test plans.

**Prerequisites:** `npm run dev` running, Supabase local or hosted running with the new schema migration applied.

---

## 1. Create Game Flow (app/page.tsx)

- [ ] **Create game with custom settings**: Set max players to 20, price $10/square. Verify total pot shows $1000. Submit and verify game is created.
- [ ] **Max players dropdown**: Confirm options are 5, 10, 20, 25 only. Default is 10.
- [ ] **Pot calculation**: Change price to $2.50 with 10 players. Verify pot shows $250.

## 2. Admin Game Config (admin/page.tsx)

- [ ] **Settings visible**: Open admin dashboard. Verify max players, price per square, prize split (Q1-Q4), and winner % fields are shown.
- [ ] **Prize split validation**: Try setting Q1-Q4 to values that don't sum to 100%. Verify rejection.
- [ ] **Winner/runner-up default**: Verify 80/20 default split.
- [ ] **Prize summary card**: With $5/square, 25/25/25/25 split, 80% winner -- verify Q1 winner=$100, runner-up=$25.

## 3. QR Code & Invites (admin/page.tsx)

- [ ] **QR code visible**: Verify QR code displays in admin when invite_enabled is true.
- [ ] **Toggle off**: Turn invites off. QR code disappears. Reload -- still off.
- [ ] **Toggle on**: Turn invites on. QR code reappears. Scan it -- opens /join/[gameCode].

## 4. Self-Registration (/join/[gameCode])

- [ ] **Valid code**: Navigate to /join/[GAMECODE]. Verify game info card shows (code, teams, player count).
- [ ] **Invalid code**: Navigate to /join/FAKEGAME. Verify error: "Invalid game code. This game does not exist."
- [ ] **Register**: Enter name + 4-digit PIN + confirm PIN. Submit. Verify redirect to game page.
- [ ] **Duplicate name**: Try registering with an existing player name (case-insensitive). Verify error: "This name is already taken in this game."
- [ ] **Invites disabled**: Disable invites in admin, then try /join/[code]. Verify error: "This game is not accepting new players."
- [ ] **Max players**: Fill game to max, try joining. Verify error: "This game has reached its player limit (X/Y)."

## 5. Single-Batch Draft

- [ ] **20-player game**: Create game with 20 players. Start draft. Button says "Start Draft" (not "Start Batch 1").
- [ ] **Draft order label**: As player, verify PickControls shows "Draft Order" (not "Batch 1 Draft Order").
- [ ] **After all picks**: Admin sees "Reveal Numbers" directly (no "Start Batch 2").
- [ ] **10-player game (regression)**: Verify button still says "Start Batch 1" and two-batch flow works.

## 6. Game Rules Modal (game/[gameId]/page.tsx)

- [ ] **Auto-shows**: Log in to game, navigate to game page. Rules modal auto-appears on first visit.
- [ ] **4 rules**: Modal shows: ones digit, quarter scores, prize split, no overtime.
- [ ] **Dismiss + no re-show**: Close modal. Refresh page. Modal does NOT re-appear.
- [ ] **Info icon**: Click info icon in header. Modal re-opens.

---

**If all smoke tests pass**, proceed to the full test plans:
- `docs/uat-test-plan-new-features.md` (52 tests)
- `docs/uat-test-plan-admin-features.md` (39 tests)
- `docs/uat-test-plan-game-features.md` (52 tests)
