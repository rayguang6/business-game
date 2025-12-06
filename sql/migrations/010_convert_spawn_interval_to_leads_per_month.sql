-- Migration: Convert spawnIntervalSeconds to leadsPerMonth
-- Formula: leadsPerMonth = monthDurationSeconds / spawnIntervalSeconds
-- This changes the stored metric from "time between spawns" to "leads per month"

-- Step 1: Add leadsPerMonth to business_stats JSONB for all rows
UPDATE simulation_config
SET business_stats = jsonb_set(
  business_stats,
  '{leadsPerMonth}',
  to_jsonb(
    CASE 
      WHEN (business_stats->>'monthDurationSeconds')::numeric > 0 
       AND (business_stats->>'customerSpawnIntervalSeconds')::numeric > 0
      THEN FLOOR(
        (business_stats->>'monthDurationSeconds')::numeric / 
        (business_stats->>'customerSpawnIntervalSeconds')::numeric
      )
      ELSE 20  -- default fallback (assuming 60s month / 3s interval = 20 leads/month)
    END
  )
)
WHERE business_stats ? 'customerSpawnIntervalSeconds'
  AND (business_stats->>'leadsPerMonth') IS NULL;

-- Step 2: Remove customerSpawnIntervalSeconds from business_stats
UPDATE simulation_config
SET business_stats = business_stats - 'customerSpawnIntervalSeconds'
WHERE business_stats ? 'customerSpawnIntervalSeconds';

-- Verification query (run manually to check):
-- SELECT 
--   industry_id,
--   business_stats->>'leadsPerMonth' as leads_per_month,
--   business_stats->>'monthDurationSeconds' as month_duration_seconds,
--   business_stats ? 'customerSpawnIntervalSeconds' as has_old_field
-- FROM simulation_config
-- ORDER BY industry_id;
