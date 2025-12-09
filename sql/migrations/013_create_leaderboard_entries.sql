-- Migration: Create leaderboard_entries table
-- Purpose: Store game results for leaderboard display per industry
-- Date: 2025

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  industry_id TEXT NOT NULL,
  username TEXT NOT NULL,
  cash NUMERIC NOT NULL,
  leveraged_time NUMERIC,
  game_over_reason TEXT,
  current_month INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_industry_cash ON leaderboard_entries(industry_id, cash DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_industry_created ON leaderboard_entries(industry_id, created_at DESC);

-- Comments
COMMENT ON TABLE leaderboard_entries IS 'Stores game results for leaderboard display, organized by industry';
COMMENT ON COLUMN leaderboard_entries.industry_id IS 'Industry identifier (references industries.id)';
COMMENT ON COLUMN leaderboard_entries.username IS 'Player username';
COMMENT ON COLUMN leaderboard_entries.cash IS 'Final cash amount when game ended';
COMMENT ON COLUMN leaderboard_entries.leveraged_time IS 'Final leveraged time capacity (efficiency metric - lower = more efficient team size)';
COMMENT ON COLUMN leaderboard_entries.game_over_reason IS 'Reason game ended: victory, cash, time, or null';
COMMENT ON COLUMN leaderboard_entries.current_month IS 'Month when game ended';
