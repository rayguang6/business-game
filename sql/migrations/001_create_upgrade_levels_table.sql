-- Migration: Create upgrade_levels table for level-specific upgrade configurations
-- This allows each upgrade level to have different names, costs, descriptions, icons, and effects
-- Phase 1: Add new table (backward compatible - existing upgrades still work)

CREATE TABLE IF NOT EXISTS upgrade_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_id VARCHAR NOT NULL,
  industry_id VARCHAR NOT NULL,
  level INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  cost NUMERIC NOT NULL,
  time_cost NUMERIC,
  effects JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (upgrade_id, industry_id) REFERENCES upgrades(id, industry_id) ON DELETE CASCADE,
  UNIQUE(upgrade_id, industry_id, level)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_upgrade_levels_upgrade ON upgrade_levels(upgrade_id, industry_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_levels_level ON upgrade_levels(level);

-- Comment for documentation
COMMENT ON TABLE upgrade_levels IS 'Stores level-specific configurations for upgrades. Each upgrade can have multiple levels with different names, costs, descriptions, icons, and effects.';
COMMENT ON COLUMN upgrade_levels.level IS 'The level number (1, 2, 3, etc.)';
COMMENT ON COLUMN upgrade_levels.name IS 'Level-specific name (e.g., "Introduction", "Mastery of Tools")';
COMMENT ON COLUMN upgrade_levels.effects IS 'JSONB array of UpgradeEffect objects for this specific level';


