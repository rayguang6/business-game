# Current State & Next Steps

## ✅ What We've Completed

### 1. Layout Configuration Refactoring
- **Removed global layout config** - Layout is now industry-specific only
- Each industry must configure its own layout in `industry_simulation_config` table
- Global layout columns in `global_simulation_config` are deprecated (unused but kept for compatibility)

### 2. Fixed Store Initialization Bug
- `getBusinessMetrics()`, `getBusinessStats()`, and `getMovementConfigForIndustry()` now return safe defaults instead of throwing errors
- Store can initialize before config loads from database
- Config loads asynchronously and updates store when ready

### 3. Code Updates
- Removed layout fetching/saving from global config repository
- Updated layout resolution to only check industry config
- Fixed admin panel hooks and components
- Updated all documentation

## 📊 Current Database State

### `global_simulation_config` Table

**Active Columns:**
- ✅ `business_metrics` (JSONB) - Required defaults
- ✅ `business_stats` (JSONB) - Required defaults  
- ✅ `movement` (JSONB) - Required (global only)
- ✅ `map_width`, `map_height`, `map_walls` - Optional
- ✅ `capacity_image`, `win_condition`, `lose_condition` - Optional
- ✅ `customer_images`, `staff_name_pool` - Optional

**Unused Columns (Can Be Removed):**
- ⚠️ `entry_position` - Deprecated, not used
- ⚠️ `waiting_positions` - Deprecated, not used
- ⚠️ `service_rooms` - Deprecated, not used
- ⚠️ `staff_positions` - Deprecated, not used

### `industry_simulation_config` Table

**Required for Each Industry:**
- ✅ `entry_position` - Where customers enter
- ✅ `waiting_positions` - Where customers wait
- ✅ `service_rooms` - Service room positions
- ✅ `staff_positions` - Staff positions

**Optional Overrides:**
- `business_metrics` - Override global defaults
- `business_stats` - Override global defaults
- `map_config` - Override global map
- `capacity_image`, `win_condition`, `lose_condition` - Override global

## 🔧 How to Remove Unused Columns

### Step 1: Verify All Industries Have Layout

Run this query in your Supabase SQL editor to check:

```sql
SELECT 
  i.id as industry_id,
  i.name as industry_name,
  CASE 
    WHEN isc.entry_position IS NULL THEN '❌ Missing layout'
    ELSE '✅ Has layout'
  END as layout_status
FROM industries i
LEFT JOIN industry_simulation_config isc ON i.id = isc.industry_id
WHERE i.is_available = true
ORDER BY i.id;
```

**Important:** Only proceed if ALL industries show "✅ Has layout"

### Step 2: Remove Unused Columns

Once verified, run this migration in Supabase SQL editor:

```sql
-- Remove unused layout columns from global_simulation_config
ALTER TABLE global_simulation_config
  DROP COLUMN IF EXISTS entry_position,
  DROP COLUMN IF EXISTS waiting_positions,
  DROP COLUMN IF EXISTS service_rooms,
  DROP COLUMN IF EXISTS staff_positions;
```

### Step 3: Verify Removal

Check that columns are gone:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'global_simulation_config'
ORDER BY column_name;
```

You should NOT see: `entry_position`, `waiting_positions`, `service_rooms`, `staff_positions`

## 📋 Next Steps

### Immediate (Before Removing Columns)

1. **Check Database State**
   - Run the verification query above
   - Identify which industries are missing layout

2. **Test Admin Panel**
   - Go to `/admin` → Industry Config tab
   - Select each industry
   - Verify you can edit and save layout positions
   - Test that layout saves correctly

3. **Add Missing Layouts**
   - For each industry missing layout, use Admin Panel to add it
   - Or use SQL to insert layout data directly

### After Admin Panel Testing

4. **Remove Unused Columns**
   - Once all industries have layouts configured
   - Run the migration script to remove deprecated columns

5. **Update TypeScript Types (Optional)**
   - After removing columns, you can also remove them from `GlobalSimulationConfigRow` interface
   - File: `lib/data/simulationConfigRepository.ts`

## 🧪 Testing Admin Panel

### Test Checklist

- [ ] **Global Config Tab**
  - Can load existing global config
  - Can edit and save business metrics
  - Can edit and save business stats
  - Can edit and save movement config
  - Can edit and save win/lose conditions

- [ ] **Industry Config Tab**
  - Can select an industry
  - Can view existing industry config
  - Can edit and save layout positions:
    - Entry position
    - Waiting positions (add/remove/edit)
    - Service rooms (add/remove/edit)
    - Staff positions (add/remove/edit)
  - Can edit and save business metrics override
  - Can edit and save business stats override
  - Can clear layout (sets to null)

- [ ] **Data Persistence**
  - After saving, refresh page - data should persist
  - Game should use saved layout when started

### Common Issues to Check

1. **Layout Not Saving**
   - Check browser console for errors
   - Verify Supabase connection
   - Check network tab for failed requests

2. **Layout Not Loading**
   - Check that `industry_simulation_config` row exists for industry
   - Verify layout columns have data
   - Check browser console for warnings

3. **Admin Panel Errors**
   - Check browser console
   - Verify all required fields are filled
   - Check that industry is selected before editing

## 📝 Adding Missing Layout Data

### Via Admin Panel (Recommended)

1. Go to `/admin` → Industry Config tab
2. Select the industry missing layout
3. Scroll to "Layout Positions" section
4. Fill in:
   - Entry Position (X, Y)
   - Add Waiting Positions (click "+ Add" for each)
   - Add Service Rooms (click "+ Add" for each)
   - Add Staff Positions (click "+ Add" for each)
5. Click "Save Industry Config"

### Via SQL (Alternative)

```sql
-- Example: Add layout for 'dental' industry
INSERT INTO industry_simulation_config (id, industry_id, entry_position, waiting_positions, service_rooms, staff_positions)
VALUES (
  'config-dental',
  'dental',
  '{"x": 4, "y": 9}'::jsonb,
  '[
    {"x": 1, "y": 1},
    {"x": 1, "y": 2},
    {"x": 1, "y": 3},
    {"x": 1, "y": 4}
  ]'::jsonb,
  '[
    {"roomId": 1, "customerPosition": {"x": 5, "y": 2}, "staffPosition": {"x": 5, "y": 1}},
    {"roomId": 2, "customerPosition": {"x": 6, "y": 2}, "staffPosition": {"x": 6, "y": 1}}
  ]'::jsonb,
  '[
    {"x": 4, "y": 0},
    {"x": 5, "y": 0},
    {"x": 6, "y": 0}
  ]'::jsonb
)
ON CONFLICT (industry_id) DO UPDATE SET
  entry_position = EXCLUDED.entry_position,
  waiting_positions = EXCLUDED.waiting_positions,
  service_rooms = EXCLUDED.service_rooms,
  staff_positions = EXCLUDED.staff_positions;
```

## 🎯 Summary

**Current State:**
- ✅ Code refactored - layout is industry-specific
- ✅ Store initialization fixed - no more crashes
- ✅ Documentation updated
- ⚠️ Unused columns still in database (safe to keep or remove)

**What's Next:**
1. Test admin panel to ensure it works correctly
2. Add missing layout data for any industries that need it
3. Remove unused columns from `global_simulation_config` (optional cleanup)
4. Verify game runs correctly with all industry layouts

**Files to Review:**
- `sql/remove_global_layout_columns.sql` - Migration script for removing columns
- `DATABASE_SETUP_GUIDE.md` - Updated database setup instructions
- Admin panel at `/admin` - Test layout editing functionality

