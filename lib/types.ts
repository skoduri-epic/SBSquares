export type GameStatus = "setup" | "batch1" | "batch2" | "locked" | "live" | "completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type Axis = "row" | "col";

/** Real-time score for the currently in-progress quarter (stored in games.live_quarter_score JSONB) */
export interface LiveQuarterScore {
  quarter: number;          // 1-4 (current period number)
  team_row_score: number;   // cumulative score for the row team
  team_col_score: number;   // cumulative score for the col team
  status_detail: string;    // e.g. "3:24 - 2nd Quarter"
}

export interface Game {
  id: string;
  name: string;
  team_row: string; // Seahawks
  team_col: string; // Patriots
  status: GameStatus;
  game_code: string;
  pool_amount: number;
  prize_per_quarter: number;
  max_players: number;
  price_per_square: number;
  prize_split: Record<string, number>;
  winner_pct: number;
  invite_enabled: boolean;
  auto_scores_enabled: boolean;
  espn_event_id: string | null;
  live_quarter_score: LiveQuarterScore | null;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  pin: string;
  is_admin: boolean;
  color: string;
  created_at: string;
}

export interface Square {
  id: string;
  game_id: string;
  row_pos: number;
  col_pos: number;
  player_id: string | null;
  batch: number | null;
  picked_at: string | null;
  is_tentative: boolean;
}

export interface DigitAssignment {
  id: string;
  game_id: string;
  axis: Axis;
  position: number;
  digit: number;
}

export interface DraftOrder {
  id: string;
  game_id: string;
  batch: number;
  player_id: string;
  pick_order: number;
  picks_remaining: number;
  tentative_started_at: string | null;
}

export interface Score {
  id: string;
  game_id: string;
  quarter: Quarter;
  team_row_score: number;
  team_col_score: number;
  winner_player_id: string | null;
  runner_up_player_id: string | null;
  winner_prize: number;
  runner_up_prize: number;
  recorded_at: string;
}

// Client-side session (stored in localStorage)
export interface Session {
  gameId: string;
  gameCode: string;
  playerId: string;
  playerName: string;
  isAdmin: boolean;
}

// Grid display data
export interface GridData {
  squares: Square[][];         // 10x10 matrix
  rowDigits: (number | null)[]; // null = not yet revealed
  colDigits: (number | null)[];
  players: Map<string, Player>;
}

// Player color map (25 visually distinct colors, well-spaced HSL hues)
export const PLAYER_COLORS = [
  // Original 10 (positions 0-9)
  "#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#A855F7",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
  // Extended 15 (positions 10-24)
  "#DC2626", "#2563EB", "#16A34A", "#CA8A04", "#9333EA",
  "#DB2777", "#0891B2", "#EA580C", "#4F46E5", "#0D9488",
  "#E11D48", "#7C3AED", "#059669", "#D97706", "#0284C7",
] as const;
