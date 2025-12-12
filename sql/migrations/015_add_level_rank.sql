-- Migration: Add rank column to level_rewards table
-- Purpose: Store level rank names for grouping levels (e.g., "Novice", "Rising Freelancer")
-- Date: 2025

ALTER TABLE level_rewards ADD COLUMN IF NOT EXISTS rank TEXT;

-- Update comment for rank column
COMMENT ON COLUMN level_rewards.rank IS 'Level rank name (e.g., "Novice", "Rising Freelancer"). Multiple levels can share the same rank.';

-- Create index for rank queries
CREATE INDEX IF NOT EXISTS idx_level_rewards_rank ON level_rewards(rank);

-- Add default ranks for existing levels (this will be updated via admin interface)
-- Note: This is just for migration purposes; actual rank values should be set via admin UI