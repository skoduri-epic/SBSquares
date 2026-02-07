-- Add live score auto-update fields to games table

-- Toggle for automatic ESPN score fetching (default off)
ALTER TABLE games ADD COLUMN auto_scores_enabled BOOLEAN DEFAULT false;

-- ESPN event ID to identify which NFL game to track
-- Format: ESPN's event ID string (e.g., "401547417")
ALTER TABLE games ADD COLUMN espn_event_id TEXT DEFAULT NULL;
