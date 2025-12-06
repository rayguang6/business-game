# Metric Registry: Database vs Code Analysis

## Current State

The metric registry is currently **code-only** - all definitions live in `lib/game/metrics/registry.ts`.

## Question: Should We Move to Database?

**Short Answer**: **Hybrid approach** - Keep core logic in code, move presentation/config to database.

## Analysis

### ✅ Keep in Code (Core Logic)

These are tied to game logic and TypeScript types:

1. **Metric IDs** (`GameMetric` enum)
   - Part of code logic (used in effect system, calculations)
   - Type-safe references
   - **Reason**: Can't change at runtime, part of game mechanics

2. **Default Value Sources & Paths**
   - `defaultValueSource`: 'businessMetrics' | 'businessStats' | 'calculated'
   - `defaultValuePath`: 'startingCash', 'serviceRevenueMultiplier', etc.
   - **Reason**: References TypeScript interfaces (`BusinessMetrics`, `BusinessStats`)

3. **Constraints** (min, max, roundToInt)
   - Validation rules tied to game logic
   - **Reason**: Business rules that shouldn't change without code review

4. **canBeModifiedByEffects**
   - Game logic rule (can upgrades/marketing modify this?)
   - **Reason**: Part of game mechanics, not presentation

### 🎨 Move to Database (Presentation & Config)

These are presentation/configuration that could vary per industry:

1. **Display Labels** (`displayLabel`)
   - **Current**: "Leveraged Time" for FreedomScore
   - **Why DB**: Could customize per industry (e.g., "Work Hours" for one industry, "Leveraged Time" for another)
   - **Example**: Freelance industry might call it "Client Hours" vs Dental calls it "Chair Time"

2. **Descriptions**
   - **Why DB**: Could customize per industry for better context
   - **Example**: "Monthly leveraged time requirement" vs "Hours you must work per month"

3. **Display Flags** (`showOnHUD`, `showInDetails`, `showInAdmin`)
   - **Why DB**: **CRITICAL** - Different industries should show different metrics on HUD
   - **Example**: Restaurant might show "Service Speed" on HUD, but Dental doesn't
   - **Phase 2 Requirement**: Industry-specific HUD configuration

4. **Priority/Order**
   - **Why DB**: Different industries might want different metric ordering
   - **Example**: Some industries prioritize Time over Cash, others vice versa

5. **Units**
   - **Why DB**: Could customize formatting per industry
   - **Example**: Some industries use "hrs" vs "h" vs "hours"

6. **Icons/Images** (not currently in registry, but should be)
   - **Why DB**: Definitely should be in database
   - **Example**: Different industries might want different icons for the same metric

## Recommended Hybrid Approach

### Code Registry (Core)
```typescript
interface MetricDefinition {
  id: GameMetric;
  defaultValueSource: DefaultValueSource;
  defaultValuePath?: string;
  calculatedDefaultValue?: number;
  constraints?: { min?: number; max?: number; roundToInt?: boolean };
  canBeModifiedByEffects: boolean;
}
```

### Database Table: `metric_display_config`
```sql
CREATE TABLE metric_display_config (
  id TEXT PRIMARY KEY,
  industry_id TEXT,  -- NULL = global default
  metric_id TEXT NOT NULL,  -- References GameMetric enum
  
  -- Presentation
  display_label TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  icon_path TEXT,
  
  -- Visibility
  show_on_hud BOOLEAN DEFAULT false,
  show_in_details BOOLEAN DEFAULT false,
  show_in_admin BOOLEAN DEFAULT true,
  
  -- Ordering
  hud_priority INTEGER,
  details_priority INTEGER,
  
  -- Constraints
  FOREIGN KEY (industry_id) REFERENCES industries(id)
);

-- Index for fast lookups
CREATE INDEX idx_metric_display_industry ON metric_display_config(industry_id, metric_id);
```

### Merged Lookup Function
```typescript
function getMetricDisplayConfig(
  metric: GameMetric, 
  industryId: IndustryId
): MetricDisplayConfig {
  // 1. Get core definition from code registry
  const core = METRIC_REGISTRY[metric];
  
  // 2. Get display config from database (industry-specific, fallback to global)
  const display = getDisplayConfigFromDB(metric, industryId);
  
  // 3. Merge: code provides defaults, DB overrides
  return {
    ...core,
    displayLabel: display?.displayLabel ?? core.displayLabel,
    description: display?.description ?? core.description,
    display: {
      showOnHUD: display?.showOnHUD ?? core.display.showOnHUD,
      showInDetails: display?.showInDetails ?? core.display.showInDetails,
      showInAdmin: display?.showInAdmin ?? core.display.showInAdmin,
      priority: display?.hudPriority ?? core.display.priority,
      unit: display?.unit ?? core.display.unit,
    },
    icon: display?.iconPath,
  };
}
```

## Benefits of Hybrid Approach

### ✅ Advantages

1. **Type Safety**: Core logic stays in TypeScript (type-checked)
2. **Flexibility**: Presentation can vary per industry
3. **Performance**: Core registry is fast (no DB lookup for game logic)
4. **Maintainability**: Clear separation of concerns
5. **Phase 2 Ready**: Enables industry-specific HUD configuration
6. **Easy Migration**: Can start with code-only, migrate display to DB later

### ⚠️ Considerations

1. **Complexity**: Two sources of truth (code + DB)
   - **Mitigation**: Clear merge function, code provides defaults

2. **Caching**: Need to cache DB lookups
   - **Mitigation**: Load all display configs on startup, cache in memory

3. **Migration Path**: How to migrate existing code-only registry?
   - **Solution**: 
     1. Create `metric_display_config` table
     2. Seed with current registry values (industry_id = NULL = global)
     3. Update lookup function to merge code + DB
     4. Gradually move industry-specific overrides to DB

## Implementation Phases

### Phase 1: Current (Code-Only) ✅
- All definitions in code
- Simple, fast, type-safe
- Works for single industry or global defaults

### Phase 2: Add Database Table (Hybrid)
- Create `metric_display_config` table
- Seed with current registry values
- Update lookup to merge code + DB
- Keep code registry as source of truth for core logic

### Phase 3: Industry-Specific Overrides
- Allow industries to override display config
- Admin UI to edit display labels, visibility, priority
- HUD becomes fully configurable per industry

## Recommendation

**Start with code-only (current state)**, then **gradually move presentation to database**:

1. **Now (Phase 1)**: Keep everything in code - it's working, simple, fast
2. **Phase 2**: Add database table for display config, seed with current values
3. **Phase 3**: Add admin UI to customize display per industry
4. **Future**: Consider moving more to DB if needed (but keep core logic in code)

## What to Move First?

If we do move to database, prioritize:

1. **Display Flags** (`showOnHUD`, `showInDetails`) - **HIGHEST PRIORITY**
   - Enables industry-specific HUD (Phase 2 requirement)
   
2. **Priority/Order** - **HIGH PRIORITY**
   - Different industries want different metric ordering
   
3. **Display Labels** - **MEDIUM PRIORITY**
   - Nice to have, but not critical
   
4. **Icons** - **MEDIUM PRIORITY**
   - Not in registry yet, but should be in DB when added
   
5. **Descriptions** - **LOW PRIORITY**
   - Nice to customize, but not essential

## Conclusion

**Keep core logic in code, move presentation to database when needed.**

The current code-only approach is fine for now. When we need industry-specific HUD configuration (Phase 2), we can add the database table and merge function without breaking existing code.
