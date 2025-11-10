-- Improve config structure for better consistency and simplicity
-- 1. Remove movement from industry config (it's global only)
-- 2. Split map_config into separate columns (map_width, map_height, map_walls)
-- 3. Keep layout_config columns we already split

-- ============================================================================
-- STEP 1: Split map_config into separate columns
-- ============================================================================

-- Add new columns for map config
ALTER TABLE industry_simulation_config
  ADD COLUMN IF NOT EXISTS map_width INTEGER,
  ADD COLUMN IF NOT EXISTS map_height INTEGER,
  ADD COLUMN IF NOT EXISTS map_walls JSONB;

ALTER TABLE global_simulation_config
  ADD COLUMN IF NOT EXISTS map_width INTEGER,
  ADD COLUMN IF NOT EXISTS map_height INTEGER,
  ADD COLUMN IF NOT EXISTS map_walls JSONB;

-- Migrate existing map_config data to new columns
UPDATE industry_simulation_config
SET
  map_width = (map_config->>'width')::INTEGER,
  map_height = (map_config->>'height')::INTEGER,
  map_walls = (map_config->'walls')::jsonb
WHERE map_config IS NOT NULL
  AND map_config ? 'width';

UPDATE global_simulation_config
SET
  map_width = (map_config->>'width')::INTEGER,
  map_height = (map_config->>'height')::INTEGER,
  map_walls = (map_config->'walls')::jsonb
WHERE map_config IS NOT NULL
  AND map_config ? 'width';

-- ============================================================================
-- STEP 2: Remove movement column from industry_simulation_config
-- (Movement is global only - same across all industries)
-- ============================================================================

-- Note: We keep the movement column for now but won't use it
-- Can drop it later: ALTER TABLE industry_simulation_config DROP COLUMN IF EXISTS movement;

-- ============================================================================
-- STEP 3: Add entry_position, waiting_positions, etc. if not already added
-- (In case migration 003 wasn't run)
-- ============================================================================

ALTER TABLE industry_simulation_config
  ADD COLUMN IF NOT EXISTS entry_position JSONB,
  ADD COLUMN IF NOT EXISTS waiting_positions JSONB,
  ADD COLUMN IF NOT EXISTS service_room_positions JSONB,
  ADD COLUMN IF NOT EXISTS staff_positions JSONB;

ALTER TABLE global_simulation_config
  ADD COLUMN IF NOT EXISTS entry_position JSONB,
  ADD COLUMN IF NOT EXISTS waiting_positions JSONB,
  ADD COLUMN IF NOT EXISTS service_room_positions JSONB,
  ADD COLUMN IF NOT EXISTS staff_positions JSONB;

