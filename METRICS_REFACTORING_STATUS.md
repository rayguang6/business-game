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

## ❌ Not Yet Implemented (Critical)

### Game UI Components Still Using Hardcoded Labels

1. **HUD Component** (`app/game/components/ui/KeyMetrics.tsx`)
   - ❌ Hardcoded labels: "Cash", "Freedom Score", "Available Time"
   - ❌ Hardcoded metric keys: `cash`, `exp`, `time`, `freedomScore`
   - ❌ Not using `getMetricsForHUD()` from registry
   - ❌ Not fetching DB configs or using `getMergedMetricDefinition()`
   - **Impact**: Database changes to labels/visibility don't affect HUD

2. **Marketing Tab** (`app/game/components/tabs/MarketingTab.tsx`)
   - ❌ Hardcoded `METRIC_LABELS` object (lines 26-50)
   - ❌ Still shows "Freedom Score" instead of "Leveraged Time"
   - **Impact**: Wrong labels shown to players

3. **Event Popup** (`app/game/components/ui/EventPopup.tsx`)
   - ❌ Hardcoded `METRIC_LABELS` object (lines 37-61)
   - ❌ Different labels than registry (e.g., "Customer Spawn Speed" vs registry)
   - **Impact**: Inconsistent labels across UI

4. **Upgrades Tab** (`app/game/components/tabs/UpgradesTab.tsx`)
   - ❌ Hardcoded `METRIC_LABELS` object (lines 25-32)
   - ❌ Still shows "Freedom Score"
   - **Impact**: Wrong labels in upgrades UI

5. **Staff Tab** (`app/game/components/tabs/StaffTab.tsx`)
   - ❌ Likely has hardcoded labels (needs verification)
   - **Impact**: Potential inconsistency

6. **Other Components**
   - ❌ `app/admin/utils/constants.ts` - Has "Freedom Score" hardcoded
   - ❌ `app/admin/components/ConditionsTab.tsx` - Has "Freedom Score" hardcoded
   - ❌ `app/admin/components/RequirementsSelector.tsx` - Has "Freedom Score" hardcoded

## 🔄 Integration Required

### Phase 1: Use Registry (No DB Yet)
**When**: Can be done immediately
**What**: Replace hardcoded labels with registry lookups
- Use `getMetricDefinition()` to get labels
- Use `getMetricsForHUD()` to determine which metrics to show
- This makes labels consistent across all UI

### Phase 2: Use Database Config (Full Implementation)
**When**: After Phase 1, or when you want DB-driven labels
**What**: Fetch DB configs and merge with registry
- Fetch configs on component mount (or via server action)
- Use `getMergedMetricDefinition()` to merge code + DB
- Respect `showOnHUD` and `showInDetails` from DB
- Use DB `displayLabel` instead of registry `displayLabel`

## 📋 Implementation Checklist

### Immediate (Phase 1 - Registry Only)
- [ ] Update `KeyMetrics.tsx` to use `getMetricsForHUD()` and `getMetricDefinition()`
- [ ] Update `MarketingTab.tsx` to use registry instead of `METRIC_LABELS`
- [ ] Update `EventPopup.tsx` to use registry instead of `METRIC_LABELS`
- [ ] Update `UpgradesTab.tsx` to use registry instead of `METRIC_LABELS`
- [ ] Update `StaffTab.tsx` to use registry (verify first)
- [ ] Update admin components to use registry

### Next (Phase 2 - Database Integration)
- [ ] Add server action to fetch metric display configs for current industry
- [ ] Update `KeyMetrics.tsx` to fetch and use DB configs
- [ ] Update other game UI components to fetch and use DB configs
- [ ] Ensure `getMergedMetricDefinition()` is used everywhere
- [ ] Test that DB changes reflect in game UI

## 🎯 Current State

**Registry says**: "Leveraged Time" for FreedomScore
**UI shows**: "Freedom Score" (hardcoded)

**Registry says**: ConversionRate should show on HUD (priority 5)
**HUD shows**: Only Cash, Exp, Time, FreedomScore (hardcoded)

**Database can**: Override labels and visibility per industry
**Game UI**: Doesn't check database at all

## ⚠️ When to Implement

**Answer: Implement Phase 1 NOW**

**Reasons:**
1. Infrastructure is ready (registry, DB, admin UI)
2. UI is inconsistent (hardcoded vs registry)
3. Database changes won't take effect until integrated
4. Phase 1 (registry only) is low-risk and improves consistency
5. Phase 2 (DB integration) can be done incrementally

**Phase 2 can wait if:**
- You want to test registry integration first
- You're not ready to add DB queries to game components
- You want to keep it simple for now

**But Phase 1 should be done because:**
- It fixes the "Freedom Score" → "Leveraged Time" issue immediately
- It makes all UI consistent
- It's a prerequisite for Phase 2 anyway

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

## 🚀 Next Steps

1. **Start with Phase 1** - Replace hardcoded labels with registry lookups
2. **Test thoroughly** - Ensure all UI components show correct labels
3. **Then Phase 2** - Add database integration for industry-specific overrides
4. **Seed database** - Run seed function to populate initial configs
5. **Test admin UI** - Verify changes in admin panel reflect in game
