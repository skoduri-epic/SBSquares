# SB Squares UAT Test Plan - New Features

**Version:** 1.0
**Date:** 2026-02-06
**Scope:** Tasks #52-#59 (Configurable players, pricing, QR onboarding, single-batch draft, game rules modal)

---

## 1. CREATE GAME FLOW

**Source:** `app/page.tsx`
**Precondition for all tests:** User is on the landing page (root URL `/`). No active session in localStorage.

---

### TC-CG-001: Default values for Create Game form
**Priority:** P0

**Preconditions:** Landing page loaded, "Create a New Game" section visible.

**Steps:**
1. Navigate to the landing page.
2. Click the "Create a New Game" button/section (or locate the create game form).
3. Observe the default values for Max Players, Price Per Square, and Total Pot.

**Expected Result:**
- Max Players dropdown defaults to **10**.
- Price Per Square input defaults to **$5.00**.
- Total Pot displays: `10 players * 10 squares/player * $5.00 = $500.00`.

**Pass/Fail:** ___

---

### TC-CG-002: Max Players dropdown options
**Priority:** P0

**Preconditions:** Create Game form is visible.

**Steps:**
1. Click the Max Players dropdown.
2. Note all available options.

**Expected Result:**
- Dropdown contains exactly 4 options: **5, 10, 20, 25**.
- No other values are selectable.

**Pass/Fail:** ___

---

### TC-CG-003: Total Pot recalculates on Max Players change
**Priority:** P0

**Preconditions:** Create Game form visible with defaults (10 players, $5.00).

**Steps:**
1. Change Max Players to **5**. Note Total Pot and squares/player.
2. Change Max Players to **20**. Note Total Pot and squares/player.
3. Change Max Players to **25**. Note Total Pot and squares/player.
4. Change Max Players back to **10**. Note Total Pot and squares/player.

**Expected Result:**
- 5 players: $500 (20 squares/player)
- 20 players: $500 (5 squares/player)
- 25 players: $500 (4 squares/player)
- 10 players: $500 (10 squares/player)
- **The pot is always 100 * price_per_square regardless of player count** (since there are always 100 total squares).

**Pass/Fail:** ___

---

### TC-CG-004: Total Pot recalculates on Price Per Square change
**Priority:** P0

**Preconditions:** Create Game form visible, Max Players = 10.

**Steps:**
1. Clear the Price Per Square field and type **10.00**. Note Total Pot.
2. Change Price Per Square to **2.50**. Note Total Pot.
3. Change Price Per Square to **0.50**. Note Total Pot.

**Expected Result:**
- $10.00: Total Pot = $1,000.00
- $2.50: Total Pot = $250.00
- $0.50: Total Pot = $50.00

**Pass/Fail:** ___

---

### TC-CG-005: Price Per Square step increment
**Priority:** P1

**Preconditions:** Create Game form visible.

**Steps:**
1. Click the Price Per Square input field.
2. Use the up/down arrows (stepper) to increment and decrement the value.

**Expected Result:**
- The value changes in **$0.50** increments (e.g., $5.00 -> $5.50 -> $6.00).

**Pass/Fail:** ___

---

### TC-CG-006: Successful game creation with custom values
**Priority:** P0

**Preconditions:** Landing page loaded. Supabase backend is running.

**Steps:**
1. Open the Create Game form.
2. Enter a game code (e.g., "TESTGAME").
3. Set Max Players to **20**.
4. Set Price Per Square to **$10.00**.
5. Enter team names (e.g., "Eagles" and "Chiefs").
6. Submit the form.

**Expected Result:**
- Game is created successfully.
- User is redirected to the game page or admin page.
- In the database: `max_players=20`, `price_per_square=10.00`, `pool_amount=1000.00`, `prize_split` default, `winner_pct=80`, `invite_enabled=true`.

**Pass/Fail:** ___

---

### TC-CG-007: Game creation with minimum values
**Priority:** P1

**Preconditions:** Landing page loaded.

**Steps:**
1. Set Max Players to **5**.
2. Set Price Per Square to the minimum allowed value (e.g., $0.50).
3. Fill in other required fields.
4. Submit.

