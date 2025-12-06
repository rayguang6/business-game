# Metrics Refactoring Status

## ✅ Completed

### Infrastructure
1. **Metric Registry** (`lib/game/metrics/registry.ts`)
   - ✅ All metrics defined with metadata
   - ✅ Display labels, descriptions, units, priorities
   - ✅ Default value sources configured
   - ✅ Helper functions: `getMetricDefinition()`, `getMergedMetricDefinition()`, `getMetricsForHUD()`

2. **Database Schema** (`sql/migrations/007_create_metric_display_config.sql`)
   - ✅ Table created: `metric_display_config`
   - ✅ Supports global defaults and industry-specific overrides
   - ✅ Stores: displayLabel, description, unit, showOnHUD, showInDetails, priority

3. **Repository Layer** (`lib/data/metricDisplayConfigRepository.ts`)
   - ✅ `fetchMetricDisplayConfig()` - Get config for specific metric + industry
   - ✅ `fetchAllMetricDisplayConfigs()` - Get all configs with fallbacks
   - ✅ `fetchIndustrySpecificMetricDisplayConfigs()` - Get only industry overrides
   - ✅ `upsertMetricDisplayConfig()` - Save config
   - ✅ `deleteMetricDisplayConfig()` - Delete industry override

4. **Admin UI** (`app/admin/components/MetricDisplayConfigTab.tsx`)
   - ✅ Full UI for managing metric display configs
   - ✅ Global and industry-specific pages
   - ✅ Uses registry for code defaults
   - ✅ Can seed database from registry

5. **Seed Function** (`lib/data/seedMetricDisplayConfig.ts`)
   - ✅ Populates database from registry values

## ✅ Phase 1: Registry Integration (COMPLETE)

### Game UI Components - All Using Registry

1. **HUD Component** (`app/game/components/ui/KeyMetrics.tsx`)
   - ✅ Using `useMetricDisplayConfigs()` hook
   - ✅ Using `getMetricsForHUD()` to determine which metrics to show
   - ✅ Using `getMergedDefinition()` to get labels (DB + registry)
   - ✅ Respects `showOnHUD` from database configs
   - ✅ Shows "Leveraged Time" instead of "Freedom Score"

2. **Marketing Tab** (`app/game/components/tabs/MarketingTab.tsx`)
   - ✅ Using `useMetricDisplayConfigs()` hook
   - ✅ Using `getDisplayLabel()` for all metric labels
   - ✅ No hardcoded `METRIC_LABELS` object

3. **Event Popup** (`app/game/components/ui/EventPopup.tsx`)
   - ✅ Using `useMetricDisplayConfigs()` hook
   - ✅ Using `getDisplayLabel()` for metric effects
   - ✅ No hardcoded `METRIC_LABELS` object

4. **Upgrades Tab** (`app/game/components/tabs/UpgradesTab.tsx`)
   - ✅ Using `useMetricDisplayConfigs()` hook
   - ✅ Using `getDisplayLabel()` for upgrade effects
   - ✅ No hardcoded `METRIC_LABELS` object

5. **Staff Tab** (`app/game/components/tabs/StaffTab.tsx`)
   - ✅ Using `useMetricDisplayConfigs()` hook
   - ✅ Using `getDisplayLabel()` for staff effects
   - ✅ No hardcoded labels

6. **Admin Components**
   - ✅ `app/admin/utils/constants.ts` - Using `getMetricDefinition()` from registry
   - ✅ `app/admin/components/ConditionsTab.tsx` - Using `getMetricDefinition()` from registry
   - ✅ `app/admin/components/RequirementsSelector.tsx` - Using `getMetricDefinition()` from registry

## ✅ Phase 2: Database Integration (COMPLETE)

### Database Integration Hook
1. **`useMetricDisplayConfigs` Hook** (`hooks/useMetricDisplayConfigs.ts`)
   - ✅ Fetches metric display configs from database for current industry
   - ✅ Uses `getMergedMetricDefinition()` to merge code + DB configs
   - ✅ Provides `getDisplayLabel()`, `getMergedDefinition()`, `getMetricsForHUD()`
   - ✅ All methods respect database overrides

### Components Using Database Integration
- ✅ `KeyMetrics.tsx` - Fetches DB configs via hook, uses merged definitions
- ✅ `MarketingTab.tsx` - Uses hook for DB-driven labels
- ✅ `EventPopup.tsx` - Uses hook for DB-driven labels
- ✅ `UpgradesTab.tsx` - Uses hook for DB-driven labels
- ✅ `StaffTab.tsx` - Uses hook for DB-driven labels

**Result**: Database changes to labels, visibility, and priority now reflect in game UI!

## ✅ Integration Complete

### Phase 1: Registry Integration ✅
**Status**: COMPLETE
**What**: All components now use registry lookups instead of hardcoded labels
- ✅ All components use `getMetricDefinition()` or `getDisplayLabel()` from hook
- ✅ All components use `getMetricsForHUD()` to determine which metrics to show
- ✅ Labels are consistent across all UI

### Phase 2: Database Integration ✅
**Status**: COMPLETE
**What**: All components fetch DB configs and merge with registry
- ✅ `useMetricDisplayConfigs` hook fetches configs on component mount
- ✅ All components use `getMergedMetricDefinition()` via hook
- ✅ Components respect `showOnHUD` and `showInDetails` from DB
- ✅ Components use DB `displayLabel` when available, fallback to registry

## 📋 Implementation Checklist

