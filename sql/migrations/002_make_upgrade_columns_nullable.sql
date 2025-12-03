-- Migration: Make cost, time_cost, and effects nullable in upgrades table
-- This allows upgrades to use only the upgrade_levels table for level-specific data
-- After migration, these columns can be removed entirely

-- Make columns nullable
ALTER TABLE upgrades ALTER COLUMN cost DROP NOT NULL;
ALTER TABLE upgrades ALTER COLUMN time_cost DROP NOT NULL;
ALTER TABLE upgrades ALTER COLUMN effects DROP NOT NULL;

-- Set default values to NULL for existing rows (they'll use upgrade_levels table)
-- Note: You should run a migration script to convert existing upgrades to use upgrade_levels first

COMMENT ON COLUMN upgrades.cost IS 'Deprecated: Use upgrade_levels.cost instead. Will be removed in future migration.';
COMMENT ON COLUMN upgrades.time_cost IS 'Deprecated: Use upgrade_levels.time_cost instead. Will be removed in future migration.';
COMMENT ON COLUMN upgrades.effects IS 'Deprecated: Use upgrade_levels.effects instead. Will be removed in future migration.';


