-- ============================================
-- COMPLETE SQL MIGRATION SCRIPT
-- Reputation → Skill Level + Cleanup Unused Fields
-- 
-- This script rewrites ALL database values:
-- 1. Reputation → Skill Level
-- 2. founderWorkHours → startingFreedomScore
-- 3. Removes baseHappyProbability (not used in game mechanics)
-- 
-- Run this ONCE after all code changes are complete
-- ============================================

BEGIN;

-- ============================================
-- 1. GLOBAL SIMULATION CONFIG
-- ============================================

-- Update business_metrics: startingReputation → startingSkillLevel, founderWorkHours → startingFreedomScore
UPDATE global_simulation_config
SET business_metrics = jsonb_set(
  jsonb_set(
    business_metrics,
    '{startingSkillLevel}',
    COALESCE(business_metrics->'startingSkillLevel', business_metrics->'startingReputation')
  ),
  '{startingFreedomScore}',
  COALESCE(business_metrics->'startingFreedomScore', business_metrics->'founderWorkHours')
) - 'startingReputation' - 'founderWorkHours'
WHERE business_metrics ? 'startingReputation' OR business_metrics ? 'founderWorkHours';

-- Update business_stats: reputationGain/Loss → skillLevelGain/Loss, remove baseHappyProbability
UPDATE global_simulation_config
SET business_stats = jsonb_set(
  jsonb_set(
    business_stats,
    '{skillLevelGainPerHappyCustomer}',
    COALESCE(business_stats->'skillLevelGainPerHappyCustomer', business_stats->'reputationGainPerHappyCustomer')
  ),
  '{skillLevelLossPerAngryCustomer}',
  COALESCE(business_stats->'skillLevelLossPerAngryCustomer', business_stats->'reputationLossPerAngryCustomer')
) - 'reputationGainPerHappyCustomer' - 'reputationLossPerAngryCustomer' - 'baseHappyProbability'
WHERE business_stats ? 'reputationGainPerHappyCustomer' OR business_stats ? 'baseHappyProbability';

-- ============================================
-- 2. INDUSTRY SIMULATION CONFIG
-- ============================================

-- Update business_metrics: startingReputation → startingSkillLevel, founderWorkHours → startingFreedomScore
UPDATE industry_simulation_config
SET business_metrics = jsonb_set(
  jsonb_set(
    business_metrics,
    '{startingSkillLevel}',
    COALESCE(business_metrics->'startingSkillLevel', business_metrics->'startingReputation')
  ),
  '{startingFreedomScore}',
  COALESCE(business_metrics->'startingFreedomScore', business_metrics->'founderWorkHours')
) - 'startingReputation' - 'founderWorkHours'
WHERE business_metrics ? 'startingReputation' OR business_metrics ? 'founderWorkHours';

-- Update business_stats: reputationGain/Loss → skillLevelGain/Loss, remove baseHappyProbability
UPDATE industry_simulation_config
SET business_stats = jsonb_set(
  jsonb_set(
    business_stats,
    '{skillLevelGainPerHappyCustomer}',
    COALESCE(business_stats->'skillLevelGainPerHappyCustomer', business_stats->'reputationGainPerHappyCustomer')
  ),
  '{skillLevelLossPerAngryCustomer}',
  COALESCE(business_stats->'skillLevelLossPerAngryCustomer', business_stats->'reputationLossPerAngryCustomer')
) - 'reputationGainPerHappyCustomer' - 'reputationLossPerAngryCustomer' - 'baseHappyProbability'
WHERE business_stats ? 'reputationGainPerHappyCustomer' OR business_stats ? 'baseHappyProbability';

-- ============================================
-- 3. EVENTS TABLE - Update all event effects
-- ============================================

-- Function to recursively update event effects from 'reputation' to 'skillLevel'
CREATE OR REPLACE FUNCTION update_event_effects_recursive(input_jsonb JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  element JSONB;
  key TEXT;
BEGIN
  -- If it's an array, process each element
  IF jsonb_typeof(input_jsonb) = 'array' THEN
    result := '[]'::JSONB;
    FOR element IN SELECT * FROM jsonb_array_elements(input_jsonb) LOOP
      result := result || jsonb_build_array(update_event_effects_recursive(element));
    END LOOP;
    RETURN result;
  END IF;
  
  -- If it's an object, check for 'type' field and update if needed
  IF jsonb_typeof(input_jsonb) = 'object' THEN
    -- If this is an effect object with type 'reputation', change it to 'skillLevel'
    IF input_jsonb ? 'type' AND input_jsonb->>'type' = 'reputation' THEN
      result := jsonb_set(input_jsonb, '{type}', '"skillLevel"');
    ELSE
      -- Otherwise, recursively process all key-value pairs
      result := '{}'::JSONB;
      FOR key, element IN SELECT * FROM jsonb_each(input_jsonb) LOOP
        result := result || jsonb_build_object(key, update_event_effects_recursive(element));
      END LOOP;
    END IF;
    RETURN result;
  END IF;
  
  -- For primitives (string, number, boolean, null), return as-is
  RETURN input_jsonb;
END;
$$ LANGUAGE plpgsql;

-- Update all events using the recursive function
-- Only updates events that actually have 'reputation' effects (for efficiency)
UPDATE events
SET choices = update_event_effects_recursive(choices)
WHERE choices::text LIKE '%"type":"reputation"%';

-- Drop the temporary function
DROP FUNCTION update_event_effects_recursive(JSONB);

-- ============================================
-- VERIFICATION QUERIES (Run these AFTER COMMIT to verify)
-- ============================================

COMMIT;

-- After committing, run these to verify migration:

-- 1. Check global config (should show startingSkillLevel, not startingReputation)
-- SELECT business_metrics->>'startingSkillLevel' as skill_level, 
--        business_stats->>'skillLevelGainPerHappyCustomer' as gain_per_happy
-- FROM global_simulation_config;

-- 2. Check industry configs (should show skillLevel fields)
-- SELECT industry_id, 
--        business_metrics->>'startingSkillLevel' as skill_level,
--        business_stats->>'skillLevelGainPerHappyCustomer' as gain_per_happy
-- FROM industry_simulation_config 
-- LIMIT 5;

-- 3. Check events (should show 'skillLevel', not 'reputation')
-- SELECT id, choices 
-- FROM events 
-- LIMIT 3;

-- 4. Count any remaining 'reputation' references (should be 0)
-- SELECT COUNT(*) as remaining_reputation_effects
-- FROM events
-- WHERE choices::text LIKE '%"type":"reputation"%';

-- 5. Verify no startingReputation fields remain
-- SELECT COUNT(*) as remaining_starting_reputation
-- FROM (
--   SELECT business_metrics FROM global_simulation_config
--   UNION ALL
--   SELECT business_metrics FROM industry_simulation_config
-- ) AS all_configs
-- WHERE business_metrics::text LIKE '%startingReputation%';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- After running this script:
-- 1. All 'startingReputation' → 'startingSkillLevel'
-- 2. All 'founderWorkHours' → 'startingFreedomScore'
-- 3. All 'reputationGainPerHappyCustomer' → 'skillLevelGainPerHappyCustomer'
-- 4. All 'reputationLossPerAngryCustomer' → 'skillLevelLossPerAngryCustomer'
-- 5. All 'baseHappyProbability' removed (not used in game mechanics)
-- 6. All event effects with type 'reputation' → 'skillLevel'
-- ============================================

