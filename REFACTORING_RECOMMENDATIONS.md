# Refactoring Recommendations for Business Game

## Executive Summary

This document provides comprehensive recommendations for refactoring the codebase to improve modularity, maintainability, and scalability. The focus areas are:

1. **Unified Config Architecture** - Single table for global + industry configs (removes duplication)
2. **Metrics & Parameters Registry** - Centralized metric definitions and display configuration
3. **HUD & Display System** - Industry-specific HUD configuration and new metrics
4. **Database Schema Management** - Simplifying schema changes (add/delete columns)
5. **General Scalability** - Patterns for easier iteration and growth

---

## ✅ Implementation Status Summary

### Phase 0: Unified Config Table ✅ **COMPLETE**
**Status:** Migration created, unified table exists, code partially migrated

**Completed:**
- ✅ Migration script created (`006_create_unified_simulation_config.sql`)
- ✅ Unified `simulation_config` table with `industry_id` column exists
- ✅ Data migrated from both old tables
- ✅ Unified repository (`simulationConfigRepository.ts`) exists
- ✅ Unified admin hook (`useSimulationConfig`) exists

**Remaining:**
- ⚠️ Some repositories still reference old tables (`industrySimulationConfigRepository.ts`, `layoutRepository.ts`)
- ⚠️ Old tables (`global_simulation_config`, `industry_simulation_config`) still exist (not dropped)
- ⚠️ Need to verify all code uses unified table before dropping old tables

**Next Steps:**
1. Audit all code to ensure it uses unified `simulation_config` table
2. Remove references to old tables
3. Drop old tables after verification
4. Clean up duplicate repository code

---

## Updated Implementation Priority

### Phase 0: Unified Config Table (Highest Priority - 1-2 weeks) ✅ **MOSTLY COMPLETE**
**Problem:** Two separate tables (`global_simulation_config` + `industry_simulation_config`) create massive duplication.

**Solution:** Single `simulation_config` table with `industry_id` column.
- `industry_id = 'global'` → Default values
- `industry_id = 'freelance'` → Override for freelance industry

**Benefits:**
- ✅ **70% less code** (1 table, 1 repository, 1 hook instead of 2 each)
- ✅ **3 places to update** instead of 9 for new fields
- ✅ **Simpler architecture** - no complex merging logic

**Implementation:**
1. ✅ Create migration script (copy data from both tables)
2. ✅ Update repositories to use new table (mostly done)
3. ✅ Merge admin hooks/components (done)
4. ⚠️ Test thoroughly, then drop old tables (pending cleanup)

### Phase 1: Metric Registry (Core Foundation - 2-3 weeks) ✅ **COMPLETE**
**Status:** Registry created, all components migrated, database integration complete

**Completed:**
- ✅ `lib/game/metrics/registry.ts` created with all metrics
- ✅ Metric definitions with display metadata
- ✅ Database schema for metric display configs (`metric_display_config` table)
- ✅ Repository layer for metric display configs
- ✅ Admin UI for managing metric display configs
- ✅ `useMetricDisplayConfigs` hook for fetching DB configs
- ✅ All game UI components migrated (HUD, Marketing, Events, Upgrades, Staff)
- ✅ All admin components migrated
- ✅ ConversionRate added to registry (shows on HUD)
- ✅ FreedomScore → LeveragedTime (display name updated)
- ✅ ServiceRevenueFlatBonus treated as regular metric

**Benefits Achieved:**
- ✅ Single source of truth for all metrics
- ✅ Easy to add new metrics (add to registry)
- ✅ Configurable display (HUD vs details vs hidden)
- ✅ Database-driven overrides per industry
- ✅ Consistent labels across all UI

### Phase 2: HUD & Display Updates (User-Facing - 1-2 weeks) ⚠️ **PARTIALLY COMPLETE**
**Status:** Most changes done, one feature pending

**Completed:**
- ✅ FreedomScore → LeveragedTime (display name updated in registry)
- ✅ ConversionRate added to HUD (registry shows `showOnHUD: true`, priority 5)
- ✅ Industry-specific HUD configuration (via database `metric_display_config` table)
- ✅ HUD component uses registry and respects DB configs

**Remaining:**
- ❌ **SpawnInterval → CustomersPerMonth display** - NOT IMPLEMENTED
  - Calculation exists (`calculateMonthlyRevenuePotential()` in `config.ts`)
  - Registry still shows "Spawn Interval" with description "Phase 2: will display as Customers Per Month"
  - Need to:
    1. Add `CustomersPerMonth` as calculated metric or display transformation
    2. Update registry to show calculated value instead of raw `SpawnIntervalSeconds`
    3. Update UI to display "Customers Per Month" instead of "Spawn Interval"

**Implementation Needed:**
1. Add display transformation for `SpawnIntervalSeconds` → `CustomersPerMonth`
2. Update registry description and display logic
3. Update UI components to show calculated value

### Phase 3: Schema Management & Code Generation (Future-Proofing - 2-3 weeks) ❌ **NOT STARTED**
**Status:** No schema definitions or code generation implemented

**Problem:** Schema changes require manual updates in multiple places.

**Solution:** Schema definitions + code generation.

**Benefits:**
- ✅ Auto-generate TypeScript types from database
- ✅ Auto-generate admin forms
- ✅ Checklist generator for schema changes

**Implementation Needed:**
1. Create schema definitions (`lib/data/schema/definitions.ts`)
2. Add type generation scripts
3. Create schema change helper/checklist generator
4. Migrate to generated forms (optional, can be incremental)

### Phase 4: Advanced Features & Cleanup (Ongoing) ❌ **NOT STARTED**
**Status:** No advanced features implemented yet

**Remaining Work:**
- ❌ Repository base classes (`BaseRepository` pattern)
- ❌ Testing infrastructure (schema consistency tests)
- ❌ Documentation updates
- ❌ Parameter groups/organization system

---

## 1. Unified Config Architecture

### Current Problem

