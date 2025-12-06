# Metric Registry

## Overview

The Metric Registry (`lib/game/metrics/registry.ts`) is the **single source of truth** for all game metrics. It defines what metrics exist, their default values, constraints, and display configuration.

## Purpose

- **Centralized Definition**: All metrics defined in one place
- **Easy to Add**: Add new metrics by just adding to the registry
- **Consistent Display**: Same labels and metadata across HUD, details panel, and admin UI
- **Phase 2 Ready**: Enables industry-specific HUD configuration

## Structure

### MetricDefinition Interface

```typescript
interface MetricDefinition {
  id: GameMetric;                    // The metric enum value
  displayLabel: string;              // What to show in UI (e.g., "Leveraged Time")
  description: string;               // What this metric does
  
  // Default values
  defaultValueSource: 'businessMetrics' | 'businessStats' | 'calculated';
  defaultValuePath?: string;         // e.g., 'startingCash', 'serviceRevenueMultiplier'
  calculatedDefaultValue?: number;   // For calculated metrics (default 1.0 or 0)
  
  // Constraints
  constraints?: {
    min?: number;
    max?: number;
    roundToInt?: boolean;
  };
  
  // Display configuration
  display: {
    showOnHUD: boolean;              // Show on HUD (Phase 2: configurable per industry)
    showInDetails: boolean;           // Show in details panel
    showInAdmin: boolean;             // Show in admin UI
    priority?: number;                // Display order (lower = shown first)
    unit?: string;                    // Optional unit: "h", "x", "%", etc.
  };
  
  // Effect system
  canBeModifiedByEffects: boolean;   // Can upgrades/marketing/staff modify this?
}
```

## Adding a New Metric

### Step 1: Add to GameMetric Enum
```typescript
// lib/game/effectManager.ts
export enum GameMetric {
  // ... existing metrics
  NewMetric = 'newMetric',
}
```

### Step 2: Add to Registry
```typescript
// lib/game/metrics/registry.ts
[GameMetric.NewMetric]: {
  id: GameMetric.NewMetric,
  displayLabel: 'New Metric',
  description: 'What this metric does',
  defaultValueSource: 'businessStats',  // or 'businessMetrics' or 'calculated'
  defaultValuePath: 'newMetricValue',   // if from config
  // OR calculatedDefaultValue: 0,       // if calculated
  constraints: {
    min: 0,
    roundToInt: true,
  },
  display: {
    showOnHUD: false,
    showInDetails: true,
    showInAdmin: true,
    unit: 'x',
  },
  canBeModifiedByEffects: true,
},
```

### Step 3: That's It!
- Phase 2 will auto-generate admin UI from registry
- HUD will use `showOnHUD` flag
- Details panel will use `showInDetails` flag

## Helper Functions

### `getMetricDefinition(metric: GameMetric): MetricDefinition`
Get the full definition for a metric.

```typescript
const def = getMetricDefinition(GameMetric.Cash);
console.log(def.displayLabel); // "Cash"
```

### `getAllMetrics(): MetricDefinition[]`
Get all metrics in the registry.

### `getMetricsForHUD(): MetricDefinition[]`
Get metrics that should be shown on HUD, sorted by priority.

### `getMetricsForDetails(): MetricDefinition[]`
Get metrics that should be shown in details panel, sorted by priority.

### `getModifiableMetrics(): MetricDefinition[]`
Get metrics that can be modified by effects (upgrades, marketing, staff, events).

### `getDefaultValue(metric: GameMetric, industryId?: IndustryId): number`
Get the default value for a metric from config.

```typescript
const defaultCash = getDefaultValue(GameMetric.Cash, 'freelance');
// Returns: value from businessMetrics.startingCash for freelance industry
```

## Current Metrics

### Primary Metrics (HUD)
- **Cash** - Available cash currency
- **Level** (Exp) - Experience points / player level
- **Available Time** - Monthly available time (hours, conditional)
- **Leveraged Time** (FreedomScore) - Monthly leveraged time requirement

### Service Metrics
- **Service Speed** - Multiplier for service completion speed
- **Service Capacity** - Max customers served simultaneously
- **Revenue Multiplier** - Multiplier for all service revenue
- **Revenue Bonus** - Flat bonus added to service revenue

### Gameplay Metrics
- **Spawn Interval** - Seconds between customer spawns (admin only)
- **Conversion Rate** - Lead conversion progress (NEW: will show on HUD in Phase 2)
- **Failure Rate** - Base chance of operations failing (0-100%)

### Economy Metrics
- **Monthly Expenses** - Base monthly expenses
- **Time Capacity** - Additional monthly time capacity (hours)

### Tier Modifiers (Admin Only)
- High/Mid/Low Tier Revenue Multipliers
- High/Mid/Low Tier Weightage Multipliers

### Special
- **Generate Leads** - One-time lead generation action

## Changing Display Names

To change a metric's display name (e.g., FreedomScore → Leveraged Time), just update the `displayLabel` field:

```typescript
[GameMetric.FreedomScore]: {
  // ...
  displayLabel: 'Leveraged Time',  // Changed from "Freedom Score"
  // ...
}
```

## Default Value Sources

### businessMetrics
Values from `BusinessMetrics` interface:
- `startingCash`
- `startingExp`
- `startingTime`
- `monthlyExpenses`
- `startingFreedomScore`

### businessStats
Values from `BusinessStats` interface:
- `serviceCapacity`
- `serviceRevenueMultiplier`
- `customerSpawnIntervalSeconds`
- `conversionRate`
- `failureRate`

### calculated
Always the same value (not from config):
- `ServiceSpeedMultiplier` → 1.0
- `ServiceRevenueFlatBonus` → 0
- `MonthlyTimeCapacity` → 0
- All tier multipliers → 1.0

## Constraints

Constraints are applied when calculating metric values through the effect system:

- `min` - Minimum allowed value
- `max` - Maximum allowed value
- `roundToInt` - Round to nearest integer

Example: Cash has `min: 0, roundToInt: true` - can't go negative, must be whole number.

## Phase 2: Industry-Specific HUD

In Phase 2, the HUD will become configurable per industry. The registry's `showOnHUD` flag will serve as the default, but industries can override which metrics appear on their HUD.

## Notes

- **Non-Breaking**: Registry is additive - existing code continues to work
- **Type-Safe**: All metrics are typed via `GameMetric` enum
- **Single Source of Truth**: One place to see all metrics and their metadata
- **Easy to Extend**: Adding new metrics is straightforward