**Expected Result:**
- Game creates successfully with `max_players=5`, `price_per_square=0.50`.
- Total Pot = $50.00.

**Pass/Fail:** ___

---

### TC-CG-008: Game creation with 25 players
**Priority:** P1

**Preconditions:** Landing page loaded.

**Steps:**
1. Set Max Players to **25**.
2. Set Price Per Square to $5.00.
3. Fill in other required fields and submit.

**Expected Result:**
- Game creates successfully.
- Total Pot = $500.00.
- Database has `max_players=25`.

**Pass/Fail:** ___

---

## 2. ADMIN GAME CONFIGURATION

**Source:** `app/game/[gameId]/admin/page.tsx`
**Precondition for all tests:** Logged in as admin, on the admin dashboard, game is in "setup" status unless noted.

---

### TC-AC-001: Max Players selector displays current value
**Priority:** P0

**Preconditions:** Admin dashboard loaded for a game with `max_players=10`.

**Steps:**
1. Navigate to the Game Settings / Configuration section in admin.
2. Locate the Max Players selector.

**Expected Result:**
- Max Players shows **10** as the current value.
- All four options (5, 10, 20, 25) are available.

**Pass/Fail:** ___

---

### TC-AC-002: Max Players is locked after players join
**Priority:** P0

**Preconditions:** Game in "setup" status with at least 1 player already joined.

**Steps:**
1. Navigate to Admin > Game Settings.
2. Attempt to change the Max Players value.

**Expected Result:**
- The Max Players selector is **disabled/locked**.
- A message or visual indicator explains that Max Players cannot be changed after players have joined.

**Pass/Fail:** ___

---

### TC-AC-003: Max Players editable when no players have joined
**Priority:** P1

**Preconditions:** Game in "setup" status with **0 non-admin players** joined.

**Steps:**
1. Navigate to Admin > Game Settings.
2. Change Max Players from 10 to 20.
3. Save/apply the change.

**Expected Result:**
- The change is accepted and saved.
- The new value (20) is reflected in the UI.

**Pass/Fail:** ___

---

### TC-AC-004: Price Per Square editor
**Priority:** P0

**Preconditions:** Admin dashboard, game in "setup" status.

**Steps:**
1. Locate the Price Per Square editor in settings.
2. Change the value from $5.00 to $7.50.
3. Save the change.

**Expected Result:**
- Value updates to $7.50.
- Total Pot / Prize Summary recalculates accordingly.

**Pass/Fail:** ___

---

### TC-AC-005: Prize Split per quarter - valid split summing to 100%
**Priority:** P0

**Preconditions:** Admin dashboard, game in "setup" status.

**Steps:**
1. Locate the Prize Split section (Q1, Q2, Q3, Q4 percentages).
2. Verify the default split (25/25/25/25).
3. Change the split to Q1=15%, Q2=20%, Q3=25%, Q4=40%.
4. Save/apply.

**Expected Result:**
- The split sums to 100%.
- Values save successfully.
- Prize Summary card updates with new dollar amounts per quarter.

**Pass/Fail:** ___

---

### TC-AC-006: Prize Split per quarter - reject split not summing to 100%
**Priority:** P0

**Preconditions:** Admin dashboard, game in "setup" status.

**Steps:**
1. Set Q1=25%, Q2=25%, Q3=25%, Q4=20% (total = 95%).
2. Attempt to save.

**Expected Result:**
- An error message or validation indicator appears stating the percentages must sum to 100%.
- The invalid split is **not saved**.

**Pass/Fail:** ___

---

### TC-AC-007: Winner/Runner-up percentage split default
**Priority:** P1

**Preconditions:** Admin dashboard for a newly created game.

**Steps:**
1. Navigate to Game Settings.
2. Locate the Winner/Runner-up split.

**Expected Result:**
- Default is **80% Winner / 20% Runner-up**.

**Pass/Fail:** ___

---

### TC-AC-008: Winner/Runner-up percentage split change
**Priority:** P1

**Preconditions:** Admin dashboard, game in "setup" status.