**Massive Duplication:**
- Two tables: `global_simulation_config` + `industry_simulation_config`
- Every new field requires updates in **9 places**:
  1. Global table schema
  2. Industry table schema
  3. `fetchGlobalSimulationConfig()` mapping
  4. `fetchIndustrySimulationConfig()` mapping
  5. `upsertGlobalSimulationConfig()` payload
  6. `upsertIndustrySimulationConfig()` payload
  7. `config.ts` merging logic
  8. Admin global hook
  9. Admin industry hook

### Solution: Single Unified Table

**One table `simulation_config` with `industry_id` column:**
```sql
CREATE TABLE simulation_config (
  industry_id TEXT PRIMARY KEY,  -- 'global' or industry ID
  business_metrics JSONB,
  business_stats JSONB,
  -- All other fields...
);
```

**Code simplification:**
```typescript
// Before: 2 repositories, complex merging
const global = await fetchGlobalSimulationConfig();
const industry = await fetchIndustrySimulationConfig(industryId);
const merged = mergeConfigs(global, industry);

// After: 1 repository, simple fetch
const config = await fetchSimulationConfig(industryId);
```

**Benefits:**
- ✅ **3 places to update** instead of 9 for new fields
- ✅ **One repository** instead of two
- ✅ **One admin hook** instead of two
- ✅ **Consistent pattern** (same as other tables)

### Implementation Strategy

**Phase 0.1: Create Migration (Non-Breaking)**
```sql
-- Create new table
CREATE TABLE simulation_config_new (...);

-- Migrate global data
INSERT INTO simulation_config_new (industry_id, ...)
SELECT 'global', ... FROM global_simulation_config;

-- Migrate industry data
INSERT INTO simulation_config_new (industry_id, ...)
SELECT industry_id, ... FROM industry_simulation_config;
```

**Phase 0.2: Update Code**
- Create unified repository
- Update `config.ts` to use merged fetching
- Merge admin hooks

**Phase 0.3: Cleanup**
- Drop old tables
- Remove duplicate code

---

## 2. Metrics & Parameters Registry

### Current State Analysis

**Problems Identified:**

1. **Scattered Metric Definitions**
   - Metrics defined in `GameMetric` enum (`lib/game/effectManager.ts`)
   - Base values in `BusinessMetrics` and `BusinessStats` (`lib/game/types.ts`)
   - Defaults calculated in `getBaseUpgradeMetricsForIndustry()` (`lib/game/config.ts`)
   - Admin UI options in `METRIC_OPTIONS` (`app/admin/utils/constants.ts`)
   - Calculation logic in `mechanics.ts` and `GameCanvas.tsx`

2. **Inconsistent Parameter Organization**
   - Some metrics in JSONB columns (`business_metrics`, `business_stats`)
   - Some as separate columns (`map_width`, `map_height`)
   - Some hardcoded in calculation logic
   - No single source of truth for "what metrics exist and what are their defaults"

3. **Adding New Metrics Requires Multiple Changes**
   - Add to `GameMetric` enum
   - Add to `BusinessStats` or `BusinessMetrics` interface
   - Add to admin `METRIC_OPTIONS`
   - Add calculation logic in `mechanics.ts`
   - Add display logic in `GameCanvas.tsx`
   - Update database schema (JSONB or new column)
   - Update repository mapping functions

### Recommended Solution: Centralized Metric Registry

Create a **single source of truth** for all game metrics with metadata:

```typescript
// lib/game/metrics/registry.ts

export interface MetricDefinition {
  // Core identification
  id: GameMetric;
  name: string;
  description: string;
  
  // Category for organization
  category: 'economy' | 'gameplay' | 'service' | 'time' | 'tier';
  
  // Default values
  defaultBaseValue: number;
  defaultValueSource: 'businessMetrics' | 'businessStats' | 'calculated';
  defaultValuePath?: string; // e.g., 'serviceRevenueMultiplier' for businessStats
  
  // Constraints
  constraints?: {
    min?: number;
    max?: number;
    roundToInt?: boolean;
  };
  
  // UI metadata
  adminLabel: string;
  adminHelperText?: string;
  unit?: string; // e.g., '%', 'seconds', 'multiplier'
  displayFormat?: 'number' | 'percentage' | 'currency' | 'multiplier';
  
  // Effect system
  canBeModifiedByEffects: boolean;
  effectTypes?: EffectType[]; // Which effect types are valid
  
  // Calculation metadata
  calculationOrder?: number; // For dependencies
  dependsOn?: GameMetric[]; // Other metrics this depends on
}

// Central registry - ALL metrics defined here
export const METRIC_REGISTRY: Record<GameMetric, MetricDefinition> = {
  [GameMetric.ServiceSpeedMultiplier]: {
    id: GameMetric.ServiceSpeedMultiplier,
    name: 'Service Speed Multiplier',
    description: 'Multiplier for how fast services are completed',
    category: 'service',
    defaultBaseValue: 1.0,
    defaultValueSource: 'calculated',
    constraints: { min: 0.1, max: 10 },
    adminLabel: 'Service Speed Multiplier',
    adminHelperText: '1.0 = normal speed, 2.0 = twice as fast',
    unit: 'multiplier',
    displayFormat: 'multiplier',
    canBeModifiedByEffects: true,
    effectTypes: [EffectType.Add, EffectType.Percent, EffectType.Multiply],
  },
  
  [GameMetric.ServiceRevenueMultiplier]: {
    id: GameMetric.ServiceRevenueMultiplier,
    name: 'Service Revenue Multiplier',
    description: 'Multiplier for service revenue',
    category: 'economy',
    defaultBaseValue: 1.0,
    defaultValueSource: 'businessStats',
    defaultValuePath: 'serviceRevenueMultiplier',
    constraints: { min: 0.1 },
    adminLabel: 'Service Revenue Multiplier',
    adminHelperText: 'Multiplies all service revenue',
    unit: 'multiplier',
    displayFormat: 'multiplier',
    canBeModifiedByEffects: true,
    effectTypes: [EffectType.Add, EffectType.Percent, EffectType.Multiply],
  },
  
  [GameMetric.SpawnIntervalSeconds]: {
    id: GameMetric.SpawnIntervalSeconds,
    name: 'Customer Spawn Interval',
    description: 'Seconds between customer spawns',
    category: 'gameplay',
    defaultBaseValue: 5.0,
    defaultValueSource: 'businessStats',
    defaultValuePath: 'spawnIntervalSeconds',
    constraints: { min: 0.5, max: 60, roundToInt: false },
    adminLabel: 'Spawn Interval (seconds)',
    adminHelperText: 'Lower = more customers',
    unit: 'seconds',
    displayFormat: 'number',
    canBeModifiedByEffects: true,
    effectTypes: [EffectType.Add, EffectType.Percent, EffectType.Multiply],
  },
  
  // ... all other metrics
};

// Helper functions
export function getAllMetrics(): MetricDefinition[] {
  return Object.values(METRIC_REGISTRY);
}

export function getMetricsByCategory(category: MetricDefinition['category']): MetricDefinition[] {
  return getAllMetrics().filter(m => m.category === category);
}

export function getMetricDefinition(metric: GameMetric): MetricDefinition {
  return METRIC_REGISTRY[metric];
}

export function getDefaultValue(metric: GameMetric, industryId: IndustryId): number {
  const def = METRIC_REGISTRY[metric];
  if (def.defaultValueSource === 'calculated') {
    return def.defaultBaseValue;
  }
  // Fetch from businessStats or businessMetrics based on defaultValuePath
  // Implementation details...
}
```

