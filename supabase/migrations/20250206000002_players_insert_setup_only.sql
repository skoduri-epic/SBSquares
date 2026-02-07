-- Restrict player self-registration to games in "setup" status only.
-- This prevents players from joining via /join page after the draft has started.
-- Admin can still add players manually when game is in setup.

-- Drop the permissive insert policy first
DROP POLICY IF EXISTS "Allow all on players" ON players;

-- Re-create as separate SELECT/UPDATE/DELETE policies (remain open)
CREATE POLICY "Allow select on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow update on players" ON players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete on players" ON players FOR DELETE USING (true);

-- INSERT only allowed when the game is in setup status
CREATE POLICY "Allow insert on players in setup" ON players
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_id
      AND games.status = 'setup'
    )
  );
