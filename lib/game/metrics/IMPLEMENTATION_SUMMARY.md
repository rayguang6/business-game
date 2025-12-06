# Metric Display Config - Implementation Summary

## What Was Implemented

### 1. Database Table
- **File**: `sql/migrations/007_create_metric_display_config.sql`
- **Table**: `metric_display_config`
- **Purpose**: Stores display configuration (labels, visibility, priority, icons) for metrics
- **Structure**: 
  - `industry_id` (NULL = global default, industry ID = industry-specific override)
  - `metric_id` (references GameMetric enum)
  - Display fields: `display_label`, `description`, `unit`, `icon_path`
  - Visibility: `show_on_hud`, `show_in_details`, `show_in_admin`
  - Ordering: `hud_priority`, `details_priority`

### 2. Repository
- **File**: `lib/data/metricDisplayConfigRepository.ts`
- **Functions**:
  - `fetchMetricDisplayConfig()` - Get config for specific metric + industry
  - `fetchAllMetricDisplayConfigs()` - Get all configs (industry-specific + global fallbacks)
  - `upsertMetricDisplayConfig()` - Save/update config
  - `deleteMetricDisplayConfig()` - Delete industry-specific override

### 3. Seed Script
- **File**: `lib/data/seedMetricDisplayConfig.ts`
- **Purpose**: Populate database with current registry values
- **Usage**: 
  - Run manually: `npx tsx lib/data/seedMetricDisplayConfig.ts`
  - Or use "Seed Database" button in admin UI (global tab only)

### 4. Registry Updates
- **File**: `lib/game/metrics/registry.ts`
- **New Function**: `getMergedMetricDefinition()` - Merges code definition with DB display config
- **Behavior**: Code provides defaults, DB overrides display properties

### 5. Admin Hook
- **File**: `app/admin/hooks/useMetricDisplayConfig.ts`
- **Purpose**: Manages state and operations for metric display config editing
- **Features**:
  - Loads global + industry-specific configs
  - Tracks changes
  - Save/delete operations
  - Seed database function

### 6. Admin UI Component
- **File**: `app/admin/components/MetricDisplayConfigTab.tsx`
- **Features**:
  - Search/filter metrics
  - Expandable metric cards
  - Edit display label, description, unit
  - Toggle visibility flags (HUD, Details, Admin)
  - Set priority/order
  - Save individual metrics
  - Delete industry-specific overrides
  - Shows global defaults vs industry overrides

### 7. Admin Pages
- **Global**: `app/admin/metric-display/page.tsx` - Edit global defaults
- **Industry**: `app/admin/[industry]/metric-display/page.tsx` - Edit industry-specific overrides

### 8. Navigation
- Added to `AdminLayoutClient.tsx` sidebar
- Added to routing types and utilities
- Available as both global and industry tab

## How to Use

### Initial Setup

1. **Run Migration**:
   ```sql
   -- Execute: sql/migrations/007_create_metric_display_config.sql
   ```

2. **Seed Database**:
   - Go to Admin → Metric Display (global tab)
   - Click "Seed Database" button
   - Or run: `npx tsx lib/data/seedMetricDisplayConfig.ts`

### Using the Admin UI

1. **Global Configuration**:
   - Navigate to Admin → Metric Display (global tab)
   - Edit display labels, descriptions, units
   - Set default visibility and priority
   - Click "Seed Database" to initialize if empty

2. **Industry-Specific Overrides**:
   - Navigate to Admin → [Industry] → Metric Display
   - Edit metrics to override global defaults
   - Changes are highlighted in yellow
   - Click "Delete Override" to revert to global default

3. **Features**:
   - **Search**: Filter metrics by name, description, or ID
   - **Filter**: Show only HUD metrics or non-HUD metrics
   - **Expand**: Click metric card to edit
   - **Save**: Save individual metric (⌘↵ keyboard shortcut)
   - **Visual Indicators**: 
     - Yellow border = has unsaved changes
     - "Modified" badge = has industry-specific override
     - HUD/Details badges = visibility flags

## Architecture

### Hybrid Approach (Code + Database)

**Code Registry** (Core Logic):
- Metric IDs (GameMetric enum)
- Default value sources/paths
- Constraints (min, max, roundToInt)
- `canBeModifiedByEffects` flag

**Database** (Display Config):
- Display labels
- Descriptions
- Units
- Visibility flags (showOnHUD, showInDetails, showInAdmin)
- Priority/order
- Icons (future)

**Merge Function**:
- Code provides defaults
- Database overrides display properties
- Industry-specific overrides global

## Example: Changing FreedomScore to Leveraged Time

### Before (Code Only):
```typescript
// lib/game/metrics/registry.ts
[GameMetric.FreedomScore]: {
  displayLabel: 'Leveraged Time',
  // ...
}
```

### After (Database):
1. Go to Admin → Metric Display
2. Find "Freedom Score" (or search for "freedomScore")
3. Expand the metric card
4. Change "Display Label" to "Leveraged Time"
5. Click "Save"

**Result**: Display name changed without code changes!

## Benefits

1. **No Code Changes**: Change display names, visibility, priority without touching code
2. **Industry-Specific**: Each industry can have different HUD configuration
3. **Easy to Use**: Simple admin UI, no SQL knowledge needed
4. **Type-Safe**: Core logic stays in TypeScript
5. **Flexible**: Can customize per industry or use global defaults

## Next Steps (Phase 2)

1. **HUD Integration**: Update `KeyMetrics.tsx` to use merged config from registry
2. **Industry-Specific HUD**: Filter metrics by industry config
3. **Icons**: Add icon picker to admin UI
4. **Bulk Operations**: Save all changes at once
5. **Validation**: Add validation for display labels, priorities

## Files Created/Modified

### New Files
- `sql/migrations/007_create_metric_display_config.sql`
- `lib/data/metricDisplayConfigRepository.ts`
- `lib/data/seedMetricDisplayConfig.ts`
- `app/admin/hooks/useMetricDisplayConfig.ts`
- `app/admin/components/MetricDisplayConfigTab.tsx`
- `app/admin/metric-display/page.tsx`
- `app/admin/[industry]/metric-display/page.tsx`

### Modified Files
- `lib/game/metrics/registry.ts` - Added `getMergedMetricDefinition()`
- `app/admin/utils/routing.ts` - Added `metric-display` tab
- `app/admin/AdminLayoutClient.tsx` - Added to navigation

## Testing

1. **Run Migration**: Execute SQL migration
2. **Seed Database**: Use admin UI or script
3. **Edit Global**: Change a display label, save
4. **Edit Industry**: Create industry override, save
5. **Delete Override**: Delete industry override, verify falls back to global
6. **Search/Filter**: Test search and filter functionality
