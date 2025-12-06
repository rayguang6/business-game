-- Simplify Metric Display Config Table
-- Remove unnecessary columns: show_in_admin, hud_priority, details_priority
-- Keep only: id, industry_id, metric_id, display_label, description, unit, icon_path, show_on_hud, show_in_details, priority

-- Step 1: Drop columns we don't need
ALTER TABLE metric_display_config
  DROP COLUMN IF EXISTS show_in_admin,
  DROP COLUMN IF EXISTS hud_priority,
  DROP COLUMN IF EXISTS details_priority;

-- Step 2: Add single priority column if it doesn't exist
-- (We'll migrate hud_priority values to priority if they exist)
DO $$
BEGIN
  -- Check if priority column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metric_display_config' AND column_name = 'priority'
  ) THEN
    ALTER TABLE metric_display_config ADD COLUMN priority INTEGER;
  END IF;
END $$;

-- Step 3: Migrate any existing hud_priority values to priority (if they exist)
-- This handles the case where the table was already created with hud_priority
-- Note: This will only work if hud_priority still exists, otherwise it's a no-op
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metric_display_config' AND column_name = 'hud_priority'
  ) THEN
    UPDATE metric_display_config 
    SET priority = hud_priority 
    WHERE priority IS NULL AND hud_priority IS NOT NULL;
  END IF;
END $$;

-- Step 4: Update constraint to remove show_in_admin from valid columns
-- (The constraint check is on metric_id, so no change needed there)

-- Note: created_at and updated_at are kept for tracking purposes