**Benefits:**
- ✅ Single place to see all metrics
- ✅ Easy to add new metrics (just add to registry)
- ✅ Consistent metadata (labels, units, constraints)
- ✅ Type-safe defaults
- ✅ Auto-generate admin UI options
- ✅ Clear documentation of what each metric does

### Implementation Strategy

**Phase 1: Create Registry (Non-Breaking)**
1. Create `lib/game/metrics/registry.ts` with all current metrics
2. Keep existing code working
3. Gradually migrate code to use registry

**Phase 2: Migrate Admin UI**
```typescript
// app/admin/utils/constants.ts
import { getAllMetrics } from '@/lib/game/metrics/registry';

// Auto-generate from registry instead of manual list
export const METRIC_OPTIONS = getAllMetrics()
  .filter(m => m.canBeModifiedByEffects)
  .map(m => ({
    value: m.id,
    label: m.adminLabel,
    helperText: m.adminHelperText,
    unit: m.unit,
  }));
```

**Phase 3: Migrate Calculation Logic**
```typescript
// lib/game/mechanics.ts
import { getMetricDefinition, getDefaultValue } from '@/lib/game/metrics/registry';

// Instead of hardcoded calculations:
const gameMetrics = {
  serviceSpeedMultiplier: effectManager.calculate(
    GameMetric.ServiceSpeedMultiplier,
    getDefaultValue(GameMetric.ServiceSpeedMultiplier, industryId)
  ),
  // ... etc
};

// Or even better, iterate over registry:
const gameMetrics = Object.fromEntries(
  getAllMetrics()
    .filter(m => m.canBeModifiedByEffects)
    .map(m => [
      m.id,
      effectManager.calculate(m.id, getDefaultValue(m.id, industryId))
    ])
) as Record<GameMetric, number>;
```

**Phase 4: Migrate Constraints**
```typescript
// lib/game/effectManager.ts
import { METRIC_REGISTRY } from '@/lib/game/metrics/registry';

// Replace hardcoded METRIC_CONSTRAINTS with registry
export const METRIC_CONSTRAINTS: Partial<Record<GameMetric, MetricConstraints>> = 
  Object.fromEntries(
    getAllMetrics()
      .filter(m => m.constraints)
      .map(m => [m.id, m.constraints!])
  );
```

---

## 2. Database Schema Management

### Current State Analysis

**Problems Identified:**

