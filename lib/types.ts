export type GameStatus = "setup" | "batch1" | "batch2" | "locked" | "live" | "completed";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type Axis = "row" | "col";

export interface Game {
  id: string;
  name: string;
  team_row: string; // Seahawks
  team_col: string; // Patriots
  status: GameStatus;
  game_code: string;
  pool_amount: number;
  prize_per_quarter: number;
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

// Player color map
export const PLAYER_COLORS = [
  "#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#A855F7",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
] as const;
