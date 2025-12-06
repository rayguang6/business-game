-- Phase 1: Create Metric Display Config Table
-- Stores display configuration for metrics (labels, visibility, priority, icons)
-- Core metric definitions stay in code, display config can be customized per industry

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS metric_display_config (
  id TEXT PRIMARY KEY,  -- Composite: {industry_id}_{metric_id}
  industry_id TEXT NOT NULL,  -- 'global' for global defaults, industry ID for industry-specific overrides
  metric_id TEXT NOT NULL,  -- References GameMetric enum value (e.g., 'cash', 'exp', 'freedomScore')
  
  -- Presentation
  display_label TEXT NOT NULL,  -- What to show in UI (e.g., "Leveraged Time" for FreedomScore)
  description TEXT,              -- Description of what this metric does
  unit TEXT,                     -- Unit label (e.g., 'h', 'x', '%', 'sec')
  icon_path TEXT,                -- Path to icon image (optional, for future use)
  
  -- Visibility flags
  show_on_hud BOOLEAN DEFAULT false,      -- Show on HUD (Phase 2: configurable per industry)
  show_in_details BOOLEAN DEFAULT false,  -- Show in details panel
  show_in_admin BOOLEAN DEFAULT true,     -- Show in admin UI
  
  -- Ordering
  hud_priority INTEGER,          -- Display order on HUD (lower = shown first)
  details_priority INTEGER,      -- Display order in details panel (lower = shown first)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_industry_metric UNIQUE (industry_id, metric_id),
  CONSTRAINT valid_metric_id CHECK (metric_id IN (
    'cash', 'time', 'monthlyTimeCapacity', 'spawnIntervalSeconds', 'serviceSpeedMultiplier',
    'serviceCapacity', 'exp', 'monthlyExpenses', 'serviceRevenueMultiplier',
    'serviceRevenueFlatBonus', 'freedomScore', 'failureRate', 'conversionRate',
    'generateLeads', 'highTierServiceRevenueMultiplier', 'highTierServiceWeightageMultiplier',
    'midTierServiceRevenueMultiplier', 'midTierServiceWeightageMultiplier',
    'lowTierServiceRevenueMultiplier', 'lowTierServiceWeightageMultiplier'
  ))
);

-- Step 2: Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_metric_display_industry_metric 
  ON metric_display_config(industry_id, metric_id);

CREATE INDEX IF NOT EXISTS idx_metric_display_metric 
  ON metric_display_config(metric_id);

-- Step 3: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_metric_display_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-update updated_at
CREATE TRIGGER update_metric_display_config_timestamp
  BEFORE UPDATE ON metric_display_config
  FOR EACH ROW
  EXECUTE FUNCTION update_metric_display_config_updated_at();

-- Note: Data will be seeded via TypeScript script (see lib/data/seedMetricDisplayConfig.ts)
