-- Backfill existing games with default values for new columns
-- (existing rows have NULL because ALTER TABLE ADD COLUMN with DEFAULT
--  only applies the default to new rows in some Postgres versions)

UPDATE games SET max_players = 10 WHERE max_players IS NULL;
UPDATE games SET price_per_square = 5.00 WHERE price_per_square IS NULL;
UPDATE games SET prize_split = '{"q1": 25, "q2": 25, "q3": 25, "q4": 25}' WHERE prize_split IS NULL;
UPDATE games SET winner_pct = 80 WHERE winner_pct IS NULL;
UPDATE games SET invite_enabled = true WHERE invite_enabled IS NULL;