**Steps:**
1. Change Winner percentage to **70%**.
2. Verify Runner-up auto-calculates to **30%**.
3. Save.

**Expected Result:**
- Winner = 70%, Runner-up = 30%.
- Prize Summary card updates accordingly.

**Pass/Fail:** ___

---

### TC-AC-009: Prize Summary card calculation
**Priority:** P0

**Preconditions:** Game with: max_players=10, price_per_square=$5.00, total pot=$500, prize_split={q1:10, q2:20, q3:30, q4:40}, winner_pct=80.

**Steps:**
1. Navigate to Admin > Game Settings.
2. Review the Prize Summary card.

**Expected Result:**
- **Total Pot = 100 * $5.00 = $500.00**
- Q1: $500 * 10% = $50. Winner: $40 (80%). Runner-up: $10 (20%).
- Q2: $500 * 20% = $100. Winner: $80. Runner-up: $20.
- Q3: $500 * 30% = $150. Winner: $120. Runner-up: $30.
- Q4: $500 * 40% = $200. Winner: $160. Runner-up: $40.

**Pass/Fail:** ___

---

### TC-AC-010: Settings locked when game not in "setup" status
**Priority:** P0

**Preconditions:** Game is in "batch1" (or any non-setup) status.

**Steps:**
1. Navigate to Admin > Game Settings.
2. Attempt to change Max Players, Price Per Square, Prize Split, or Winner %.

**Expected Result:**
- All configuration fields are **disabled/read-only**.
- No changes can be saved.

**Pass/Fail:** ___

---

## 3. QR CODE AND INVITE MANAGEMENT

**Source:** `app/game/[gameId]/admin/page.tsx`
**Precondition for all tests:** Logged in as admin, on admin dashboard.

---

### TC-QR-001: QR code displays for game
**Priority:** P0

**Preconditions:** Admin dashboard loaded, invite_enabled = true.

**Steps:**
1. Locate the QR Code / Invite section on the admin dashboard.
2. Observe the QR code image.

**Expected Result:**
- A QR code is displayed.
- Scanning the QR code opens the self-registration page at `/join/[gameCode]`.

**Pass/Fail:** ___

---

### TC-QR-002: Toggle invite off hides QR code
**Priority:** P0

**Preconditions:** Admin dashboard, invites currently enabled (QR code visible).

**Steps:**
1. Toggle the invite_enabled switch to **OFF**.
2. Observe the QR code section.

**Expected Result:**
- The QR code **disappears**.
- The change persists (reload the page and verify QR is still hidden).

**Pass/Fail:** ___

---

### TC-QR-003: Toggle invite on shows QR code
**Priority:** P0

**Preconditions:** Admin dashboard, invites currently disabled (QR code hidden).

**Steps:**
1. Toggle the invite_enabled switch to **ON**.

**Expected Result:**
- The QR code **reappears** and is valid/scannable.

**Pass/Fail:** ___

---

### TC-QR-004: QR code URL matches game code
**Priority:** P1

**Preconditions:** Game with code "SB2025", invites enabled.

**Steps:**
1. View the QR code on admin dashboard.
2. Scan the QR code with a mobile device or QR scanner.

**Expected Result:**
- The URL is `https://[domain]/join/SB2025`.
- Opening the URL loads the self-registration page for game "SB2025".

**Pass/Fail:** ___

---

### TC-QR-005: Invite toggle persists across page reload
**Priority:** P1

**Preconditions:** Admin dashboard.

**Steps:**
1. Set invite toggle to OFF.
2. Reload the admin page.
3. Check the toggle state and QR visibility.

**Expected Result:**
- Toggle remains OFF.
- QR code remains hidden.
- Setting is stored in the database.

**Pass/Fail:** ___

---

## 4. SELF-REGISTRATION VIA QR (/join/[gameCode])

**Source:** `app/join/[gameCode]/page.tsx`
**Precondition for all tests:** Game exists in "setup" status with invite_enabled=true and fewer than max_players joined, unless stated otherwise.

---

### TC-SR-001: Valid game code loads join page
**Priority:** P0

**Steps:**
1. Navigate to `/join/SB2025`.

