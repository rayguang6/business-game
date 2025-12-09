-- Migration: Create level_rewards table
-- Purpose: Store level-up rewards per industry (rewards start at Level 2, Level 1 is starting level)
-- Date: 2025

CREATE TABLE IF NOT EXISTS level_rewards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  industry_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  title TEXT NOT NULL,
  narrative TEXT,
  effects JSONB NOT NULL DEFAULT '[]',
  unlocks_flags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one reward per level per industry
CREATE UNIQUE INDEX IF NOT EXISTS idx_level_rewards_industry_level ON level_rewards(industry_id, level);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_level_rewards_industry ON level_rewards(industry_id);
CREATE INDEX IF NOT EXISTS idx_level_rewards_level ON level_rewards(level);

-- Comments
COMMENT ON TABLE level_rewards IS 'Stores level-up rewards per industry. Rewards start at Level 2 (Level 1 is starting level).';
COMMENT ON COLUMN level_rewards.industry_id IS 'Industry identifier (references industries.id)';
COMMENT ON COLUMN level_rewards.level IS 'Level number (2, 3, 4, ...). Level 1 is starting level with no reward.';
COMMENT ON COLUMN level_rewards.title IS 'Level title (e.g., "Early Skill Builder", "Solid Beginner")';
COMMENT ON COLUMN level_rewards.narrative IS 'Narrative description shown to player';
COMMENT ON COLUMN level_rewards.effects IS 'Array of effect objects (same format as upgrade_levels.effects)';
COMMENT ON COLUMN level_rewards.unlocks_flags IS 'Array of flag IDs to set when this level is reached (e.g., ["unlock_medium_jobs"])';
