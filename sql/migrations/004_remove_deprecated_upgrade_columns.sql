-- Migration: Remove deprecated columns from upgrades table
-- These columns have been migrated to upgrade_levels table and are no longer used
-- Migration 002 made them nullable, Migration 003 migrated the data, now we remove them

-- Drop the deprecated columns
ALTER TABLE upgrades DROP COLUMN IF EXISTS cost;
ALTER TABLE upgrades DROP COLUMN IF EXISTS time_cost;
ALTER TABLE upgrades DROP COLUMN IF EXISTS effects;

-- Verify the table structure (for reference)
-- The upgrades table should now only have:
-- id, industry_id, name, description, icon, max_level, sets_flag, requirements

COMMENT ON TABLE upgrades IS 'Base upgrade definitions. Level-specific data (cost, time_cost, effects) is stored in upgrade_levels table.';