**Expected Result:**
- Join page loads. Game info card shows: game code, team names, player count (e.g., "3 / 10").
- Form with fields: Name, PIN (4-digit), Confirm PIN.

**Pass/Fail:** ___

---

### TC-SR-002: Invalid game code shows error
**Priority:** P0

**Steps:**
1. Navigate to `/join/FAKEGAME`.

**Expected Result:**
- Error: **"Invalid game code. This game does not exist."**
- No form shown.

**Pass/Fail:** ___

---

### TC-SR-002B: Game code is case-insensitive
**Priority:** P1

**Steps:**
1. Navigate to `/join/sb2025` (lowercase).

**Expected Result:**
- Game is found (code uppercased before lookup). Join page loads normally.

**Pass/Fail:** ___

---

### TC-SR-003: Successful self-registration
**Priority:** P0

**Steps:**
1. Navigate to `/join/SB2025`.
2. Enter Name: "NewPlayer", PIN: "5678", Confirm PIN: "5678".
3. Submit.

**Expected Result:**
- Registration succeeds. Session set with `isAdmin=false`.
- Redirected to `/game/{gameId}`.
- Player auto-assigned next available color from PLAYER_COLORS.

**Pass/Fail:** ___

---

### TC-SR-004: Validation - Name required
**Priority:** P0

**Steps:**
1. Leave Name empty. Enter PIN: "1234", Confirm: "1234". Submit.

**Expected Result:**
- Error: **"Name cannot be empty."**

**Pass/Fail:** ___

---

### TC-SR-005: Validation - PIN must be 4 digits
**Priority:** P0

**Steps:**
1. Enter Name: "TestPlayer", PIN: "12", Confirm: "12". Submit.

**Expected Result:**
- Error: **"PIN must be exactly 4 digits."**

**Pass/Fail:** ___

---

### TC-SR-006: PIN field strips non-digits automatically
**Priority:** P1

**Steps:**
1. In the PIN field, type "ab12cd34".

**Expected Result:**
- Field shows only **"1234"** -- non-digits stripped automatically via onChange.

**Pass/Fail:** ___

---

### TC-SR-007: Validation - PINs must match
**Priority:** P0

**Steps:**
1. Enter Name: "TestPlayer", PIN: "1234", Confirm: "5678". Submit.

**Expected Result:**
- Error: **"PINs do not match."**

**Pass/Fail:** ___

---

### TC-SR-008: Reject when game is locked/live/completed
**Priority:** P0

**Preconditions:** Game in "locked" (or "live" or "completed") status.

**Steps:**
1. Navigate to `/join/[gameCode]`.

**Expected Result:**
- Error: **"This game has already started and is no longer accepting new players."**
- No form shown.

**Pass/Fail:** ___

---

### TC-SR-008B: Registration blocked during batch1 and batch2
**Priority:** P1

**Preconditions:** Game in "batch1" status. Below max players.

**Steps:**
1. Navigate to `/join/[gameCode]`.

**Expected Result:**
- Error: **"This game's draft has already started. Contact the game admin to be added."**
- No form shown. Registration is blocked once draft starts.

**Pass/Fail:** ___

---

### TC-SR-009: Reject when invites disabled
**Priority:** P0

**Preconditions:** Game in setup, `invite_enabled=false`.

**Steps:**
1. Navigate to `/join/[gameCode]`.

**Expected Result:**
- Error: **"This game is not accepting new players."**
- No form shown.

**Pass/Fail:** ___

---

### TC-SR-010: Reject when max players reached
**Priority:** P0

**Preconditions:** Game with max_players=10 has 10 players.

**Steps:**
1. Navigate to `/join/[gameCode]`.

**Expected Result:**
- Error: **"This game has reached its player limit (10/10)."**
- No form shown (error on page load).

**Pass/Fail:** ___

---

### TC-SR-010B: Race condition - max players re-checked before insert
**Priority:** P0

**Preconditions:** Game with max_players=10 has 9 players. Two users on join page simultaneously.

**Steps:**
1. User A and B both load page (both see "9 / 10").
2. User A submits first (succeeds, now 10/10).
3. User B submits second.

