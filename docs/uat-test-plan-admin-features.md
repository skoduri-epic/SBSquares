# SB Squares UAT Test Plan - Admin Features

**Version:** 1.0
**Date:** 2026-02-06
**Scope:** Admin dashboard features - Reset Game, Player Management, Score Entry, Game Status Transitions, Team Name Editing, Game Code Editing

---

## 1. RESET GAME

**Source:** `app/game/[gameId]/admin/page.tsx`
**Precondition for all tests:** Logged in as admin, on the admin dashboard.

---

### TC-RG-001: Full game reset - resets all data
**Priority:** P0

**Preconditions:** Game has progressed past setup. Squares picked, draft order exists, quarter results may exist.

**Steps:**
1. Click "Reset Game".
2. Observe confirmation dialog.
3. Confirm the reset.

**Expected Result:**
- Confirmation dialog appears before reset.
- After confirmation: squares cleared, draft order removed, quarter results cleared, status resets to **"setup"**.
- Players remain. Game settings preserved.

**Pass/Fail:** ___

---

### TC-RG-002: Full game reset - cancel confirmation
**Priority:** P1

**Steps:**
1. Click "Reset Game".
2. Cancel the confirmation dialog.

**Expected Result:**
- No reset occurs. Game state unchanged.

**Pass/Fail:** ___

---

### TC-RG-003: Clear Player Picks only
**Priority:** P0

**Preconditions:** Game in "batch1" or later. Players have picked squares.

**Steps:**
1. Click "Clear Player Picks".
2. Confirm.

**Expected Result:**
- All square assignments cleared. Grid is empty.
- Draft order reset. Players' picks_remaining restored based on getDraftConfig().
- Players NOT removed. Game settings preserved.
- Game status resets to **"setup"**.

**Pass/Fail:** ___

---

### TC-RG-004: Reset Game - only available to admin
**Priority:** P0

**Preconditions:** Logged in as a non-admin player.

**Steps:**
1. Attempt to access `/game/[gameId]/admin`.

**Expected Result:**
- Admin page not accessible or Reset/Clear buttons not visible.

**Pass/Fail:** ___

---

### TC-RG-005: Full reset during live game with scores
**Priority:** P1

**Preconditions:** Game "live" with Q1 and Q2 scores entered.

**Steps:**
1. Click "Reset Game" and confirm.

**Expected Result:**
- All quarter results cleared. Digit assignments cleared.
- Game returns to "setup". Grid empty.

**Pass/Fail:** ___

---

## 2. PLAYER MANAGEMENT

**Source:** `app/game/[gameId]/admin/page.tsx`
**Precondition for all tests:** Logged in as admin, game in "setup" status unless noted.

---

### TC-PM-001: Add single player
**Priority:** P0

**Steps:**
1. Click "Add Player".
2. Enter Name: "TestPlayer1", PIN: "9876".
3. Submit.

**Expected Result:**
- Player appears in list. Count increments.
- Player can log in with name "TestPlayer1" and PIN "9876".

**Pass/Fail:** ___

---

### TC-PM-002: Add player - respects max_players limit
**Priority:** P0

**Preconditions:** Game with max_players=10, currently has 10 players.

**Steps:**
1. Attempt to add an 11th player.

**Expected Result:**
- Rejected. Error indicates game is full. Count stays at 10.

**Pass/Fail:** ___

---

### TC-PM-003: Bulk add players
**Priority:** P0

**Preconditions:** Room for multiple players.

**Steps:**
1. Click "Bulk Add".
2. Enter comma-separated names: "Alice, Bob, Charlie".
3. Submit.

**Expected Result:**
- Three players added with auto-generated random 4-digit PINs.
- PINs displayed to admin after creation.
- Player count increases by 3.

**Pass/Fail:** ___

---

### TC-PM-004: Bulk add - exceeds max players
**Priority:** P1

**Preconditions:** Game with max_players=10, currently 8 players.

**Steps:**
1. Bulk add 5 names: "P1, P2, P3, P4, P5".

**Expected Result:**
- Rejected or partial add (verify which behavior). Error/warning shown.

**Pass/Fail:** ___

---

### TC-PM-005: Remove player - with confirmation
**Priority:** P0

**Steps:**
1. Click remove on a non-admin player.
2. Confirm removal.

**Expected Result:**
- Confirmation dialog shown. Player removed. Count decreases.
- Any squares picked by that player are cleared.

**Pass/Fail:** ___

---

### TC-PM-006: Remove player - cancel confirmation
**Priority:** P1

**Steps:**
1. Click remove on a player. Cancel the dialog.

**Expected Result:**
- Player not removed. No changes.

**Pass/Fail:** ___

---

### TC-PM-007: Cannot remove yourself as admin
**Priority:** P0

**Steps:**
1. Locate your own name. Attempt to remove yourself.

**Expected Result:**
- Remove button hidden, disabled, or shows error. Admin cannot self-remove.

