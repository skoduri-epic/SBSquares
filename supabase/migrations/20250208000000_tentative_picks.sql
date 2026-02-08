-- Add tentative pick support for draft flow
-- Tentative picks are visible to all players in real-time but not finalized
-- until the picking player clicks "Confirm"

ALTER TABLE squares ADD COLUMN is_tentative BOOLEAN NOT NULL DEFAULT false;

-- Partial index: efficiently query tentative squares per game during drafting
CREATE INDEX idx_squares_tentative ON squares(game_id) WHERE is_tentative = true;

-- Track when a player started their tentative picks (for 2-min timer enforcement)
ALTER TABLE draft_order ADD COLUMN tentative_started_at TIMESTAMPTZ DEFAULT NULL;
