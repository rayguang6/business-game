# Database Migration Guide: Separate Columns Structure

## Overview

We've refactored the database structure to use separate columns instead of JSONB for map and layout configuration. This improves queryability, type safety, and maintainability.

## What Changed

### Before (Old Structure)
- `map_config` JSONB column containing `{width, height, walls}`
- `layout_config` JSONB column containing `{entryPosition, waitingPositions, serviceRooms, staffPositions}`

### After (New Structure)
- `map_width` INTEGER
- `map_height` INTEGER  
- `map_walls` JSONB (array of `{x, y}` objects)
- `entry_position` JSONB (single `{x, y}` object)
- `waiting_positions` JSONB (array of `{x, y}` objects)
- `service_rooms` JSONB (array of `{roomId, customerPosition, staffPosition}` objects)
- `staff_positions` JSONB (array of `{x, y}` objects)

## Migration Steps

### 1. Run the Migration Script

Execute the migration script in your Supabase SQL editor or via psql:

```bash
psql -h your-db-host -U your-user -d your-database -f sql/migrate_to_separate_columns.sql
```

Or copy/paste the contents of `sql/migrate_to_separate_columns.sql` into your Supabase SQL editor.

### 2. Verify Migration

Check that columns were created and data was migrated:

```sql
-- Check industry_simulation_config columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'industry_simulation_config' 
  AND column_name IN ('map_width', 'map_height', 'map_walls', 'entry_position', 'waiting_positions', 'service_rooms', 'staff_positions')
ORDER BY column_name;

-- Check global_simulation_config columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'global_simulation_config' 
  AND column_name IN ('map_width', 'map_height', 'map_walls', 'entry_position', 'waiting_positions', 'service_rooms', 'staff_positions')
ORDER BY column_name;

-- Verify data was migrated (should show rows with data in new columns)
SELECT industry_id, map_width, map_height, entry_position, service_rooms 
FROM industry_simulation_config 
WHERE map_width IS NOT NULL OR entry_position IS NOT NULL;
```

### 3. Test the Admin UI

1. **Open Admin Panel**: Navigate to `/admin` in your app
2. **Select an Industry**: Choose any industry from the dropdown
3. **Check Industry Simulation Config Tab**: 
   - Verify map width/height fields load correctly
   - Verify layout positions (entry, waiting, service rooms, staff) load correctly
   - Try editing and saving - should work without errors
4. **Check Global Config Tab**:
   - Verify global config loads correctly
   - If you have map/layout config in global, verify it loads

### 4. Test the Game

1. **Start a Game**: Select an industry and start playing
2. **Verify Layout**: Check that customer entry, waiting positions, service rooms, and staff positions appear correctly
3. **Verify Map**: Check that map dimensions and walls are correct

### 5. (Optional) Clean Up Old Columns

**⚠️ Only do this after verifying everything works!**

Once you're confident everything is working, you can drop the old JSONB columns:

```sql
-- Drop old columns from industry_simulation_config
ALTER TABLE industry_simulation_config 
  DROP COLUMN IF EXISTS map_config,
  DROP COLUMN IF EXISTS layout_config;

-- Drop old columns from global_simulation_config  
ALTER TABLE global_simulation_config 
  DROP COLUMN IF EXISTS map_config,
  DROP COLUMN IF EXISTS layout_config;
```

## Rollback Plan

If you need to rollback, the old columns (`map_config` and `layout_config`) are still present. You would need to:

1. Revert the code changes (git revert)
2. Migrate data back from separate columns to JSONB columns (manual SQL)
3. The migration script doesn't drop old columns, so they're still available

## Troubleshooting

### Issue: Columns don't exist after migration
**Solution**: Check that the migration script ran successfully. Look for any errors in the Supabase logs.

### Issue: Data didn't migrate
**Solution**: The migration only migrates if the new columns are NULL. If you already have data in new columns, it won't overwrite. Check if `map_config`/`layout_config` columns exist and have data.

### Issue: Admin UI shows errors
**Solution**: 
1. Check browser console for errors
2. Verify the columns exist in the database
3. Check that the code is using the latest version (no fallback logic)

### Issue: Game doesn't load layout correctly
**Solution**:
1. Check that `service_rooms` column exists and has data
2. Verify the data format matches `ServiceRoomConfig` type
3. Check browser console for parsing errors

## Code Changes Summary

The following files were updated to use the new structure:

- `lib/data/industrySimulationConfigRepository.ts` - Removed fallback logic, uses separate columns
- `lib/data/simulationConfigRepository.ts` - Removed fallback logic, uses separate columns  
- `lib/data/layoutRepository.ts` - Removed fallback logic, uses separate columns
- Admin UI already uses separate columns (no changes needed)

## Benefits

✅ **Consistency**: Single source of truth - no duplicate columns  
✅ **Type Safety**: Direct column access instead of JSON parsing  
✅ **Queryability**: Can query/filter by specific fields  
✅ **Maintainability**: Cleaner code without complex fallback logic  
✅ **Performance**: Slightly better (no JSON parsing on read)