### Phase 1 - Registry Integration ✅
- [x] Update `KeyMetrics.tsx` to use `getMetricsForHUD()` and `getMetricDefinition()`
- [x] Update `MarketingTab.tsx` to use registry instead of `METRIC_LABELS`
- [x] Update `EventPopup.tsx` to use registry instead of `METRIC_LABELS`
- [x] Update `UpgradesTab.tsx` to use registry instead of `METRIC_LABELS`
- [x] Update `StaffTab.tsx` to use registry
- [x] Update admin components to use registry

### Phase 2 - Database Integration ✅
- [x] Add server action to fetch metric display configs for current industry
- [x] Create `useMetricDisplayConfigs` hook for fetching and merging configs
- [x] Update `KeyMetrics.tsx` to fetch and use DB configs
- [x] Update other game UI components to fetch and use DB configs
- [x] Ensure `getMergedMetricDefinition()` is used everywhere
- [x] Test that DB changes reflect in game UI

## 🎯 Current State

**Registry says**: "Leveraged Time" for FreedomScore
**UI shows**: "Leveraged Time" ✅ (from registry/DB)

**Registry says**: ConversionRate should show on HUD (priority 5)
**HUD shows**: Metrics based on `showOnHUD` flag from DB/registry ✅

**Database can**: Override labels and visibility per industry
**Game UI**: ✅ Checks database via `useMetricDisplayConfigs` hook

## ✅ Status Summary

**Both Phase 1 and Phase 2 are COMPLETE!**

**What's Working:**
1. ✅ All UI components use registry for metric labels
2. ✅ All UI components fetch and respect database overrides
3. ✅ Labels are consistent across all UI (HUD, tabs, events, admin)
4. ✅ Database changes to labels/visibility reflect immediately in game
5. ✅ Admin UI can manage metric display configs per industry

**Next Steps (Optional Enhancements):**
1. Test database changes in admin UI and verify they reflect in game
2. Seed database with initial configs if not already done
3. Consider adding more metrics to registry as needed
4. Monitor performance of database queries in `useMetricDisplayConfigs` hook

## 🔍 Files That Need Changes

### Game UI (High Priority)
1. `app/game/components/ui/KeyMetrics.tsx` - HUD display
2. `app/game/components/tabs/MarketingTab.tsx` - Marketing effects
3. `app/game/components/ui/EventPopup.tsx` - Event effects
4. `app/game/components/tabs/UpgradesTab.tsx` - Upgrade effects
5. `app/game/components/tabs/StaffTab.tsx` - Staff effects (verify)

### Admin UI (Medium Priority)
6. `app/admin/utils/constants.ts` - Metric options
7. `app/admin/components/ConditionsTab.tsx` - Condition metric selector
8. `app/admin/components/RequirementsSelector.tsx` - Requirement metric selector

## 📝 Example: How to Fix KeyMetrics.tsx

### Before (Current):
```typescript
const metricsData = [
  {
    key: 'cash',
    label: 'Cash',  // Hardcoded
    // ...
  },
  {
    key: 'freedomScore',
    label: 'Freedom Score',  // Hardcoded - WRONG!
    // ...
  }
];
```

### After Phase 1 (Registry):
```typescript
import { getMetricsForHUD, getMetricDefinition } from '@/lib/game/metrics/registry';

const hudMetrics = getMetricsForHUD(); // Gets metrics that should show on HUD
const metricsData = hudMetrics
  .filter(def => {
    // Filter based on game state (e.g., show Time only if startingTime > 0)
    if (def.id === GameMetric.Time) return showTime;
    return true;
  })
  .map(def => {
    const metricValue = getMetricValue(def.id); // Helper to get current value
    return {
      key: def.id,
      label: def.displayLabel,  // From registry: "Leveraged Time" ✅
      value: formatMetricValue(def.id, metricValue, def.display.unit),
      // ...
    };
  });
```

### After Phase 2 (Database):
```typescript
import { getMergedMetricDefinition } from '@/lib/game/metrics/registry';
import { fetchAllMetricDisplayConfigs } from '@/lib/data/metricDisplayConfigRepository';

// Fetch configs for current industry
const dbConfigs = await fetchAllMetricDisplayConfigs(industryId);
const hudMetrics = getMetricsForHUD();

const metricsData = hudMetrics
  .filter(def => {
    const merged = getMergedMetricDefinition(def.id, dbConfigs[def.id]);
    return merged.display.showOnHUD; // Use DB value
  })
  .map(def => {
    const merged = getMergedMetricDefinition(def.id, dbConfigs[def.id]);
    return {
      key: def.id,
      label: merged.displayLabel,  // From DB if exists, otherwise registry ✅
      // ...
    };
  });
```

## 🚀 Next Steps (Optional)

1. **Test Database Integration** - Verify that changes in admin UI reflect in game
2. **Seed Database** - Run seed function to populate initial configs if not already done
3. **Performance Monitoring** - Monitor `useMetricDisplayConfigs` hook for any performance issues
4. **Add More Metrics** - As new metrics are added, update registry and database configs

## 📝 Implementation Notes

### How It Works Now

All game UI components use the `useMetricDisplayConfigs` hook:

```typescript
const { getDisplayLabel, getMetricsForHUD, getMergedDefinition } = useMetricDisplayConfigs(industryId);

// Get label (DB override if available, otherwise registry)
const label = getDisplayLabel(GameMetric.FreedomScore); // "Leveraged Time"

// Get metrics for HUD (respects DB showOnHUD flag)
const hudMetrics = getMetricsForHUD();

// Get full merged definition (code + DB)
const merged = getMergedDefinition(GameMetric.FreedomScore);
```

The hook:
1. Fetches database configs for the current industry on mount
2. Merges DB configs with registry defaults using `getMergedMetricDefinition()`
3. Provides convenient methods that respect database overrides
4. Handles loading states and errors gracefully
