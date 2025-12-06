-- Phase 0 Cleanup: Drop old simulation config tables
-- This migration removes the deprecated global_simulation_config and industry_simulation_config tables
-- after verifying all data has been migrated to the unified simulation_config table.
--
-- IMPORTANT: Only run this migration after:
-- 1. Verifying all data has been successfully migrated to simulation_config table
-- 2. Confirming all code uses the unified simulationConfigRepository.ts
-- 3. Testing that the application works correctly with the unified table
--
-- To verify migration:
-- SELECT industry_id, COUNT(*) FROM simulation_config GROUP BY industry_id;
-- Should show 'global' and all industry IDs present

-- Step 1: Drop old industry_simulation_config table
DROP TABLE IF EXISTS industry_simulation_config CASCADE;

-- Step 2: Drop old global_simulation_config table
DROP TABLE IF EXISTS global_simulation_config CASCADE;

-- Note: CASCADE will automatically drop any dependent objects (indexes, triggers, etc.)
-- If you need to preserve any specific objects, modify this migration accordingly.

COMMENT ON TABLE simulation_config IS 'Unified simulation configuration table. Replaces global_simulation_config and industry_simulation_config. industry_id=''global'' contains defaults, other industry_ids contain overrides.';
