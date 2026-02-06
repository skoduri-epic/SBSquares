-- Add configurable game features: max players, pricing, prize split, QR invites

-- Max players per game (5, 10, 20, 25). Default 10.
ALTER TABLE games ADD COLUMN max_players INTEGER DEFAULT 10
  CHECK (max_players IN (5, 10, 20, 25));

-- Price per square. Total pot = price_per_square * 100.
ALTER TABLE games ADD COLUMN price_per_square DECIMAL(10,2) DEFAULT 5.00;

-- Per-quarter prize allocation (must sum to 100). Default equal split.
ALTER TABLE games ADD COLUMN prize_split JSONB DEFAULT '{"q1": 25, "q2": 25, "q3": 25, "q4": 25}';

-- Winner percentage of each quarter's pot. Runner-up gets (100 - winner_pct)%.
-- Default 80/20 split.
ALTER TABLE games ADD COLUMN winner_pct INTEGER DEFAULT 80
  CHECK (winner_pct >= 0 AND winner_pct <= 100);

-- Toggle whether new players can self-register via QR/join link.
ALTER TABLE games ADD COLUMN invite_enabled BOOLEAN DEFAULT true;
