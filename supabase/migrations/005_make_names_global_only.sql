-- Make Staff Name Pool and Customer Images global only
-- These are the same across all industries, so no need for industry-specific overrides

-- Note: We keep the columns in industry_simulation_config for backward compatibility
-- but they won't be used anymore. Can drop them later if needed:
-- ALTER TABLE industry_simulation_config DROP COLUMN IF EXISTS customer_images;
-- ALTER TABLE industry_simulation_config DROP COLUMN IF EXISTS staff_name_pool;

-- For now, just document that these are global-only going forward


