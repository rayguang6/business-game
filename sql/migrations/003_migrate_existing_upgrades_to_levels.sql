-- Migration: Convert existing upgrades to use upgrade_levels table
-- This script migrates existing upgrades that have cost/time_cost/effects in the upgrades table
-- to the new upgrade_levels table structure

-- Step 1: Create level 1 entries for all existing upgrades that don't have levels yet
INSERT INTO upgrade_levels (upgrade_id, industry_id, level, name, description, icon, cost, time_cost, effects)
SELECT 
  u.id as upgrade_id,
  u.industry_id,
  1 as level,
  u.name as name,
  u.description as description,
  u.icon as icon,
  COALESCE(u.cost, 0) as cost,
  u.time_cost as time_cost,
  COALESCE(u.effects, '[]'::jsonb) as effects
FROM upgrades u
WHERE NOT EXISTS (
  -- Only insert if this upgrade doesn't already have levels
  SELECT 1 FROM upgrade_levels ul 
  WHERE ul.upgrade_id = u.id AND ul.industry_id = u.industry_id
)
AND u.cost IS NOT NULL; -- Only migrate upgrades that have cost set (legacy format)

-- Step 2: For upgrades with max_level > 1, create placeholder levels
-- (These can be edited later in the admin interface)
DO $$
DECLARE
  upgrade_record RECORD;
  level_num INTEGER;
BEGIN
  FOR upgrade_record IN 
    SELECT id, industry_id, max_level, name, cost, time_cost, effects
    FROM upgrades
    WHERE max_level > 1
    AND EXISTS (SELECT 1 FROM upgrade_levels ul WHERE ul.upgrade_id = upgrades.id AND ul.industry_id = upgrades.industry_id AND ul.level = 1)
  LOOP
    -- Create levels 2 through max_level by duplicating level 1
    FOR level_num IN 2..upgrade_record.max_level LOOP
      INSERT INTO upgrade_levels (upgrade_id, industry_id, level, name, description, icon, cost, time_cost, effects)
      SELECT 
        upgrade_record.id,
        upgrade_record.industry_id,
        level_num,
        upgrade_record.name || ' Level ' || level_num,
        NULL as description,
        NULL as icon,
        -- Cost increases by level (you can adjust this formula)
        (SELECT cost FROM upgrade_levels WHERE upgrade_id = upgrade_record.id AND industry_id = upgrade_record.industry_id AND level = 1) * level_num,
        (SELECT time_cost FROM upgrade_levels WHERE upgrade_id = upgrade_record.id AND industry_id = upgrade_record.industry_id AND level = 1),
        -- Effects are duplicated (you may want to adjust this)
        (SELECT effects FROM upgrade_levels WHERE upgrade_id = upgrade_record.id AND industry_id = upgrade_record.industry_id AND level = 1)
      WHERE NOT EXISTS (
        SELECT 1 FROM upgrade_levels ul 
        WHERE ul.upgrade_id = upgrade_record.id 
        AND ul.industry_id = upgrade_record.industry_id 
        AND ul.level = level_num
      );
    END LOOP;
  END LOOP;
END $$;

-- Step 3: Verify migration
-- Check how many upgrades now have levels
SELECT 
  COUNT(DISTINCT u.id) as total_upgrades,
  COUNT(DISTINCT ul.upgrade_id) as upgrades_with_levels,
  COUNT(ul.id) as total_levels
FROM upgrades u
LEFT JOIN upgrade_levels ul ON u.id = ul.upgrade_id AND u.industry_id = ul.industry_id;


