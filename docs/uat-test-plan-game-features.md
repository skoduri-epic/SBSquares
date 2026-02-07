# SB Squares UAT Test Plan - Game Features

**Version:** 1.0
**Date:** 2026-02-06
**Scope:** Core game features - Login/Auth, Grid, Draft Flow (player view), Digit Reveal, Theme/Styling, Game Rules Modal, Help Page, Realtime Updates

---

## 1. LOGIN / AUTHENTICATION

**Source:** `app/page.tsx`
**Precondition for all tests:** App loaded at root URL. Supabase running. Game "SB2025" exists with players (Srini PIN=1234, Vikram PIN=2345, Ravi PIN=3456, etc.).

---

### TC-LG-001: Enter valid game code
**Priority:** P0

**Steps:**
1. Enter game code "SB2025". Submit.

**Expected Result:**
- Game found. UI shows player selection list.

**Pass/Fail:** ___

---

### TC-LG-002: Enter invalid game code
**Priority:** P0

**Steps:**
1. Enter "INVALID". Submit.

**Expected Result:**
- Error message (e.g., "Game not found"). Stays on code entry.

**Pass/Fail:** ___

---

### TC-LG-003: Select player name from list
**Priority:** P0

**Steps:**
1. After game found, click player name "Srini".

**Expected Result:**
- Player selected. PIN entry field shown.

**Pass/Fail:** ___

---

### TC-LG-004: Enter correct 4-digit PIN
**Priority:** P0

**Steps:**
1. Select "Srini". Enter PIN "1234". Submit.

**Expected Result:**
- Auth succeeds. Redirected to game page. Session stored.

**Pass/Fail:** ___

---

### TC-LG-005: Enter wrong PIN
**Priority:** P0

**Steps:**
1. Select "Srini". Enter PIN "0000". Submit.

**Expected Result:**
- Error: "Incorrect PIN". Stays on PIN entry. Can retry.

**Pass/Fail:** ___

---

### TC-LG-006: Session stored in localStorage
**Priority:** P1

**Preconditions:** Successfully logged in.

**Steps:**
1. DevTools > Application > Local Storage. Inspect.

**Expected Result:**
- Session data with game ID, player ID, player name.

**Pass/Fail:** ___

---

### TC-LG-007: Session persists across page refresh
**Priority:** P0

**Steps:**
1. Refresh the game page (F5).

**Expected Result:**
- Stays logged in. No re-authentication needed.

**Pass/Fail:** ___

---

### TC-LG-008: Game code case sensitivity
**Priority:** P2

**Steps:**
1. Enter "sb2025" (lowercase). Submit.

**Expected Result:**
- Verify behavior: game found (case-insensitive) or error. Document actual behavior.

**Pass/Fail:** ___

---

## 2. 10x10 GRID

**Source:** `components/Grid.tsx`, `components/GridCell.tsx`
**Precondition:** Logged into a game, on game page.

---

### TC-GR-001: Grid renders 10x10 with row/col headers
**Priority:** P0

**Steps:**
1. Observe the grid. Count rows and columns.

**Expected Result:**
- 10x10 grid (100 cells). Headers show digits 0-9 on both axes.

**Pass/Fail:** ___

---

### TC-GR-002: Team names on axes
**Priority:** P0

**Steps:**
1. Observe grid axis labels.

**Expected Result:**
- Team names on row and column axes. Properly sized, centered.

**Pass/Fail:** ___

---

### TC-GR-003: Team logos displayed
**Priority:** P1

**Steps:**
1. Observe grid axis labels for logos.

**Expected Result:**
- Team logos (ESPN CDN) appear next to team names. No broken images.

**Pass/Fail:** ___

---

### TC-GR-004: Empty squares show as available
**Priority:** P0

**Preconditions:** Game in draft, not all squares picked.

**Steps:**
1. Observe unclaimed squares.

**Expected Result:**
- Visually distinct (empty). No player initials or colors.

**Pass/Fail:** ___

---

### TC-GR-005: Claimed squares show player initials with color
**Priority:** P0

**Steps:**
1. Observe claimed squares.

**Expected Result:**
- Player initials shown. Colored with player's assigned color. Different players have different colors.

