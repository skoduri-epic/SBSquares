import type { DigitAssignment, Square, Player, Score, Game } from "./types";

/**
 * Find the winner and runner-up for a quarter score.
 *
 * Winner: owner of the square where row_digit matches last digit of team_row score,
 *         and col_digit matches last digit of team_col score.
 * Runner-up: owner of the OPPOSITE square (digits swapped).
 * If both digits are the same, winner gets the full prize, no runner-up.
 *
 * @param winnerPct - percentage of quarter pot for the winner (default 80).
 *                    Runner-up gets the remainder. Same-digit = 100% to winner.
 */
export function calculateQuarterResult(
  teamRowScore: number,
  teamColScore: number,
  squares: Square[][],
  digitAssignments: DigitAssignment[],
  players: Map<string, Player>,
  prizePerQuarter: number = 125,
  winnerPct: number = 80
): {
  winnerPlayerId: string | null;
  runnerUpPlayerId: string | null;
  winnerPrize: number;
  runnerUpPrize: number;
  winnerSquare: { row: number; col: number } | null;
  runnerUpSquare: { row: number; col: number } | null;
} {
  const rowDigit = teamRowScore % 10;
  const colDigit = teamColScore % 10;

  // Build digit-to-position maps
  const rowDigitToPos = new Map<number, number>();
  const colDigitToPos = new Map<number, number>();

  for (const da of digitAssignments) {
    if (da.axis === "row") {
      rowDigitToPos.set(da.digit, da.position);
    } else {
      colDigitToPos.set(da.digit, da.position);
    }
  }

  const winnerRow = rowDigitToPos.get(rowDigit);
  const winnerCol = colDigitToPos.get(colDigit);

  if (winnerRow === undefined || winnerCol === undefined) {
    return {
      winnerPlayerId: null,
      runnerUpPlayerId: null,
      winnerPrize: 0,
      runnerUpPrize: 0,
      winnerSquare: null,
      runnerUpSquare: null,
    };
  }

  const winnerSquare = squares[winnerRow]?.[winnerCol];
  const winnerPlayerId = winnerSquare?.player_id ?? null;

  // Same digit = winner gets full prize, no runner-up
  if (rowDigit === colDigit) {
    return {
      winnerPlayerId,
      runnerUpPlayerId: null,
      winnerPrize: prizePerQuarter,
      runnerUpPrize: 0,
      winnerSquare: { row: winnerRow, col: winnerCol },
      runnerUpSquare: null,
    };
  }

  // Different digits: runner-up is the OPPOSITE square (digits swapped)
  const runnerUpRow = rowDigitToPos.get(colDigit);
  const runnerUpCol = colDigitToPos.get(rowDigit);

  let runnerUpPlayerId: string | null = null;
  let runnerUpSquare: { row: number; col: number } | null = null;

  if (runnerUpRow !== undefined && runnerUpCol !== undefined) {
    const ruSquare = squares[runnerUpRow]?.[runnerUpCol];
    runnerUpPlayerId = ruSquare?.player_id ?? null;
    runnerUpSquare = { row: runnerUpRow, col: runnerUpCol };
  }

  const runnerUpPct = 100 - winnerPct;
  return {
    winnerPlayerId,
    runnerUpPlayerId,
    winnerPrize: Math.round(prizePerQuarter * winnerPct / 100),
    runnerUpPrize: Math.round(prizePerQuarter * runnerUpPct / 100),
    winnerSquare: { row: winnerRow, col: winnerCol },
    runnerUpSquare,
  };
}

/**
 * Generate a random permutation of digits 0-9 for axis assignment.
 */
export function generateDigitPermutation(): number[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

/**
 * Generate a randomized draft order for players.
 */
export function generateDraftOrder(playerIds: string[]): string[] {
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pick N random available squares from the grid.
 */
export function pickRandomSquares(
  squares: Square[][],
  count: number
): { row: number; col: number }[] {
  const available: { row: number; col: number }[] = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!squares[r][c].player_id) {
        available.push({ row: r, col: c });
      }
    }
  }

  // Fisher-Yates shuffle and take first N
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  return available.slice(0, count);
}

/**
 * Get player initials (first 2 characters of name).
 */
export function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get draft configuration based on max players.
 * <= 10 players: two batches (half picks each)
 * > 10 players: single batch (all picks at once)
 */
export function getDraftConfig(maxPlayers: number): {
  squaresPerPlayer: number;
  batches: number;
  batch1Picks: number;
  batch2Picks: number;
} {
  const squaresPerPlayer = Math.floor(100 / maxPlayers);
  const useTwoBatches = maxPlayers <= 10;
  if (useTwoBatches) {
    const half = Math.floor(squaresPerPlayer / 2);
    return {
      squaresPerPlayer,
      batches: 2,
      batch1Picks: half,
      batch2Picks: squaresPerPlayer - half,
    };
  }
  return {
    squaresPerPlayer,
    batches: 1,
    batch1Picks: squaresPerPlayer,
    batch2Picks: 0,
  };
}

/**
 * Calculate prize distribution for a game based on its configuration.
 * Uses price_per_square, prize_split (per-quarter percentages), and winner_pct.
 */
export function calculatePrizes(game: Game): {
  totalPot: number;
  quarters: {
    quarter: string;
    quarterPot: number;
    winnerPrize: number;
    runnerUpPrize: number;
    sameDigitPrize: number;
  }[];
} {
  const totalPot = game.price_per_square * 100;
  const runnerUpPct = 100 - game.winner_pct;

  return {
    totalPot,
    quarters: (["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
      const quarterPct = game.prize_split[q] ?? game.prize_split[q.toLowerCase()] ?? 25;
      const quarterPot = Math.round(totalPot * quarterPct / 100);
      return {
        quarter: q,
        quarterPot,
        winnerPrize: Math.round(quarterPot * game.winner_pct / 100),
        runnerUpPrize: Math.round(quarterPot * runnerUpPct / 100),
        sameDigitPrize: quarterPot,
      };
    }),
  };
}