1. **Schema Changes Require Multiple Updates**
   - Database migration (SQL)
   - TypeScript types (`types.ts`)
   - Repository mapping functions (`*Repository.ts`)
   - Admin form components (`app/admin/components/*`)
   - Admin hooks (`app/admin/hooks/*`)
   - Game calculation logic (if it's a metric)

2. **Inconsistent Storage Patterns**
   - Some fields in JSONB (`business_metrics`, `business_stats`)
   - Some as separate columns (`map_width`, `map_height`, `entry_position`)
   - No clear rule for when to use which

3. **No Schema Definition in Code**
   - Schema exists only in database
   - No single source of truth for "what columns exist"
   - Type mismatches discovered at runtime

### Recommended Solution: Schema-First Approach

#### Option A: Schema Definition File (Recommended for Your Use Case)

Create a **schema definition** that drives both database and code:

```typescript
// lib/data/schema/definitions.ts

export interface TableSchema {
  tableName: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
}

export interface ColumnDefinition {
  name: string;
  dbName: string; // snake_case for DB
  type: 'string' | 'number' | 'boolean' | 'jsonb' | 'jsonb_array' | 'timestamp';
  nullable: boolean;
  defaultValue?: any;
  
  // TypeScript type info
  tsType: string; // e.g., 'string', 'number', 'BusinessMetrics', 'GridPosition[]'
  
  // UI metadata
  adminLabel?: string;
  adminHelperText?: string;
  adminInputType?: 'text' | 'number' | 'textarea' | 'json' | 'position' | 'array';
  adminRequired?: boolean;
  
  // Validation
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string; // true = valid, string = error message
  };
}

// Example: industry_simulation_config table
export const INDUSTRY_SIMULATION_CONFIG_SCHEMA: TableSchema = {
  tableName: 'industry_simulation_config',
  columns: [
    {
      name: 'id',
      dbName: 'id',
      type: 'string',
      nullable: false,
      tsType: 'string',
      adminLabel: 'ID',
      adminInputType: 'text',
      adminRequired: true,
    },
    {
      name: 'industryId',
      dbName: 'industry_id',
      type: 'string',
      nullable: false,
      tsType: 'IndustryId',
      adminLabel: 'Industry ID',
      adminInputType: 'text',
      adminRequired: true,
    },
    {
      name: 'businessMetrics',
      dbName: 'business_metrics',
      type: 'jsonb',
      nullable: true,
      tsType: 'BusinessMetrics | null',
      adminLabel: 'Business Metrics',
      adminInputType: 'json',
      adminHelperText: 'Override global business metrics',
    },
    {
      name: 'mapWidth',
      dbName: 'map_width',
      type: 'number',
      nullable: true,
      tsType: 'number | null',
      adminLabel: 'Map Width',
      adminInputType: 'number',
      validation: { min: 1, max: 100 },
    },
    {
      name: 'entryPosition',
      dbName: 'entry_position',
      type: 'jsonb',
      nullable: true,
      tsType: 'GridPosition | null',
      adminLabel: 'Entry Position',
      adminInputType: 'position',
    },
    // ... all columns
  ],
  indexes: [
    { columns: ['industry_id'], unique: true },
  ],
};

// Generate TypeScript types from schema
export type IndustrySimulationConfigRow = GenerateRowType<typeof INDUSTRY_SIMULATION_CONFIG_SCHEMA>;

// Helper to generate types (simplified)
type GenerateRowType<T extends TableSchema> = {
  [K in T['columns'][number] as K['name']]: 
    K['type'] extends 'jsonb' ? ParseJsonbType<K['tsType']> :
    K['type'] extends 'number' ? number :
    K['type'] extends 'boolean' ? boolean :
    K['type'] extends 'timestamp' ? Date :
    string;
} & { [K in T['columns'][number] as K['dbName']]: any }; // DB names too
```

**Benefits:**
- ✅ Single source of truth for schema
- ✅ Auto-generate TypeScript types
- ✅ Auto-generate admin forms
- ✅ Auto-generate repository mapping
- ✅ Validation rules in one place
- ✅ Easy to see all columns at a glance

#### Option B: Migration Helper System

Create a **migration helper** that tracks schema changes:

```typescript
// lib/data/schema/migrations.ts

export interface ColumnMigration {
  table: string;
  column: string;
  action: 'add' | 'remove' | 'modify';
  type?: string;
  nullable?: boolean;
  defaultValue?: any;
  migrationSQL: string; // The actual SQL
  rollbackSQL: string; // How to undo it
  codeChanges: {
    types: string[]; // Files that need type updates
    repositories: string[]; // Files that need mapping updates
    admin: string[]; // Files that need form updates
  };
}

// Example: Adding 'order' column
export const ADD_ORDER_COLUMN: ColumnMigration = {
  table: 'services',
  column: 'order',
  action: 'add',
  type: 'integer',
  nullable: true,
  defaultValue: null,
  migrationSQL: `
    ALTER TABLE services 
    ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT NULL;
  `,
  rollbackSQL: `
    ALTER TABLE services 
    DROP COLUMN IF EXISTS "order";
  `,
  codeChanges: {
    types: ['lib/game/types.ts'], // Add order?: number to IndustryServiceDefinition
    repositories: ['lib/data/serviceRepository.ts'], // Add order to select/map
    admin: ['app/admin/components/ServicesTab.tsx', 'app/admin/hooks/useServices.ts'],
  },
};

// Migration runner
export async function applyMigration(migration: ColumnMigration): Promise<void> {
  // 1. Run SQL migration
  await supabaseServer.rpc('exec_sql', { sql: migration.migrationSQL });
  
  // 2. Log what needs to be updated manually
  console.log('✅ Database migration applied');
  console.log('📝 Manual code changes needed:');
  console.log('   Types:', migration.codeChanges.types.join(', '));
  console.log('   Repositories:', migration.codeChanges.repositories.join(', '));
  console.log('   Admin:', migration.codeChanges.admin.join(', '));
  
  // 3. Optionally: Generate code snippets
  generateCodeSnippets(migration);
}
```

**Benefits:**
- ✅ Tracks what needs updating
- ✅ Provides SQL and rollback
- ✅ Documents code changes needed
- ✅ Can generate code snippets

### Recommended Hybrid Approach

**For Your Use Case:**

1. **Use Schema Definitions** for stable tables (like `services`, `upgrades`)
2. **Use JSONB** for frequently-changing config (like `business_metrics`, `business_stats`)
3. **Use Migration Helpers** for one-off schema changes
4. **Create a Schema Registry** to see all tables/columns in one place

```typescript
// lib/data/schema/registry.ts

export const SCHEMA_REGISTRY = {
  services: SERVICES_SCHEMA,
  upgrades: UPGRADES_SCHEMA,
  industry_simulation_config: INDUSTRY_SIMULATION_CONFIG_SCHEMA,
  // ... all tables
};

// Helper to see all columns for a table
export function getTableColumns(tableName: string): ColumnDefinition[] {
  return SCHEMA_REGISTRY[tableName]?.columns || [];
}

// Helper to see what needs updating when adding a column
export function getAffectedFiles(tableName: string, columnName: string): string[] {
  const table = SCHEMA_REGISTRY[tableName];
  const column = table?.columns.find(c => c.name === columnName);
  if (!column) return [];
  
  return [
    `lib/game/types.ts`, // Type definition
    `lib/data/${tableName}Repository.ts`, // Repository mapping
    `app/admin/components/${tableName}Tab.tsx`, // Admin form
    `app/admin/hooks/use${tableName}.ts`, // Admin hook
  ];
}
```

---

## 3. Parameter Organization & Consistency

### Current State Analysis

**Problems:**

1. **Parameters Scattered Across Multiple Places**
   - `BusinessMetrics` (starting values)
   - `BusinessStats` (runtime values)
   - `BaseUpgradeMetrics` (upgrade base values)
   - Hardcoded in calculations
   - In database JSONB columns

2. **No Clear Grouping**
   - Economic parameters mixed with gameplay parameters
   - No visual organization
   - Hard to find related parameters

3. **Inconsistent Naming**
   - `serviceSpeedMultiplier` vs `service_speed_multiplier`
   - `startingCash` vs `starting_cash`
   - Mix of camelCase and snake_case

### Recommended Solution: Parameter Groups

Organize parameters into **logical groups** with clear documentation:

```typescript
// lib/game/parameters/groups.ts

export interface ParameterGroup {
  id: string;
  name: string;
  description: string;
  category: 'starting' | 'runtime' | 'calculated' | 'ui';
  parameters: GameMetric[];
  storage: 'businessMetrics' | 'businessStats' | 'calculated' | 'uiConfig';
}

export const PARAMETER_GROUPS: ParameterGroup[] = [
  {
    id: 'starting-economy',
    name: 'Starting Economy',
    description: 'Initial economic values when game starts',
    category: 'starting',
    storage: 'businessMetrics',
    parameters: [
      GameMetric.Cash, // startingCash
      GameMetric.Time, // startingTime
      GameMetric.Exp, // startingExp
      GameMetric.FreedomScore, // startingFreedomScore
      GameMetric.MonthlyExpenses, // monthlyExpenses (base)
    ],
  },
  {
    id: 'service-performance',
    name: 'Service Performance',
    description: 'How services behave (speed, capacity, revenue)',
    category: 'runtime',
    storage: 'businessStats',
    parameters: [
      GameMetric.ServiceSpeedMultiplier,
      GameMetric.ServiceCapacity,
      GameMetric.ServiceRevenueMultiplier,
      GameMetric.ServiceRevenueFlatBonus,
      GameMetric.ServiceRevenueScale,
    ],
  },
  {
    id: 'customer-spawning',
    name: 'Customer Spawning',
    description: 'How customers appear and behave',
    category: 'runtime',
    storage: 'businessStats',
    parameters: [
      GameMetric.SpawnIntervalSeconds,
      // customerPatienceSeconds (not a metric, but related)
      // customerSpawnPosition (not a metric, but related)
    ],
  },
  {
    id: 'tier-modifiers',
    name: 'Service Tier Modifiers',
    description: 'Modifiers for different service tiers',
    category: 'runtime',
    storage: 'businessStats',
    parameters: [
      GameMetric.HighTierServiceRevenueMultiplier,
      GameMetric.HighTierServiceWeightageMultiplier,
      GameMetric.MidTierServiceRevenueMultiplier,
      GameMetric.MidTierServiceWeightageMultiplier,
      GameMetric.LowTierServiceRevenueMultiplier,
      GameMetric.LowTierServiceWeightageMultiplier,
    ],
  },
  // ... more groups
];

// Helper to get all parameters in a group
export function getParametersInGroup(groupId: string): GameMetric[] {
  const group = PARAMETER_GROUPS.find(g => g.id === groupId);
  return group?.parameters || [];
}

// Helper to see all parameters organized by group
export function getAllParametersByGroup(): Record<string, GameMetric[]> {
  return Object.fromEntries(
    PARAMETER_GROUPS.map(g => [g.id, g.parameters])
  );
}
```

**Create a Parameters Dashboard:**

```typescript
// app/admin/components/ParametersDashboard.tsx

export function ParametersDashboard() {
  return (
    <div>
      <h1>Game Parameters Overview</h1>
      {PARAMETER_GROUPS.map(group => (
        <ParameterGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

function ParameterGroupCard({ group }: { group: ParameterGroup }) {
  const metrics = getParametersInGroup(group.id);
  const currentValues = useCurrentParameterValues(metrics);
  
  return (
    <Card>
      <h2>{group.name}</h2>
      <p>{group.description}</p>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Current Value</th>
            <th>Default</th>
            <th>Storage</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => {
            const def = getMetricDefinition(metric);
            return (
              <tr key={metric}>
                <td>{def.adminLabel}</td>
                <td>{currentValues[metric]}</td>
                <td>{def.defaultBaseValue}</td>
                <td>{group.storage}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
```

**Benefits:**
- ✅ See all parameters organized logically
- ✅ Understand relationships between parameters
- ✅ Easy to find where parameters are stored
- ✅ Clear documentation of what each group does

---

## 4. Database Schema Change Workflow

### Current Problem

Adding a column like `order` requires:
1. SQL migration
2. Update TypeScript types
3. Update repository select/map functions
4. Update admin form
5. Update admin hooks
6. Update game logic (if it's used)
7. Update tests
8. Update seeds

### Recommended Solution: Schema Change Checklist Generator

Create a **checklist generator** that tells you exactly what to update:

```typescript
// lib/data/schema/changeHelper.ts

export interface SchemaChange {
  table: string;
  column: string;
  action: 'add' | 'remove' | 'modify';
  type?: 'string' | 'number' | 'boolean' | 'jsonb';
  nullable?: boolean;
}

export function generateChangeChecklist(change: SchemaChange): {
  sql: string;
  filesToUpdate: Array<{
    file: string;
    changes: string[];
    codeSnippet?: string;
  }>;
} {
  const table = SCHEMA_REGISTRY[change.table];
  const columnDef = table?.columns.find(c => c.name === change.column);
  
  const filesToUpdate: Array<{ file: string; changes: string[] }> = [];
  
  // 1. SQL Migration
  const sql = change.action === 'add'
    ? `ALTER TABLE ${change.table} ADD COLUMN ${change.column} ${change.type}${change.nullable ? '' : ' NOT NULL'};`
    : change.action === 'remove'
    ? `ALTER TABLE ${change.table} DROP COLUMN ${change.column};`
    : `ALTER TABLE ${change.table} ALTER COLUMN ${change.column} TYPE ${change.type};`;
  
  // 2. TypeScript Types
  filesToUpdate.push({
    file: `lib/game/types.ts`,
    changes: [
      change.action === 'add' 
        ? `Add ${change.column}?: ${change.type} to interface`
        : change.action === 'remove'
        ? `Remove ${change.column} from interface`
        : `Update ${change.column} type to ${change.type}`,
    ],
    codeSnippet: change.action === 'add'
      ? `${change.column}?: ${change.type}${change.nullable ? ' | null' : ''};`
      : undefined,
  });
  
  // 3. Repository
  filesToUpdate.push({
    file: `lib/data/${change.table}Repository.ts`,
    changes: [
      `Add ${change.column} to select() query`,
      `Add ${change.column} to mapRowToEntity() function`,
      change.action !== 'remove' ? `Add ${change.column} to upsert payload` : 'Remove from upsert',
    ],
  });
  
  // 4. Admin Hook
  filesToUpdate.push({
    file: `app/admin/hooks/use${capitalize(change.table)}.ts`,
    changes: [
      change.action === 'add'
        ? `Add ${change.column} to form state`
        : `Remove ${change.column} from form state`,
      change.action === 'add'
        ? `Add ${change.column} to save handler`
        : `Remove ${change.column} from save handler`,
    ],
  });
  
  // 5. Admin Component
  filesToUpdate.push({
    file: `app/admin/components/${capitalize(change.table)}Tab.tsx`,
    changes: [
      change.action === 'add'
        ? `Add form field for ${change.column}`
        : `Remove form field for ${change.column}`,
    ],
  });
  
  return { sql, filesToUpdate };
}

// Usage:
const checklist = generateChangeChecklist({
  table: 'services',
  column: 'order',
  action: 'add',
  type: 'number',
  nullable: true,
});

console.log('SQL:', checklist.sql);
console.log('Files to update:', checklist.filesToUpdate);
```

**Create a CLI tool:**

```bash
# scripts/schema-change.ts
npm run schema:add-column services order number --nullable
# Outputs:
# ✅ SQL Migration:
#    ALTER TABLE services ADD COLUMN "order" INTEGER DEFAULT NULL;
#
# 📝 Files to update:
#    1. lib/game/types.ts
#       - Add order?: number | null to IndustryServiceDefinition
#    2. lib/data/serviceRepository.ts
#       - Add order to select() query
#       - Add order to mapRowToService()
#    3. app/admin/hooks/useServices.ts
#       - Add order to form state
#    4. app/admin/components/ServicesTab.tsx
#       - Add order input field
```

---

## 5. General Scalability Recommendations

### 5.1 Repository Pattern Improvements

**Current:** Each repository has similar but duplicated code.

**Recommended:** Base repository class with common functionality:

```typescript
// lib/data/base/BaseRepository.ts

export abstract class BaseRepository<TEntity, TRow> {
  protected abstract tableName: string;
  protected abstract mapRowToEntity(row: TRow): TEntity;
  protected abstract mapEntityToRow(entity: TEntity): Partial<TRow>;
  
  async fetchForIndustry(industryId: IndustryId): Promise<TEntity[] | null> {
    if (!supabaseServer) return null;
    
    const { data, error } = await supabaseServer
      .from(this.tableName)
      .select(this.getSelectColumns())
      .eq('industry_id', industryId);
    
    if (error) {
      this.handleError('fetch', error);
      return null;
    }
    
    return data?.map(this.mapRowToEntity) ?? [];
  }
  
  async upsert(entity: TEntity): Promise<{ success: boolean; message?: string }> {
    // Common upsert logic
  }
  
  protected abstract getSelectColumns(): string;
  protected abstract handleError(operation: string, error: any): void;
}

// Usage:
class ServiceRepository extends BaseRepository<IndustryServiceDefinition, ServiceRow> {
  protected tableName = 'services';
  protected getSelectColumns() {
    return 'id, industry_id, name, duration, price, tier, exp_gained, requirements, pricing_category, weightage, required_staff_role_ids, time_cost';
  }
  // ... implement abstract methods
}
```

**Benefits:**
- ✅ Less duplication
- ✅ Consistent error handling
- ✅ Easier to add common features (caching, logging)

### 5.2 Admin Form Generation

**Current:** Manual form components for each entity.

**Recommended:** Schema-driven form generation:

```typescript
// app/admin/components/SchemaForm.tsx

export function SchemaForm<T>({
  schema,
  data,
  onChange,
}: {
  schema: TableSchema;
  data: Partial<T>;
  onChange: (data: Partial<T>) => void;
}) {
  return (
    <form>
      {schema.columns.map(column => (
        <FormField
          key={column.name}
          column={column}
          value={data[column.name]}
          onChange={(value) => onChange({ ...data, [column.name]: value })}
        />
      ))}
    </form>
  );
}

function FormField({ column, value, onChange }: FormFieldProps) {
  switch (column.adminInputType) {
    case 'text':
      return <input type="text" value={value} onChange={e => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} />;
    case 'json':
      return <JsonEditor value={value} onChange={onChange} />;
    case 'position':
      return <PositionPicker value={value} onChange={onChange} />;
    // ... etc
  }
}
```

**Benefits:**
- ✅ Add new fields without writing form code
- ✅ Consistent form styling
- ✅ Automatic validation

### 5.3 Type Generation from Database

**Current:** Manual TypeScript types that can drift from database.

**Recommended:** Generate types from database schema:

```typescript
// scripts/generate-types.ts

// Use Supabase CLI or pg-meta to introspect database
// Generate TypeScript types automatically

// Run: npm run generate:types
// Outputs: lib/game/types.generated.ts
```

**Benefits:**
- ✅ Types always match database
- ✅ Catch type mismatches early
- ✅ Less manual maintenance

### 5.4 Testing Infrastructure

**Current:** Manual testing of schema changes.

**Recommended:** Schema change tests:

```typescript
// tests/schema.test.ts

describe('Schema Consistency', () => {
  it('should have matching types and database columns', () => {
    // Check that all TypeScript interfaces match database columns
  });
  
  it('should have repository mapping for all columns', () => {
    // Check that repositories map all columns
  });
  
  it('should have admin forms for all editable columns', () => {
    // Check that admin forms include all columns
  });
});
```

---

## 6. Current Status & Next Steps

### ✅ Completed Phases

**Phase 0: Unified Config Table** - ✅ **COMPLETE**
- ✅ Migration created and executed (`006_create_unified_simulation_config.sql`)
- ✅ Unified table exists and is being used
- ✅ Old table references cleaned up (error messages, comments updated)
- ✅ Old repository marked as deprecated
- ✅ Migration to drop old tables created (`009_drop_old_simulation_config_tables.sql`)

**Phase 1: Metric Registry** - ✅ **COMPLETE**
- Registry created with all metrics
- Database integration complete
- All UI components migrated
- Database-driven display configs working

**Phase 2: HUD & Display Updates** - ✅ **COMPLETE**
- ✅ FreedomScore → LeveragedTime (display name updated in registry)
- ✅ ConversionRate on HUD (registry shows `showOnHUD: true`, priority 5)
- ✅ Industry-specific HUD configuration (via database `metric_display_config` table)
- ✅ SpawnInterval → CustomersPerMonth display transformation
  - Helper functions added to registry (`calculateCustomersPerMonth`, `formatCustomersPerMonth`)
  - GameCanvas updated to show "Customers per month" instead of "Spawn interval"
  - Admin panels show calculated Customers Per Month below spawn interval input

### ❌ Remaining Phases

**Phase 3: Schema Management** - ❌ **NOT STARTED**
- Schema definitions
- Code generation
- Change checklists

**Phase 4: Advanced Features** - ❌ **NOT STARTED**
- Base repository classes
- Testing infrastructure
- Parameter organization

---

## 6. Updated Implementation Priority

### Phase 0: Unified Config Table (Highest Priority - 1-2 weeks)
**Goal:** Remove massive duplication from global/industry config split

**Steps:**
1. **Create migration script** (non-breaking)
   - Copy data from `global_simulation_config` and `industry_simulation_config`
   - Create new `simulation_config` table with `industry_id` column

2. **Create unified repository**
   - Single `fetchSimulationConfig(industryId)` function
   - Add `getMergedSimulationConfig(industryId)` helper

3. **Update code**
   - Change `config.ts` to use unified fetching
   - Merge admin hooks (`useGlobalConfig` + `useIndustrySimulationConfig` → `useSimulationConfig`)

4. **Test & cleanup**
   - Verify all data migrated correctly
   - Drop old tables after verification

**Benefits:** 70% less code, 3 places to update instead of 9

---

### Phase 1: Metric Registry Foundation (2-3 weeks)
**Goal:** Create centralized metric definitions

**Steps:**
1. **Create `lib/game/metrics/registry.ts`**
   - Define `MetricDefinition` interface with display metadata
   - Add all current metrics with proper categorization

2. **Add new metrics**
   - `ConversionRate` (show on HUD)
   - Rename `FreedomScore` display to "LeveragedTime"
   - Treat `ServiceRevenueFlatBonus` as regular metric

3. **Keep existing code working**
   - Registry is just new file, doesn't break anything

**Benefits:** Single source of truth, easy to add new metrics

---

### Phase 2: HUD & Display Updates (1-2 weeks)
**Goal:** Make HUD industry-specific and add new metrics

**Changes:**
1. **HUD becomes configurable**
   - Store `hudMetrics: string[]` in `simulation_config`
   - HUD component reads from config instead of hardcoded list

2. **Add ConversionRate to HUD**
   - Update registry to show on HUD
   - Add to default HUD config

3. **FreedomScore → LeveragedTime**
   - Update registry display name
   - Update UI labels

4. **SpawnInterval → CustomersPerMonth**
   - Change calculation: `customersPerMonth = monthDurationSeconds / spawnIntervalSeconds`
   - Update display logic

**Benefits:** Industry-specific HUD, new metrics visible to players

---

### Phase 3: Migrate to Registry (2-3 weeks)
**Goal:** Use registry throughout codebase

**Steps:**
1. **Migrate HUD** (`KeyMetrics.tsx`)
   - Generate metrics list from registry
   - Support industry-specific HUD config

2. **Migrate Details Panel** (`HomeTab.tsx`)
   - Show primary metrics + buffs/modifiers
   - Use registry for organization

3. **Migrate Admin UI**
   - Auto-generate `METRIC_OPTIONS` from registry
   - Update forms to use registry metadata

4. **Migrate Calculations** (`mechanics.ts`)
   - Use registry for default values
   - Auto-generate metric calculations

**Benefits:** All display logic driven by registry

---

### Phase 4: Schema Management & Code Generation (2-3 weeks)
**Goal:** Auto-generate code from schema definitions

**Steps:**
1. **Create schema definitions**
   - Define all tables/columns in code
   - Include admin metadata

2. **Add code generation**
   - Auto-generate TypeScript types
   - Auto-generate admin forms
   - Create schema change checklists

3. **Migrate to generated forms**
   - Replace manual admin components with generated ones

**Benefits:** Add new fields with minimal code changes

---

### Phase 5: Advanced Features & Cleanup (Ongoing)
- Repository base classes
- Testing infrastructure
- Documentation updates

---

## 7. Specific HUD & Metric Changes

### Current HUD Metrics
- **Cash** (always shown)
- **EXP** (shown as Level, always shown)
- **Time** (shown only if `startingTime > 0`)
- **FreedomScore** (shown as "Freedom Score", always shown)

### Planned Changes

#### 1. Add ConversionRate to HUD
```typescript
// In registry
[GameMetric.ConversionRate]: {
  display: {
    showOnHUD: true,  // NEW: Show on HUD
    category: 'primary',
    priority: 4,
  }
}
```

#### 2. FreedomScore → LeveragedTime
```typescript
[GameMetric.FreedomScore]: {
  name: 'Leveraged Time',  // Changed display name
  display: {
    showOnHUD: true,
    category: 'primary',
    priority: 3,
  }
}
```

#### 3. ServiceRevenueFlatBonus as Regular Metric
```typescript
[GameMetric.ServiceRevenueFlatBonus]: {
  nature: 'modifier',  // TREATED AS REGULAR METRIC, not special 'buff'
  display: {
    showOnHUD: false,
    showInDetails: true,
    category: 'modifier',
  }
}
```

#### 4. SpawnInterval → CustomersPerMonth
**Current:** `spawnIntervalSeconds` (time between spawns)
**New:** Display as `customersPerMonth` (total customers per month)

**Calculation change:**
```typescript
// Current: spawnIntervalSeconds = 5 (seconds between customers)
// New: customersPerMonth = monthDurationSeconds / spawnIntervalSeconds
// Example: 300 seconds/month ÷ 5 seconds/customer = 60 customers/month
```

#### 5. Industry-Specific HUD Configuration
**Store in `simulation_config`:**
```json
{
  "industry_id": "freelance",
  "hudMetrics": ["cash", "exp", "time", "conversionRate"],
  "detailMetrics": ["serviceRevenueMultiplier", "serviceRevenueFlatBonus"]
}
```

**HUD Component Changes:**
```typescript
// Before: Hardcoded
const metricsData = [
  { key: 'cash', ... },
  { key: 'exp', ... },
  // ...
];

// After: From config + registry
const hudMetricIds = getHUDMetricsForIndustry(industryId); // ['cash', 'exp', 'time', 'conversionRate']
const metricsData = hudMetricIds.map(id => {
  const def = getMetricDefinition(id);
  return {
    key: id,
    label: def.name,
    // ... generate from registry
  };
});
```

### Config Visibility Strategy

**Future-proof approach:**
```typescript
display: {
  showOnHUD: boolean,
  showInDetails: boolean,
  showInAdmin: boolean,
  showToPlayers: boolean,  // NEW: For future player visibility
  debugOnly: boolean,      // NEW: Hide from players
}
```

**Current strategy:**
- HUD: Primary metrics only (Cash, EXP, Time, LeveragedTime, ConversionRate)
- Details: Primary + modifiers/buffs (ServiceRevenueMultiplier, ServiceRevenueFlatBonus)
- Admin: Everything
- Config values (SpawnIntervalSeconds): Admin only for now

---

## 8. Example: Adding a New Metric

### Before (Current Process)

1. Add to `GameMetric` enum
2. Add to `BusinessStats` interface
3. Add to admin `METRIC_OPTIONS`
4. Add calculation in `mechanics.ts`
5. Add display in `GameCanvas.tsx`
6. Update database (if needed)
7. Update repository mapping
8. Update admin form

**Time:** ~2-3 hours, multiple files

### After (With Registry)

1. Add to `METRIC_REGISTRY`:
```typescript
[GameMetric.NewMetric]: {
  id: GameMetric.NewMetric,
  name: 'New Metric',
  // ... all metadata
}
```

2. Run code generator (if needed):
```bash
npm run generate:admin-options
npm run generate:calculations
```

**Time:** ~15 minutes, 1 file

---

## 8. Summary

### Key Improvements

1. **Metrics Registry** - Single source of truth for all metrics
2. **Schema Definitions** - Single source of truth for database schema
3. **Parameter Groups** - Organized, documented parameter structure
4. **Change Checklists** - Clear workflow for schema changes
5. **Code Generation** - Reduce manual updates

### Expected Benefits

- ✅ **50-70% reduction** in time to add new metrics
- ✅ **80% reduction** in schema change errors
- ✅ **Single place** to see all parameters
- ✅ **Consistent** patterns across codebase
- ✅ **Easier onboarding** for new developers

---

## 9. Complete Implementation Summary

### Updated Priorities (After Our Discussion)

**Phase 0: Unified Config Table (Start Here - Highest Impact)**
- Problem: 9 places to update for every new field
- Solution: Single `simulation_config` table with `industry_id`
- Time: 1-2 weeks
- Impact: 70% less code, eliminates duplication

**Phase 1: Metric Registry Foundation**
- Problem: Metrics scattered, HUD hardcoded
- Solution: Centralized registry with display metadata
- Time: 2-3 weeks
- Impact: Single source of truth, easy to add metrics

**Phase 2: HUD & Display Updates**
- Changes: Add ConversionRate, LeveragedTime, industry-specific HUD
- Time: 1-2 weeks
- Impact: New metrics visible to players

**Phase 3: Migrate to Registry**
- Migrate HUD, details, admin, calculations to use registry
- Time: 2-3 weeks
- Impact: All display logic centralized

**Phase 4: Schema Management**
- Auto-generate code from schema definitions
- Time: 2-3 weeks
- Impact: Minimal manual updates for schema changes

### Key Architectural Decisions

#### Unified Config Table
- ✅ **Single table** `simulation_config` with `industry_id` column
- ✅ `industry_id = 'global'` for defaults
- ✅ `industry_id = 'freelance'` for overrides
- ✅ **Merge at fetch time:** industry overrides global

#### Metric Registry Structure
```typescript
interface MetricDefinition {
  // WHAT IT IS
  nature: 'direct' | 'modifier' | 'buff' | 'config';

  // WHERE IT COMES FROM
  source: {
    type: 'starting' | 'config' | 'calculated';
    path?: string; // e.g., 'startingCash', 'serviceRevenueMultiplier'
  };

  // WHERE IT'S DISPLAYED
  display: {
    showOnHUD: boolean;
    showInDetails: boolean;
    showInAdmin: boolean;
    category: 'primary' | 'modifier' | 'config';
    priority: number;
  };
}
```

#### HUD Changes
- **Current:** Cash, EXP, Time, FreedomScore (hardcoded)
- **New:** Configurable per industry, includes ConversionRate
- **FreedomScore → LeveragedTime** (better name)
- **ServiceRevenueFlatBonus:** Treated as regular metric, not special "buff"

#### Config Visibility
- **HUD:** Primary metrics only (Cash, EXP, Time, LeveragedTime, ConversionRate)
- **Details:** Primary + modifiers (ServiceRevenueMultiplier, ServiceRevenueFlatBonus)
- **Admin:** Everything
- **Future:** `showToPlayers` flag for flexible visibility

### Implementation Sequence

#### Week 1-2: Unified Config Table
1. Create migration (copy data from both tables to new unified table)
2. Create unified repository
3. Update code to use new table
4. Test thoroughly, drop old tables

#### Week 3-4: Metric Registry + HUD Updates
1. Create registry with all metrics + new ones
2. Add ConversionRate to HUD, rename FreedomScore
3. Make HUD configurable per industry
4. Implement CustomersPerMonth calculation

#### Week 5-7: Migrate Everything to Registry
1. HUD uses registry
2. Details panel uses registry
3. Admin UI auto-generates from registry
4. Calculations use registry defaults

#### Week 8+: Schema Management & Cleanup
1. Schema definitions + code generation
2. Repository base classes
3. Testing infrastructure

### Expected Outcomes

#### For Adding New Metrics
**Before:** 8+ files, 30+ lines of code
**After:** 1 file, 10 lines of code

#### For Schema Changes
**Before:** 9 places to update manually
**After:** 3 places (table + repository + registry)

#### For HUD Changes
**Before:** Hardcoded, can't change per industry
**After:** Configurable per industry, easy to modify

### Next Steps

1. **Start with Phase 0** (unified config table) - highest impact, removes duplication
2. **Implement one phase at a time** in separate conversations
3. **Test each phase thoroughly** before moving to next
4. **Can stop at any phase** - each delivers value independently

**Ready to begin with Phase 0: Unified Config Table?** This will immediately reduce complexity and make all future changes easier.