**Expected Result:**
- User B rejected with: **"Game is full (10/10)."**

**Pass/Fail:** ___

---

### TC-SR-011: Duplicate name - case-insensitive
**Priority:** P1

**Preconditions:** Game has player "Srini".

**Steps:**
1. Try registering as "srini" (lowercase).

**Expected Result:**
- Error: **"This name is already taken in this game."**

**Pass/Fail:** ___

---

### TC-SR-012: Game info card displays correct information
**Priority:** P1

**Preconditions:** Game "SB2025" with teams "Patriots" vs "Seahawks", max_players=10, 6 players joined.

**Steps:**
1. Navigate to `/join/SB2025`. Observe game info card.

**Expected Result:**
- Game code: "SB2025". Teams: "Patriots" and "Seahawks". Players: "6 / 10".

**Pass/Fail:** ___

---

## 5. SINGLE-BATCH DRAFT FLOW

**Source:** `app/game/[gameId]/admin/page.tsx`, `components/PickControls.tsx`, `lib/game-logic.ts`
**Precondition:** Game set up with the specified max_players value and players have joined.

---

### TC-DB-001: 20-player game uses single-batch draft
**Priority:** P0

**Preconditions:** Game with max_players=20, players joined.

**Steps:**
1. Navigate to Admin dashboard. Observe draft control section.

**Expected Result:**
- Button says **"Start Draft"** (NOT "Start Batch 1").
- getDraftConfig: `{ squaresPerPlayer: 5, batches: 1, batch1Picks: 5, batch2Picks: 0 }`
- Each player picks 5 squares in a single batch.

**Pass/Fail:** ___

---

### TC-DB-002: 25-player game uses single-batch draft
**Priority:** P0

**Preconditions:** Game with max_players=25, players joined.

**Steps:**
1. Navigate to Admin dashboard.

**Expected Result:**
- Button says **"Start Draft"**.
- getDraftConfig: `{ squaresPerPlayer: 4, batches: 1, batch1Picks: 4, batch2Picks: 0 }`

**Pass/Fail:** ___

---

### TC-DB-003: 5-player game uses two-batch draft
**Priority:** P0

**Preconditions:** Game with max_players=5, players joined.

**Steps:**
1. Navigate to Admin dashboard.

**Expected Result:**
- Button says **"Start Batch 1"** (two-batch mode).
- getDraftConfig: `{ squaresPerPlayer: 20, batches: 2, batch1Picks: 10, batch2Picks: 10 }`

**Pass/Fail:** ___

---

### TC-DB-004: 10-player game uses two-batch draft
**Priority:** P0

**Preconditions:** Game with max_players=10, players joined.

**Steps:**
1. Navigate to Admin dashboard.

**Expected Result:**
- Button says **"Start Batch 1"**.
- getDraftConfig: `{ squaresPerPlayer: 10, batches: 2, batch1Picks: 5, batch2Picks: 5 }`

**Pass/Fail:** ___

---

### TC-DB-005: Single-batch draft - PickControls label
**Priority:** P1

**Preconditions:** 20-player game in "batch1" (single-batch). Logged in as player.

**Steps:**
1. View game page. Observe PickControls.

**Expected Result:**
- Draft order heading says **"Draft Order"** (NOT "Batch 1 Draft Order").

**Pass/Fail:** ___

---

### TC-DB-006: Single-batch - after all picks, shows Reveal Numbers directly
**Priority:** P0

**Preconditions:** 20-player game, single-batch. All 100 squares picked.

**Steps:**
1. Navigate to Admin dashboard after all picks complete.

**Expected Result:**
- Admin sees **"Reveal Numbers"** button directly.
- There is **no** "Start Batch 2" button.
- Game does not enter "batch2" state.

**Pass/Fail:** ___

---

### TC-DB-007: Single-batch - completion message hides batch number
**Priority:** P1

**Preconditions:** 20-player game, player completed all 5 picks.

**Steps:**
1. Observe completion message.

**Expected Result:**
- Message says "You've picked all your squares!" -- does **not** mention "Batch 1".

**Pass/Fail:** ___

---

