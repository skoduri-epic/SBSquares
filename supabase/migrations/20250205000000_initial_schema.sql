-- Super Bowl Squares Database Schema

-- Games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Super Bowl Squares',
  team_row TEXT NOT NULL DEFAULT 'Seahawks',
  team_col TEXT NOT NULL DEFAULT 'Patriots',
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'batch1', 'batch2', 'locked', 'live', 'completed')),
  game_code TEXT NOT NULL UNIQUE,
  pool_amount INTEGER NOT NULL DEFAULT 500,
  prize_per_quarter INTEGER NOT NULL DEFAULT 125,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '0000',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- Squares table (10x10 grid = 100 rows)
CREATE TABLE squares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  row_pos INTEGER NOT NULL CHECK (row_pos >= 0 AND row_pos <= 9),
  col_pos INTEGER NOT NULL CHECK (col_pos >= 0 AND col_pos <= 9),
  player_id UUID REFERENCES players(id),
  batch INTEGER CHECK (batch IN (1, 2)),
  picked_at TIMESTAMPTZ,
  UNIQUE(game_id, row_pos, col_pos)
);

-- Digit assignments (random 0-9 mapping for rows and columns)
CREATE TABLE digit_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  axis TEXT NOT NULL CHECK (axis IN ('row', 'col')),
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 9),
  digit INTEGER NOT NULL CHECK (digit >= 0 AND digit <= 9),
  UNIQUE(game_id, axis, position)
);

-- Draft order for each batch
CREATE TABLE draft_order (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  batch INTEGER NOT NULL CHECK (batch IN (1, 2)),
  player_id UUID NOT NULL REFERENCES players(id),
  pick_order INTEGER NOT NULL,
  picks_remaining INTEGER NOT NULL DEFAULT 5,
  UNIQUE(game_id, batch, player_id)
);

-- Scores per quarter
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  team_row_score INTEGER NOT NULL DEFAULT 0,
  team_col_score INTEGER NOT NULL DEFAULT 0,
  winner_player_id UUID REFERENCES players(id),
  runner_up_player_id UUID REFERENCES players(id),
  winner_prize INTEGER NOT NULL DEFAULT 0,
  runner_up_prize INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, quarter)
);

-- Enable realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE squares;
ALTER PUBLICATION supabase_realtime ADD TABLE digit_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE draft_order;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- Indexes for performance
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_squares_game_id ON squares(game_id);
CREATE INDEX idx_squares_player_id ON squares(player_id);
CREATE INDEX idx_digit_assignments_game_id ON digit_assignments(game_id);
CREATE INDEX idx_draft_order_game_id ON draft_order(game_id);
CREATE INDEX idx_scores_game_id ON scores(game_id);
CREATE INDEX idx_games_game_code ON games(game_code);

-- Row Level Security (open for now since auth is game-code based)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE squares ENABLE ROW LEVEL SECURITY;
ALTER TABLE digit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (game-code auth handled at app level)
CREATE POLICY "Allow all on games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on squares" ON squares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on digit_assignments" ON digit_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on draft_order" ON draft_order FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scores" ON scores FOR ALL USING (true) WITH CHECK (true);