**Pass/Fail:** ___

---

### TC-PM-008: Edit player name
**Priority:** P1

**Steps:**
1. Click edit for a player. Change name from "OldName" to "NewName". Save.

**Expected Result:**
- Name updates in list and on grid (initials update).

**Pass/Fail:** ___

---

### TC-PM-009: Edit player PIN
**Priority:** P1

**Steps:**
1. Click edit for a player. Change PIN to "0000". Save.

**Expected Result:**
- PIN updates. Player can log in with new PIN. Old PIN no longer works.

**Pass/Fail:** ___

---

### TC-PM-010: Promote player to secondary admin
**Priority:** P1

**Steps:**
1. Click promote/admin toggle for a non-admin player.

**Expected Result:**
- Player promoted. Admin badge appears. Player can access admin dashboard.

**Pass/Fail:** ___

---

### TC-PM-011: Demote secondary admin
**Priority:** P1

**Steps:**
1. Click demote/admin toggle for a secondary admin.

**Expected Result:**
- Player demoted. Admin badge removed. No longer has admin access.

**Pass/Fail:** ___

---

### TC-PM-012: Cannot demote yourself (primary admin)
**Priority:** P1

**Steps:**
1. Attempt to toggle your own admin status.

**Expected Result:**
- Toggle hidden, disabled, or error. Primary admin cannot self-demote.

**Pass/Fail:** ___

---

## 3. SCORE ENTRY

**Source:** `app/game/[gameId]/admin/page.tsx`, `lib/game-logic.ts`
**Precondition for all tests:** Game in "live" status, all squares assigned, digits revealed, logged in as admin.

---

### TC-SE-001: Enter Q1 scores and calculate winner
**Priority:** P0

**Steps:**
1. Enter Q1: Patriots 14, Seahawks 7. Submit.

**Expected Result:**
- Scores saved. Winner: last digit 14=**4** (row), 7=**7** (col). Square (4,7) wins.
- Runner-up: opposite square (7,4).
- Winner and runner-up player names displayed.

**Pass/Fail:** ___

---

### TC-SE-002: Same last digit - winner gets full quarter prize
**Priority:** P0

**Steps:**
1. Enter Q2: Team A = 21, Team B = 21. Submit.

**Expected Result:**
- Both digits = **1**. Square (1,1) wins.
- Same-digit: **winner gets 100% of quarter prize** (no runner-up payout).

**Pass/Fail:** ___

---

### TC-SE-003: Enter scores for all four quarters
**Priority:** P0

**Steps:**
1. Q1: 7-3. Q2: 14-10. Q3: 21-17. Q4: 28-24. Submit each.

**Expected Result:**
- Q1: (7,3) winner, (3,7) runner-up.
- Q2: (4,0) winner, (0,4) runner-up.
- Q3: (1,7) winner, (7,1) runner-up.
- Q4: (8,4) winner, (4,8) runner-up.
- Grid shows correct badges (trophy + Q label) on all winner/runner-up squares.

**Pass/Fail:** ___

---

### TC-SE-004: Edit/correct submitted scores
**Priority:** P0

**Preconditions:** Q1 scores already submitted.

**Steps:**
1. Click edit for Q1. Change Seahawks from 7 to 17. Save.

**Expected Result:**
- Scores update. Winners recalculate if needed. Grid badges update.

**Pass/Fail:** ___

---

### TC-SE-005: Per-quarter score reset
**Priority:** P1

**Preconditions:** Q2 scores submitted.

**Steps:**
1. Click reset for Q2. Confirm if needed.

**Expected Result:**
- Q2 scores cleared. Q2 winner/runner-up removed. Q2 badges removed from grid.
- Other quarters unaffected.

**Pass/Fail:** ___

---

### TC-SE-006: Scores only enterable in "live" status
**Priority:** P0

**Preconditions:** Game in "setup" or "locked" status.

**Steps:**
1. Navigate to admin. Look for Score Entry.

**Expected Result:**
- Score entry fields disabled or not visible.

**Pass/Fail:** ___

---

### TC-SE-007: Score entry with zero values
**Priority:** P1

**Steps:**
1. Enter Q1: 0-0. Submit.

**Expected Result:**
- Saves. Digits (0,0). Square (0,0) wins. Same-digit: full quarter prize to winner.

**Pass/Fail:** ___

---

### TC-SE-008: Score entry with large numbers
**Priority:** P2

**Steps:**
1. Enter Q4: Patriots 56, Seahawks 49. Submit.

**Expected Result:**
- Saves. Digits (6,9). Square (6,9) winner, (9,6) runner-up.

**Pass/Fail:** ___

---

## 4. GAME STATUS TRANSITIONS

**Source:** `app/game/[gameId]/admin/page.tsx`
**Precondition:** Logged in as admin.

---

### TC-ST-001: Setup to Batch 1 - Start Draft (multi-batch)
**Priority:** P0

