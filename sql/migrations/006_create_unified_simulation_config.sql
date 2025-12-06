-- Phase 0: Create Unified Simulation Config Table
-- Migrate from separate global/industry tables to single unified table
-- This eliminates massive duplication and simplifies config management

-- Step 1: Create the new unified table
CREATE TABLE IF NOT EXISTS simulation_config (
  industry_id TEXT PRIMARY KEY,  -- 'global' for defaults, industry ID for overrides

  -- Core business configuration (JSONB for flexibility)
  business_metrics JSONB,
  business_stats JSONB,

  -- Movement configuration (global only, but stored here for consistency)
  movement JSONB,

  -- Map configuration (separate columns for easier querying)
  map_width INTEGER,
  map_height INTEGER,
  map_walls JSONB,  -- Array of {x, y} positions

  -- Layout configuration (industry-specific)
  entry_position JSONB,        -- GridPosition
  waiting_positions JSONB,     -- Array of GridPosition
  service_rooms JSONB,         -- Array of ServiceRoomConfig
  staff_positions JSONB,       -- Array of GridPosition
  main_character_position JSONB, -- GridPosition
  main_character_sprite_image TEXT,

  -- Game conditions
  win_condition JSONB,
  lose_condition JSONB,

  -- Event configuration (industry-specific)
  event_selection_mode TEXT CHECK (event_selection_mode IN ('random', 'sequence')),
  event_sequence TEXT[],  -- Array of event IDs

  -- UI/Media configuration
  capacity_image TEXT,
  customer_images TEXT[],  -- Array of image paths (keep as array type)
  staff_name_pool TEXT[],  -- Array of staff names (keep as array type)
  lead_dialogues TEXT[],   -- Array of dialogue strings (keep as array type)

  -- UI timing configuration
  ui_config JSONB,  -- {eventAutoSelectDurationSeconds, outcomePopupDurationSeconds}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Migrate global config data
INSERT INTO simulation_config (
  industry_id,
  business_metrics,
  business_stats,
  movement,
  map_width,
  map_height,
  map_walls,
  win_condition,
  lose_condition,
  capacity_image,
  customer_images,
  staff_name_pool,
  lead_dialogues,
  ui_config
)
SELECT
  'global'::TEXT as industry_id,
  business_metrics,
  business_stats,
  movement,
  map_width,
  map_height,
  map_walls,
  win_condition,
  lose_condition,
  capacity_image,
  customer_images,
  staff_name_pool,
  lead_dialogues,
  ui_config
FROM global_simulation_config
ON CONFLICT (industry_id) DO UPDATE SET
  business_metrics = EXCLUDED.business_metrics,
  business_stats = EXCLUDED.business_stats,
  movement = EXCLUDED.movement,
  map_width = EXCLUDED.map_width,
  map_height = EXCLUDED.map_height,
  map_walls = EXCLUDED.map_walls,
  win_condition = EXCLUDED.win_condition,
  lose_condition = EXCLUDED.lose_condition,
  capacity_image = EXCLUDED.capacity_image,
  customer_images = EXCLUDED.customer_images,
  staff_name_pool = EXCLUDED.staff_name_pool,
  lead_dialogues = EXCLUDED.lead_dialogues,
  ui_config = EXCLUDED.ui_config,
  updated_at = NOW();

-- Step 3: Migrate industry-specific config data
INSERT INTO simulation_config (
  industry_id,
  business_metrics,
  business_stats,
  map_width,
  map_height,
  map_walls,
  entry_position,
  waiting_positions,
  service_rooms,
  staff_positions,
  main_character_position,
  main_character_sprite_image,
  win_condition,
  lose_condition,
  event_selection_mode,
  event_sequence,
  capacity_image,
  lead_dialogues
)
SELECT
  industry_id,
  business_metrics,
  business_stats,
  map_width,
  map_height,
  map_walls,
  entry_position,
  waiting_positions,
  service_rooms,
  staff_positions,
  main_character_position,
  main_character_sprite_image,
  win_condition,
  lose_condition,
  event_selection_mode,
  event_sequence,
  capacity_image,
  lead_dialogues
FROM industry_simulation_config
ON CONFLICT (industry_id) DO UPDATE SET
  business_metrics = EXCLUDED.business_metrics,
  business_stats = EXCLUDED.business_stats,
  map_width = EXCLUDED.map_width,
  map_height = EXCLUDED.map_height,
  map_walls = EXCLUDED.map_walls,
  entry_position = EXCLUDED.entry_position,
  waiting_positions = EXCLUDED.waiting_positions,
  service_rooms = EXCLUDED.service_rooms,
  staff_positions = EXCLUDED.staff_positions,
  main_character_position = EXCLUDED.main_character_position,
  main_character_sprite_image = EXCLUDED.main_character_sprite_image,
  win_condition = EXCLUDED.win_condition,
  lose_condition = EXCLUDED.lose_condition,
  event_selection_mode = EXCLUDED.event_selection_mode,
  event_sequence = EXCLUDED.event_sequence,
  capacity_image = EXCLUDED.capacity_image,
  lead_dialogues = EXCLUDED.lead_dialogues,
  updated_at = NOW();

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulation_config_industry_id ON simulation_config(industry_id);
CREATE INDEX IF NOT EXISTS idx_simulation_config_business_metrics ON simulation_config USING GIN(business_metrics);
CREATE INDEX IF NOT EXISTS idx_simulation_config_business_stats ON simulation_config USING GIN(business_stats);

-- Step 5: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulation_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_simulation_config_updated_at ON simulation_config;
CREATE TRIGGER trigger_simulation_config_updated_at
  BEFORE UPDATE ON simulation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_config_updated_at();

-- Verification: Check that data was migrated correctly
-- SELECT industry_id, COUNT(*) FROM simulation_config GROUP BY industry_id;

-- Debug: Check layout data migration
-- SELECT industry_id, entry_position, waiting_positions, service_rooms, staff_positions
-- FROM simulation_config
-- WHERE industry_id IN ('freelance', 'dental');

COMMENT ON TABLE simulation_config IS 'Unified simulation configuration table. industry_id=''global'' contains defaults, other industry_ids contain overrides.';
COMMENT ON COLUMN simulation_config.industry_id IS 'Industry ID (''global'' for defaults, specific industry ID for overrides)';;