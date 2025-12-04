-- Add UI configuration to global simulation config
-- Adds configurable durations for event auto-selection and outcome popup display

ALTER TABLE global_simulation_config
ADD COLUMN IF NOT EXISTS ui_config JSONB;

-- Set default values for existing records
UPDATE global_simulation_config
SET ui_config = '{
  "event_auto_select_duration_seconds": 10,
  "outcome_popup_duration_seconds": 5
}'::jsonb
WHERE ui_config IS NULL;