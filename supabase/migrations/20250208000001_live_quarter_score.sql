-- Add live_quarter_score JSONB column to games table
-- Stores the current in-progress quarter score for real-time grid pulsing.
-- Shape: { quarter: number, team_row_score: number, team_col_score: number, status_detail: string }
-- NULL when no quarter is actively in progress (pregame, halftime, between quarters, final).

ALTER TABLE games ADD COLUMN live_quarter_score JSONB DEFAULT NULL;