**Pass/Fail:** ___

---

### TC-GR-006: Current user's squares have distinct styling
**Priority:** P1

**Steps:**
1. Compare your squares to other players' squares.

**Expected Result:**
- Your squares have distinct visual style (border, outline, glow, or opacity difference).

**Pass/Fail:** ___

---

### TC-GR-007: Hover elevation effect on cells
**Priority:** P2

**Steps:**
1. Hover over grid cells.

**Expected Result:**
- Subtle shadow increase and slight lift on hover. Smooth transition.

**Pass/Fail:** ___

---

### TC-GR-008: Winner squares show trophy icon and quarter label
**Priority:** P0

**Preconditions:** Game "live" or "completed". Scores entered.

**Steps:**
1. Locate winning square after scores entered.

**Expected Result:**
- Trophy icon + quarter label (e.g., "Q1"). Gold styling (#F59E0B). Ring not clipped.

**Pass/Fail:** ___

---

### TC-GR-009: Runner-up squares show quarter label with silver styling
**Priority:** P0

**Steps:**
1. Locate runner-up square.

**Expected Result:**
- Quarter label badge. Silver styling (#94A3B8). No trophy icon.

**Pass/Fail:** ___

---

### TC-GR-010: Multiple quarter winners on grid
**Priority:** P1

**Preconditions:** Q1, Q2, Q3 all scored.

**Steps:**
1. Observe grid with 3 quarters scored.

**Expected Result:**
- Up to 6 badges (3 winners + 3 runner-ups). Correct quarter labels. Gold for winners, silver for runner-ups.

**Pass/Fail:** ___

---

### TC-GR-011: Bottom padding prevents winner ring clipping
**Priority:** P1

**Preconditions:** Winner square in bottom row (row 9).

**Steps:**
1. Observe winner ring at grid bottom.

**Expected Result:**
- Gold ring fully visible, not clipped.

**Pass/Fail:** ___

---

### TC-GR-012: Extended player colors for 20/25 player games
**Priority:** P1

**Preconditions:** 20 or 25 player game, all squares picked.

**Steps:**
1. Observe grid with all players' squares.

**Expected Result:**
- All players have distinct colors. No duplicates.

**Pass/Fail:** ___

---

## 3. DRAFT FLOW - PLAYER VIEW

**Source:** `components/PickControls.tsx`
**Precondition:** Logged in as player, game in draft status.

---

### TC-DF-001: "Your turn!" indicator
**Priority:** P0

**Preconditions:** It is the current player's turn.

**Steps:**
1. Observe PickControls.

**Expected Result:**
- "Your turn!" message. Random Pick and Manual Pick buttons visible.

**Pass/Fail:** ___

---

### TC-DF-002: Random Pick - auto-assigns all remaining picks
**Priority:** P0

**Steps:**
1. Click "Random Pick".

**Expected Result:**
- All remaining picks auto-assigned to random empty squares. Turn advances.

**Pass/Fail:** ___

---

### TC-DF-003: Manual Pick - enables tap-to-pick mode
**Priority:** P0

**Steps:**
1. Click "Manual Pick".

**Expected Result:**
- Manual mode active. Progress shows "0 of 5". Cancel button available.

**Pass/Fail:** ___

---

### TC-DF-004: Manual Pick - tap squares to claim
**Priority:** P0

**Steps:**
1. Click empty squares one by one until all picks used.

**Expected Result:**
- Each square claimed immediately. Progress updates. After last pick, mode ends.

**Pass/Fail:** ___

---

### TC-DF-005: Manual Pick - progress bar stays within bounds
**Priority:** P1

**Steps:**
1. Make picks and observe progress bar at each step.

**Expected Result:**
- Bar never overflows. Count accurate. At max, bar is full but not overflowing.

**Pass/Fail:** ___

---

### TC-DF-006: Cannot click already claimed squares
**Priority:** P0

**Steps:**
1. In manual mode, click an already claimed square.

**Expected Result:**
- Nothing happens. Pick count unchanged.

**Pass/Fail:** ___

---

### TC-DF-007: Cancel button in manual pick mode
**Priority:** P1

**Preconditions:** Manual mode, 2 of 5 picks made.

**Steps:**
1. Click "Cancel".

**Expected Result:**
- Mode exits. Picks already made remain. Can re-enter manual or use random.

**Pass/Fail:** ___

---

### TC-DF-008: Waiting message when another player's turn
**Priority:** P0

**Steps:**
1. Observe PickControls when it's NOT your turn.

**Expected Result:**
- "Waiting for [PlayerName] to pick..." shown. No pick buttons.

**Pass/Fail:** ___

---

### TC-DF-009: Completion message when all picks made
**Priority:** P0

**Steps:**
1. After completing all picks, observe PickControls.

**Expected Result:**
- "You've picked all your squares!" message. No pick buttons.

**Pass/Fail:** ___

---

### TC-DF-010: Draft progress - horizontal player avatar row
**Priority:** P1

**Steps:**
1. Observe draft order display.

**Expected Result:**
- Horizontal row of player avatars. Current picker highlighted/pulsing. Done players dimmed. Waiting players faded.

**Pass/Fail:** ___

---

### TC-DF-011: Page does not jump to top when picking
**Priority:** P1

**Preconditions:** Grid below the fold.

**Steps:**
1. Scroll to grid. Manual pick mode. Click a square.

**Expected Result:**
- Page stays at current scroll position. No jump to top.

**Pass/Fail:** ___

---

## 4. DIGIT REVEAL / NUMBER ASSIGNMENT

**Precondition:** All 100 squares picked. Admin clicks "Reveal Numbers".

---

### TC-DR-001: Digits assigned after reveal
**Priority:** P0

**Steps:**
1. Observe row/column headers after reveal.

**Expected Result:**
- Row and column headers show random digits 0-9.

**Pass/Fail:** ___

---

### TC-DR-002: Each digit appears exactly once per axis
**Priority:** P0

**Steps:**
1. Read all 10 row digits and all 10 column digits. Verify uniqueness.

**Expected Result:**
- Each digit 0-9 exactly once per axis. No duplicates.

**Pass/Fail:** ___

---

### TC-DR-003: SlidingNumber animation during reveal
**Priority:** P1

**Steps:**
1. Watch digit reveal animation.

**Expected Result:**
- Numbers slide/animate to final values. Slow, staggered. Large and bold.

**Pass/Fail:** ___

---

### TC-DR-004: Digits are random across different games
**Priority:** P2

**Steps:**
1. Compare digit assignments between two different games.

**Expected Result:**
- Assignments are different (randomized).

**Pass/Fail:** ___

---

## 5. THEME / STYLING

---

### TC-TH-001: Dark theme appearance
**Priority:** P0

**Steps:**
1. Observe overall page.

**Expected Result:**
- Dark background (#0B0F1A). Light text. All elements styled for dark theme.

**Pass/Fail:** ___

---

### TC-TH-002: Bebas Neue headers and Source Sans 3 body
**Priority:** P1

**Steps:**
1. Inspect headers and body text via DevTools.

**Expected Result:**
- Headers: Bebas Neue. Body: Source Sans 3. Fonts loaded (no fallbacks).

**Pass/Fail:** ___

---

### TC-TH-003: Player colors are distinct
**Priority:** P1

**Preconditions:** 10 players, squares picked.

**Steps:**
1. View grid. Compare colors.

**Expected Result:**
- 10 unique colors matching CSS variables --player-0 through --player-9.

**Pass/Fail:** ___

---

### TC-TH-004: Winner gold and runner-up silver colors
**Priority:** P0

**Steps:**
1. Observe winner and runner-up square styling.

**Expected Result:**
- Winner: gold (#F59E0B). Runner-up: silver (#94A3B8). Clearly different.

**Pass/Fail:** ___

---

### TC-TH-005: Dark/light theme toggle
**Priority:** P1

**Steps:**
1. Click theme toggle to light mode. Observe. Switch back to dark.

**Expected Result:**
- Light: white background, dark text, all elements readable.
- Dark: reverts correctly.
- No broken layouts in either mode.

**Pass/Fail:** ___

---

### TC-TH-006: Team-based color theming
**Priority:** P2

**Steps:**
1. Observe team-specific color accents.

**Expected Result:**
- Team colors reflected in UI elements (scoreboard, axis labels, accents).

**Pass/Fail:** ___

---

## 6. GAME RULES MODAL

---

### TC-GM-001: Rules modal auto-shows on first visit
**Priority:** P0

**Steps:**
1. Navigate to game page (first visit, clear localStorage if needed).

**Expected Result:**
- Modal auto-appears with 4 rules: ones digit, quarter scoring, prize splits, no overtime.

**Pass/Fail:** ___

---

### TC-GM-002: Rules modal dismiss and localStorage key
**Priority:** P0

**Steps:**
1. Dismiss modal. Check localStorage for `sbsquares-rules-seen-{gameId}`.

**Expected Result:**
- Modal closes. Key set. Does not reappear on reload.

**Pass/Fail:** ___

---

### TC-GM-003: Info icon reopens rules
**Priority:** P0

**Steps:**
1. Click info icon in header.

**Expected Result:**
- Modal reopens with same 4 rules.

**Pass/Fail:** ___

---

## 7. HELP PAGE

---

### TC-HP-001: Help page accessible from landing page
**Priority:** P1

**Steps:**
1. On landing page, find and click Help/How to Play link.

**Expected Result:**
- Navigates to `/help`. Help page loads.

**Pass/Fail:** ___

---

### TC-HP-002: Help page content
**Priority:** P1

**Steps:**
1. Read help page content.

**Expected Result:**
- Explains: game concept, grid mechanics, winner determination (last digit), prize distribution, game flow.

**Pass/Fail:** ___

---

### TC-HP-003: Help page navigation back
**Priority:** P2

**Steps:**
1. Click back link/button on help page.

**Expected Result:**
- Returns to landing page or previous page.

**Pass/Fail:** ___

---

## 8. REALTIME UPDATES

**Precondition:** Two browser windows for the same game (Admin + Player).

---

### TC-RT-001: Grid updates in real-time when another player picks
**Priority:** P0

**Preconditions:** Draft phase. Browser A: Player A picking. Browser B: Player B watching.

**Steps:**
1. Player A picks a square in Browser A.
2. Observe Browser B immediately.

**Expected Result:**
- Browser B grid updates within 1-3 seconds. No manual refresh needed.

**Pass/Fail:** ___

---

### TC-RT-002: Draft order updates in real-time
**Priority:** P1

**Steps:**
1. Player A completes picks. Observe Browser B draft order.

**Expected Result:**
- Draft order updates: Player A shown as done, next player highlighted.

**Pass/Fail:** ___

---

### TC-RT-003: Score updates in real-time
**Priority:** P0

**Preconditions:** Game "live". Browser A: Admin. Browser B: Player.

**Steps:**
1. Admin enters Q1 scores in Browser A. Observe Browser B.

**Expected Result:**
- Scoreboard updates. Winner/runner-up badges appear on grid. Within seconds, no refresh.

**Pass/Fail:** ___

---

### TC-RT-004: Player list updates when players added/removed
**Priority:** P1

**Steps:**
1. Admin adds player in Browser A. Observe Browser B.

**Expected Result:**
- New player appears in Browser B. Player count updates. No refresh.

**Pass/Fail:** ___

---

### TC-RT-005: Game status transition updates in real-time
**Priority:** P0

**Steps:**
1. Admin starts draft in Browser A. Observe Browser B.

**Expected Result:**
- Browser B transitions to draft view. PickControls appear. No refresh.

**Pass/Fail:** ___

---

## Summary

| Feature Area | Test Count | P0 | P1 | P2 |
|---|---|---|---|---|
| Login / Authentication | 8 | 5 | 1 | 1 |
| 10x10 Grid | 12 | 5 | 5 | 1 |
| Draft Flow (Player View) | 11 | 6 | 4 | 0 |
| Digit Reveal | 4 | 2 | 1 | 1 |
| Theme / Styling | 6 | 2 | 3 | 1 |
| Game Rules Modal | 3 | 3 | 0 | 0 |
| Help Page | 3 | 0 | 2 | 1 |
| Realtime Updates | 5 | 3 | 2 | 0 |
| **TOTAL** | **52** | **26** | **18** | **5** |