### TC-DB-008: Multi-batch draft - Batch 2 still works (regression)
**Priority:** P0

**Preconditions:** 10-player game. Batch 1 complete. Admin starts Batch 2.

**Steps:**
1. Admin clicks "Start Batch 2".
2. Players pick remaining 5 squares each.
3. All 100 squares filled.

**Expected Result:**
- Batch 2 flow works as before.
- PickControls shows "Batch 2 Draft Order".
- "Reveal Numbers" available after completion.

**Pass/Fail:** ___

---

### TC-DB-009: Single-batch - correct squares per player (20 players)
**Priority:** P0

**Preconditions:** 20-player game, draft started.

**Steps:**
1. As a player, pick 5 squares. Attempt to pick a 6th.

**Expected Result:**
- After 5 picks, player cannot pick more.
- PickControls shows "5 of 5 picked".

**Pass/Fail:** ___

---

### TC-DB-010: Single-batch - 25 player game, 4 picks each
**Priority:** P1

**Preconditions:** 25-player game, draft started.

**Steps:**
1. As a player, pick 4 squares. Attempt 5th.

**Expected Result:**
- After 4 picks, player is done. Total across all 25 players = 100.

**Pass/Fail:** ___

---

## 6. GAME RULES MODAL

**Source:** `app/game/[gameId]/page.tsx`
**Precondition:** Logged into a game as a player.

---

### TC-RM-001: Rules modal auto-shows on first visit
**Priority:** P0

**Preconditions:** No localStorage entry for this game's rules-seen flag.

**Steps:**
1. Navigate to the game page.

**Expected Result:**
- Modal auto-appears with 4 rules: ones digit, quarter scores, 20%/5% prizes, no overtime.

**Pass/Fail:** ___

---

### TC-RM-002: Rules modal does not show on revisit
**Priority:** P0

**Steps:**
1. Dismiss the modal. Navigate away. Return to game page.

**Expected Result:**
- Modal does NOT auto-appear.

**Pass/Fail:** ___

---

### TC-RM-003: localStorage flag is set
**Priority:** P1

**Steps:**
1. After dismissing modal, check localStorage for `sbsquares-rules-seen-{gameId}`.

**Expected Result:**
- Key exists with truthy value.

**Pass/Fail:** ___

---

### TC-RM-004: Info icon in header reopens rules modal
**Priority:** P0

**Steps:**
1. Click the info icon in the game page header.

**Expected Result:**
- Rules modal reopens with the same 4 rules.

**Pass/Fail:** ___

---

### TC-RM-005: Rules modal reappears after clearing localStorage
**Priority:** P2

**Steps:**
1. Delete the rules-seen key from localStorage. Reload game page.

**Expected Result:**
- Modal auto-appears again.

**Pass/Fail:** ___

---

### TC-RM-006: Rules modal content accuracy
**Priority:** P1

**Steps:**
1. Read all 4 rules in the modal.

**Expected Result:**
- Rule 1: Last digit of each team's score determines winning square.
- Rule 2: Scores checked at end of each quarter.
- Rule 3: Winner gets majority, runner-up gets remainder. Same score = winner gets both.
- Rule 4: Overtime does not count.

**Pass/Fail:** ___

---

### TC-RM-007: Rules modal per-game isolation
**Priority:** P1

**Preconditions:** Player in two different games.

**Steps:**
1. Visit Game A -- dismiss modal.
2. Visit Game B for the first time.

**Expected Result:**
- Modal auto-shows for Game B (separate localStorage key per game).

**Pass/Fail:** ___

---

## Summary

| Feature Area | Test Count | P0 | P1 | P2 |
|---|---|---|---|---|
| Create Game Flow | 8 | 4 | 3 | 0 |
| Admin Game Configuration | 10 | 5 | 3 | 0 |
| QR Code & Invite Mgmt | 5 | 3 | 2 | 0 |
| Self-Registration | 14 | 7 | 5 | 0 |
| Single-Batch Draft | 10 | 5 | 4 | 0 |
| Game Rules Modal | 7 | 3 | 3 | 1 |
| **TOTAL** | **54** | **27** | **20** | **1** |
