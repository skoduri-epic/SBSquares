-- Seed data: Chemicos2k Super Bowl Squares game

-- Insert the game
INSERT INTO games (id, name, team_row, team_col, status, game_code, pool_amount, prize_per_quarter)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Chemicos2k Super Bowl LIX',
  'Seahawks',
  'Patriots',
  'setup',
  'SB2025',
  500,
  125
);

-- Insert 10 players (first player is admin, each with a unique 4-digit PIN)
INSERT INTO players (game_id, name, pin, is_admin, color) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Srini', '1234', TRUE, '#3B82F6'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Vikram', '2345', FALSE, '#EF4444'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ravi', '3456', FALSE, '#22C55E'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Karthik', '4567', FALSE, '#F59E0B'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Prasad', '5678', FALSE, '#A855F7'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Suresh', '6789', FALSE, '#EC4899'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ramesh', '7890', FALSE, '#06B6D4'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Anil', '8901', FALSE, '#F97316'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deepak', '9012', FALSE, '#6366F1'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Manoj', '0123', FALSE, '#14B8A6');

-- Initialize 100 empty squares (10x10 grid)
INSERT INTO squares (game_id, row_pos, col_pos)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  r.pos,
  c.pos
FROM
  generate_series(0, 9) AS r(pos),
  generate_series(0, 9) AS c(pos);
