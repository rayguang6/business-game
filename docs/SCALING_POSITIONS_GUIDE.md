# Scaling Guide: Adding New Position Types

## Current Structure

We currently have **4 position types** stored as separate columns:
- `entry_position` - Single position (where customers enter)
- `waiting_positions` - Array of positions (where customers wait)
- `service_rooms` - Array of room configs (customer + staff positions)
- `staff_positions` - Array of positions (where staff idle/standby)

## Decision Framework: When to Add Columns vs Use JSONB

### ✅ **Use Separate Columns** (Current Approach)
**For: Core, frequently-used, game-critical positions**

**Criteria:**
- ✅ Used in every industry
- ✅ Queried/filtered frequently
- ✅ Core game mechanics depend on it
- ✅ Needs type safety and validation
- ✅ Admin UI has dedicated editor for it

**Examples:**
- Entry position (always needed)
- Waiting positions (always needed)
- Service rooms (core mechanic)
- Staff positions (core mechanic)

### ⚠️ **Use JSONB Column** (Extensible Approach)
**For: Optional, industry-specific, or experimental positions**

**Criteria:**
- ⚠️ Only used by some industries
- ⚠️ Experimental/new features
- ⚠️ Rarely queried individually
- ⚠️ May change structure frequently
- ⚠️ Admin UI can use generic JSON editor

**Examples:**
- Equipment positions (only some industries)
- Storage positions (only some industries)
- Checkout positions (only retail industries)
- Special feature positions (experimental)

## Recommended Approach: Hybrid Pattern

### Pattern 1: Core Positions (Separate Columns) + Extended Positions (JSONB)

```sql
-- Core positions (separate columns - current)
entry_position JSONB
waiting_positions JSONB
service_rooms JSONB
staff_positions JSONB

-- Extended positions (single JSONB column for flexibility)
extended_positions JSONB
-- Structure: {
--   "equipmentPositions": [...],
--   "storagePositions": [...],
--   "checkoutPositions": [...],
--   "customPositions": {...}  // For future extensibility
-- }
```

**Benefits:**
- ✅ Core positions remain queryable and type-safe
- ✅ Extended positions allow flexibility without schema changes
- ✅ Can migrate extended → core when feature stabilizes
- ✅ No table bloat for experimental features

### Pattern 2: Normalized Positions Table (For Complex Scaling)

If you need to support **many position types** with **complex relationships**, consider:

```sql
CREATE TABLE simulation_positions (
  id SERIAL PRIMARY KEY,
  config_id TEXT NOT NULL,  -- References industry_simulation_config.id
  config_type TEXT NOT NULL, -- 'industry' or 'global'
  position_type TEXT NOT NULL, -- 'entry', 'waiting', 'service_room', 'staff', 'equipment', etc.
  room_id INTEGER,  -- For service rooms
  position_role TEXT,  -- 'customer' or 'staff' for service rooms
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  facing_direction TEXT,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  anchor TEXT,
  metadata JSONB,  -- For any additional properties
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(config_id, config_type, position_type, room_id, position_role, x, y)
);

-- Indexes for fast queries
CREATE INDEX idx_positions_config ON simulation_positions(config_id, config_type);
CREATE INDEX idx_positions_type ON simulation_positions(position_type);
```

**Benefits:**
- ✅ Unlimited position types without schema changes
- ✅ Easy to query/filter by type
- ✅ Supports complex relationships
- ✅ Can add metadata per position

**Drawbacks:**
- ⚠️ More complex queries (JOINs)
- ⚠️ More complex admin UI
- ⚠️ Overkill for simple use cases

## Recommendation for Your Project

### **Short-term (Next 6 months):**
**Keep current approach** - separate columns for core positions.

**When to add a new column:**
- If a position type becomes **core** (used by 3+ industries)
- If you need to **query/filter** by that position type
- If admin UI needs a **dedicated editor** for it

**Examples that might need columns:**
- `equipment_positions` - If equipment becomes core mechanic
- `checkout_positions` - If checkout becomes standard feature

### **Medium-term (6-12 months):**
**Add `extended_positions` JSONB column** for experimental/optional positions.

```sql
ALTER TABLE industry_simulation_config 
ADD COLUMN extended_positions JSONB;

ALTER TABLE global_simulation_config 
ADD COLUMN extended_positions JSONB;
```

**Structure:**
```typescript
interface ExtendedPositions {
  equipmentPositions?: GridPosition[];
  storagePositions?: GridPosition[];
  checkoutPositions?: GridPosition[];
  // Future positions can be added here without schema changes
}
```

### **Long-term (12+ months):**
**Consider normalized table** if:
- You have 10+ position types
- Positions have complex relationships
- You need advanced querying (e.g., "find all positions within radius")
- You need position history/versioning

## Practical Guidelines

### ✅ DO:
1. **Add columns for core positions** that are used across industries
2. **Use JSONB for experimental features** - migrate to column when stable
3. **Keep position types consistent** - use same structure (`GridPosition`)
4. **Document position types** in code comments and types
5. **Validate positions** in application code, not just database

### ❌ DON'T:
1. **Don't add columns for one-off features** (use JSONB)
2. **Don't create columns for rarely-used positions**
3. **Don't mix structures** - keep all positions using `GridPosition` format
4. **Don't add columns without admin UI support** - if admin can't edit it, use JSONB

## Migration Path Example

**Scenario:** You want to add "Equipment Positions"

### Step 1: Start with JSONB (Experimental)
```typescript
// Add to extended_positions JSONB
extended_positions: {
  equipmentPositions: [...]
}
```

### Step 2: Test & Validate
- Use in 2-3 industries
- Get feedback
- Refine structure

### Step 3: Migrate to Column (When Stable)
```sql
-- Add column
ALTER TABLE industry_simulation_config 
ADD COLUMN equipment_positions JSONB;

-- Migrate data
UPDATE industry_simulation_config
SET equipment_positions = extended_positions->'equipmentPositions'
WHERE extended_positions->'equipmentPositions' IS NOT NULL;

-- Update code to use new column
-- Remove from extended_positions
```

## Code Pattern for Extended Positions

```typescript
// lib/game/types.ts
export interface ExtendedPositions {
  equipmentPositions?: GridPosition[];
  storagePositions?: GridPosition[];
  checkoutPositions?: GridPosition[];
  // Add new types here as needed
}

export interface SimulationLayoutConfig {
  // Core positions (separate columns)
  entryPosition: GridPosition;
  waitingPositions: GridPosition[];
  serviceRooms: ServiceRoomConfig[];
  staffPositions: GridPosition[];
  
  // Extended positions (JSONB, optional)
  extendedPositions?: ExtendedPositions;
}
```

## Summary

**Current approach is good for now!** 

- ✅ 4 core position types = manageable
- ✅ Separate columns = type-safe and queryable
- ✅ Admin UI already supports them

**When to evolve:**
- **5-7 position types**: Still OK with columns
- **8+ position types**: Consider `extended_positions` JSONB
- **Complex relationships**: Consider normalized table

**Key principle:** Start with columns for core features, use JSONB for flexibility, migrate to columns when stable.

