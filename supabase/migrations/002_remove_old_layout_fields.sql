-- Remove old layout fields from industries table
-- These have been moved to industry_simulation_config.layout_config

ALTER TABLE industries
  DROP COLUMN IF EXISTS staff_positions,
  DROP COLUMN IF EXISTS service_room_positions,
  DROP COLUMN IF EXISTS bed_image;

