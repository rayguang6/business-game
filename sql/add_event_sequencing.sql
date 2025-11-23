-- Add event sequencing columns to industry_simulation_config table
-- This allows industries to have either random or sequential event selection

ALTER TABLE industry_simulation_config
ADD COLUMN IF NOT EXISTS event_selection_mode VARCHAR(20) DEFAULT 'random' CHECK (event_selection_mode IN ('random', 'sequence'));

ALTER TABLE industry_simulation_config
ADD COLUMN IF NOT EXISTS event_sequence TEXT[] DEFAULT '{}';

-- Add comment explaining the columns
COMMENT ON COLUMN industry_simulation_config.event_selection_mode IS 'Controls how events are selected: random (default) or sequence';
COMMENT ON COLUMN industry_simulation_config.event_sequence IS 'Array of event IDs in the order they should be triggered when using sequence mode';