**Preconditions:** 10-player game in "setup".

**Steps:**
1. Click "Start Batch 1".

**Expected Result:**
- Status changes to "batch1". Draft order generated. Players can pick.

**Pass/Fail:** ___

---

### TC-ST-002: Setup to Batch 1 - guard: not all players joined
**Priority:** P0

**Preconditions:** 10-player game in setup, only 7 players joined.

**Steps:**
1. Look for the "Start Batch 1" button.

**Expected Result:**
- **Testing note:** Verify whether the button is disabled when player count < max_players, or if admin can intentionally start early. Document actual behavior. This may be a gap.

**Pass/Fail:** ___

---

### TC-ST-003: Batch 1 to Batch 2 - Start Batch 2
**Priority:** P0

**Preconditions:** 10-player game. Batch 1 complete (50 squares picked).

**Steps:**
1. Click "Start Batch 2".

**Expected Result:**
- Status changes to "batch2". New draft order generated. Players pick remaining squares.

**Pass/Fail:** ___

---

### TC-ST-004: Batch 1 to Batch 2 - guard: picks incomplete
**Priority:** P0

**Preconditions:** 10-player game in batch1. Only 8 of 10 players completed picks.

**Steps:**
1. Look for "Start Batch 2" button.

**Expected Result:**
- Button is **disabled**. Message indicates not all players completed batch 1.

**Pass/Fail:** ___

---

### TC-ST-005: Batch to Locked - Reveal Numbers
**Priority:** P0

**Preconditions:** All 100 squares picked.

**Steps:**
1. Click "Reveal Numbers".

**Expected Result:**
- Status changes to "locked". Random digits 0-9 assigned to rows and columns.
- Each digit appears exactly once per axis.

**Pass/Fail:** ___

---

### TC-ST-006: Locked to Live - Start Game
**Priority:** P0

**Preconditions:** Game "locked". Digits revealed.

**Steps:**
1. Click "Start Game".

**Expected Result:**
- Status changes to "live". Score entry becomes available.

**Pass/Fail:** ___

---

### TC-ST-007: Live to Completed - End Game
**Priority:** P1

**Preconditions:** Game "live". All 4 quarters scored.

**Steps:**
1. Click "End Game".

**Expected Result:**
- Status changes to "completed". Final results displayed.

**Pass/Fail:** ___

---

### TC-ST-008: Cannot skip statuses
**Priority:** P1

**Preconditions:** Game in "setup".

**Steps:**
1. Verify no button to jump to "locked" or "live" from setup.

**Expected Result:**
- Only the next valid transition available.

**Pass/Fail:** ___

---

## 5. TEAM NAME EDITING

---

### TC-TN-001: Edit team names in setup status
**Priority:** P1

**Steps:**
1. In Game Settings, change "Patriots" to "Eagles" and "Seahawks" to "Chiefs". Save.

**Expected Result:**
- Names update. Grid axis labels reflect new names.

**Pass/Fail:** ___

---

### TC-TN-002: Edit team names in non-setup status
**Priority:** P1

**Preconditions:** Game in "live" status.

**Steps:**
1. Edit a team name. Save.

**Expected Result:**
- Editable in all statuses. Change reflects on grid.

**Pass/Fail:** ___

---

### TC-TN-003: Empty team name validation
**Priority:** P2

**Steps:**
1. Clear team name field. Attempt to save.

**Expected Result:**
- Validation error. Not saved.

**Pass/Fail:** ___

---

## 6. GAME CODE EDITING

---

### TC-GC-001: Edit game code
**Priority:** P1

**Steps:**
1. Change game code from "SB2025" to "SUPERBOWL". Save.

**Expected Result:**
- Code updates. "SUPERBOWL" works for login. "SB2025" no longer works.

**Pass/Fail:** ___

---

### TC-GC-002: Duplicate game code validation
**Priority:** P1

**Preconditions:** Two games exist (GAME1, GAME2).

**Steps:**
1. In Game B, try changing code to "GAME1". Save.

**Expected Result:**
- Error: code already in use. Not saved.

**Pass/Fail:** ___

---

### TC-GC-003: Game code format validation
**Priority:** P2

**Steps:**
1. Enter code with special characters (e.g., "GAME@#$"). Save.
2. Enter empty code. Save.

**Expected Result:**
- Verify behavior. Empty code should be rejected.

**Pass/Fail:** ___

---

## Summary

| Feature Area | Test Count | P0 | P1 | P2 |
|---|---|---|---|---|
| Reset Game | 5 | 3 | 2 | 0 |
| Player Management | 12 | 3 | 8 | 0 |
| Score Entry | 8 | 4 | 2 | 1 |
| Game Status Transitions | 8 | 5 | 3 | 0 |
| Team Name Editing | 3 | 0 | 2 | 1 |
| Game Code Editing | 3 | 0 | 2 | 1 |
| **TOTAL** | **39** | **15** | **19** | **3** |
