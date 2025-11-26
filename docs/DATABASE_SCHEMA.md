# Database Schema - Complete Reference

## Overview

The game uses **Supabase (PostgreSQL)** for data storage. All configuration is stored in the database, allowing for dynamic content updates without code changes.

---

## Table Definitions

### `industries`
Stores industry definitions (Dental, Freelance, Restaurant, etc.)

```sql
CREATE TABLE industries (
  id TEXT PRIMARY KEY,                    -- 'dental', 'freelance', etc.
  name TEXT NOT NULL,                     -- Display name
  icon TEXT,                              -- Emoji/icon
  description TEXT,                      -- Industry description
  image TEXT,                             -- Industry image path
  map_image TEXT,                         -- Map image path
  is_available BOOLEAN DEFAULT true       -- Whether industry is playable
);
```

**Example:**
```sql
INSERT INTO industries (id, name, icon, description, image, map_image, is_available) 
VALUES ('freelance', 'Freelance Web Designer', '💻', 'Build websites...', '/images/industries/freelance.jpg', '/images/maps/freelance-map.png', true);
```

---

### `industry_simulation_configs`
Stores industry-specific game configuration (starting values, mechanics, win/lose conditions)

```sql
CREATE TABLE industry_simulation_configs (
  industry_id TEXT PRIMARY KEY REFERENCES industries(id),
  business_metrics JSONB NOT NULL,        -- Starting values
  business_stats JSONB NOT NULL,          -- Game mechanics
  win_condition JSONB,                    -- Win conditions
  lose_condition JSONB                    -- Lose conditions
);
```

**business_metrics JSONB Structure:**
```json
{
  "startingCash": 2000,
  "startingTime": 100,           // Optional: monthly time budget
  "monthlyExpenses": 500,
  "startingExp": 0,
  "startingFreedomScore": 0
}
```

**business_stats JSONB Structure:**
```json
{
  "ticksPerSecond": 10,                  // Game engine speed (rarely changed)
  "monthDurationSeconds": 60,              // Month length in seconds
  "customerSpawnIntervalSeconds": 4,      // Lead spawn interval
  "customerPatienceSeconds": 12,          // Customer patience timer
  "leavingAngryDurationTicks": 10,        // Exit animation duration
  "customerSpawnPosition": {"x": 4, "y": 9},
  "serviceCapacity": 1,                    // Number of service capacity
  "expGainPerHappyCustomer": 1,           // EXP gain per success
  "expLossPerAngryCustomer": 1,           // EXP loss per failure
  "eventTriggerSeconds": [15, 30, 45],    // Event trigger times
  "serviceRevenueMultiplier": 0.8,        // Revenue multiplier
  "serviceRevenueScale": 8,               // Revenue scaling factor
  "conversionRate": 12,                    // Lead conversion rate
  "failureRate": 15                        // Service failure chance (0-100)
}
```

**win_condition JSONB Structure:**
```json
{
  "cashTarget": 50000,                    // Win when reaching this cash
  "monthTarget": 10,                      // Optional: win after N months
  "customTitle": "Victory!",              // Optional: custom title
  "customMessage": "You succeeded!"       // Optional: custom message
}
```

**lose_condition JSONB Structure:**
```json
{
  "cashThreshold": 0,                     // Lose if cash <= this
  "timeThreshold": 0                      // Lose if time <= this (0 = disabled)
}
```

---

### `services`
Stores service definitions (what customers can purchase)

```sql
CREATE TABLE services (
  id TEXT PRIMARY KEY,                    -- 'basic_website', 'ecommerce_site', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  name TEXT NOT NULL,                     -- Display name
  description TEXT,                       -- Service description
  duration INTEGER NOT NULL,               -- Service duration (ticks/seconds)
  price NUMERIC NOT NULL,                 -- Base service price
  requirements JSONB DEFAULT '[]',        -- Array of requirements
  pricing_category TEXT,                  -- 'low', 'mid', or 'high'
  weightage INTEGER                       -- Weight for random selection
);
```

**requirements JSONB Structure:**
```json
[
  {
    "type": "flag",                       // 'flag', 'level', or 'condition'
    "id": "has_portfolio",                // Flag/condition ID or level number
    "expected": true                      // true = must be met, false = must NOT be met
  },
  {
    "type": "level",
    "level": 3                            // Requires level 3+
  }
]
```

**Example:**
```sql
INSERT INTO services (id, industry_id, name, description, duration, price, requirements, pricing_category, weightage) 
VALUES (
  'basic_website', 
  'freelance', 
  'Basic Website', 
  'Simple business website with 5 pages', 
  2, 
  800, 
  '[]'::jsonb, 
  'low', 
  60
);
```

---

### `upgrades`
Stores upgrade definitions (permanent improvements)

```sql
CREATE TABLE upgrades (
  id TEXT PRIMARY KEY,                    -- 'better_computer', 'online_courses', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  name TEXT NOT NULL,                     -- Display name
  description TEXT,                      -- Upgrade description
  icon TEXT,                              -- Emoji/icon
  cost TEXT NOT NULL,                     -- Cost formula: "500 + (level * 300)" or number
  time_cost INTEGER,                      -- Optional: time cost instead of cash
  max_level INTEGER NOT NULL,             -- Maximum upgrade level
  effects JSONB NOT NULL,                 -- Array of effects
  sets_flag TEXT,                         -- Optional: flag to set when purchased
  requirements JSONB DEFAULT '[]'         -- Array of requirements
);
```

**effects JSONB Structure:**
```json
[
  {
    "metric": "serviceSpeedMultiplier",   // GameMetric enum value
    "type": "percent",                    // 'add', 'percent', 'multiply', or 'set'
    "value": 15                           // Effect magnitude
  },
  {
    "metric": "exp",
    "type": "add",
    "value": 20
  }
]
```

**Example:**
```sql
INSERT INTO upgrades (id, industry_id, name, description, icon, cost, max_level, effects, requirements) 
VALUES (
  'better_computer', 
  'freelance', 
  'Better Computer', 
  'Faster development with better hardware', 
  '💻', 
  '500 + (level * 300)', 
  3,
  '[{"metric": "serviceSpeedMultiplier", "type": "percent", "value": 15}]'::jsonb,
  '[]'::jsonb
);
```

---

### `marketing_campaigns`
Stores marketing campaign definitions (temporary boosts)

```sql
CREATE TABLE marketing_campaigns (
  id TEXT PRIMARY KEY,                   -- 'social_media_post', 'portfolio_update', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  name TEXT NOT NULL,                     -- Display name
  description TEXT,                      -- Campaign description
  cost NUMERIC NOT NULL,                  -- Cash cost
  time_cost INTEGER NOT NULL,             -- Time cost
  cooldown_seconds INTEGER NOT NULL,      -- Cooldown between uses
  effects JSONB NOT NULL,                 -- Array of effects (can have durationSeconds)
  sets_flag TEXT,                         -- Optional: flag to set
  requirements JSONB DEFAULT '[]'         -- Array of requirements
);
```

**effects JSONB Structure (with duration):**
```json
[
  {
    "metric": "serviceRevenueMultiplier",
    "type": "percent",
    "value": 15,
    "durationSeconds": 60                 // Optional: temporary effect duration
  },
  {
    "metric": "generateLeads",
    "type": "add",
    "value": 3                            // Immediate lead generation
  }
]
```

**Example:**
```sql
INSERT INTO marketing_campaigns (id, industry_id, name, description, cost, time_cost, cooldown_seconds, effects) 
VALUES (
  'social_media_post', 
  'freelance', 
  'Social Media Post', 
  'Share portfolio work on social media', 
  50, 
  1, 
  30,
  '[{"metric": "generateLeads", "type": "add", "value": 3}]'::jsonb
);
```

---

### `events`
Stores random event definitions (opportunities and risks)

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,                   -- 'client_emergency', 'competition_win', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  title TEXT NOT NULL,                    -- Event title
  category TEXT NOT NULL,                 -- 'opportunity' or 'risk'
  summary TEXT NOT NULL,                  -- Event description
  choices JSONB NOT NULL,                 -- Array of choices
  requirements JSONB DEFAULT '[]'         -- Array of requirements
);
```

**choices JSONB Structure:**
```json
[
  {
    "id": "fix_immediately",
    "label": "Fix it immediately",
    "description": "Help the client right away",
    "cost": 0,                            // Optional: upfront cash cost
    "timeCost": 3,                        // Optional: upfront time cost
    "consequences": [
      {
        "id": "success",
        "label": "Client happy",
        "description": "Client appreciates quick response",
        "weight": 100,                    // Selection probability
        "effects": [
          {
            "type": "cash",               // 'cash', 'exp', 'dynamicCash', or 'metric'
            "amount": 300,
            "label": "Payment received"
          },
          {
            "type": "time",
            "amount": -3
          }
        ]
      }
    ],
    "setsFlag": "helped_client"           // Optional: flag to set
  }
]
```

**Event Effect Types:**
- `cash`: Direct cash modification
- `exp`: Direct EXP modification
- `dynamicCash`: Formula-based cash (e.g., `"monthlyRevenue * 0.1"`)
- `metric`: Standard metric effect with optional duration

**Example:**
```sql
INSERT INTO events (id, industry_id, title, category, summary, choices) 
VALUES (
  'client_emergency', 
  'freelance', 
  'Client Emergency', 
  'risk',
  'Client needs urgent website fix',
  '[
    {
      "id": "fix_immediately",
      "label": "Fix it immediately",
      "consequences": [{
        "effects": [
          {"type": "cash", "amount": 300},
          {"type": "time", "amount": -3}
        ]
      }]
    }
  ]'::jsonb
);
```

---

### `staff_roles`
Stores staff role definitions (hirable employees)

```sql
CREATE TABLE staff_roles (
  id TEXT PRIMARY KEY,                   -- 'virtual_assistant', 'mentor_coach', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  name TEXT NOT NULL,                    -- Role name
  salary NUMERIC NOT NULL,               -- Monthly salary
  effects JSONB NOT NULL,                 -- Array of effects
  sets_flag TEXT,                         -- Optional: flag to set when hired
  requirements JSONB DEFAULT '[]',       -- Prerequisites
  sprite_image TEXT                       -- Optional: image path
);
```

**effects JSONB Structure:**
```json
[
  {
    "metric": "monthlyExpenses",
    "type": "add",
    "value": 400                           // Adds to monthly expenses
  },
  {
    "metric": "spawnIntervalSeconds",
    "type": "percent",
    "value": -15                           // Negative = faster spawns
  }
]
```

**Example:**
```sql
INSERT INTO staff_roles (id, industry_id, name, salary, effects) 
VALUES (
  'virtual_assistant', 
  'freelance', 
  'Virtual Assistant', 
  400,
  '[
    {"metric": "monthlyExpenses", "type": "add", "value": 400},
    {"metric": "spawnIntervalSeconds", "type": "percent", "value": -15}
  ]'::jsonb
);
```

---

### `staff_presets`
Stores available staff presets (initial staff available for hire)

```sql
CREATE TABLE staff_presets (
  id TEXT PRIMARY KEY,                   -- 'freelance_va', 'freelance_accountant', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  staff_role_id TEXT NOT NULL REFERENCES staff_roles(id),
  is_available BOOLEAN DEFAULT true       -- Whether preset is available
);
```

**Example:**
```sql
INSERT INTO staff_presets (id, industry_id, staff_role_id, is_available) 
VALUES ('freelance_va', 'freelance', 'virtual_assistant', true);
```

---

### `flags`
Stores flag definitions (boolean state trackers)

```sql
CREATE TABLE flags (
  id TEXT PRIMARY KEY,                   -- 'has_portfolio', 'premium_platform', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  name TEXT NOT NULL,                    -- Display name
  description TEXT,                      -- Flag description
  is_unlocked_by_default BOOLEAN DEFAULT false  -- Whether flag starts unlocked
);
```

**Example:**
```sql
INSERT INTO flags (id, industry_id, name, description, is_unlocked_by_default) 
VALUES ('has_portfolio', 'freelance', 'Portfolio Complete', 'Has a professional portfolio website', true);
```

---

### `conditions`
Stores condition definitions (dynamic game states)

```sql
CREATE TABLE conditions (
  id TEXT PRIMARY KEY,                  -- 'high_demand', 'low_demand', etc.
  industry_id TEXT NOT NULL REFERENCES industries(id),
  name TEXT NOT NULL,                    -- Display name
  description TEXT,                      -- Condition description
  type TEXT NOT NULL,                    -- 'periodic', 'one-time', or 'triggered'
  config JSONB NOT NULL                  -- Condition-specific config
);
```

**config JSONB Structure (periodic):**
```json
{
  "periodSeconds": 180,                  // Recurrence period
  "durationSeconds": 45                  // Duration when active
}
```

**Example:**
```sql
INSERT INTO conditions (id, industry_id, name, description, type, config) 
VALUES (
  'high_demand', 
  'freelance', 
  'High Demand Period', 
  'Peak season for web design projects', 
  'periodic',
  '{"periodSeconds": 180, "durationSeconds": 45}'::jsonb
);
```

---

### `global_simulation_config`
Stores global configuration (shared defaults across all industries)

```sql
CREATE TABLE global_simulation_config (
  id TEXT PRIMARY KEY DEFAULT 'global',  -- Single row
  business_metrics JSONB,                -- Global business metrics defaults
  business_stats JSONB,                  -- Global business stats defaults
  movement JSONB,                        -- Movement config
  map_config JSONB,                      -- Map config
  layout_config JSONB,                    -- Layout config
  capacity_image TEXT,                   -- Capacity image path
  win_condition JSONB,                   -- Global win condition
  lose_condition JSONB,                  -- Global lose condition
  customer_images TEXT[],                -- Array of customer image paths
  staff_name_pool TEXT[]                 -- Array of staff names
);
```

**movement JSONB Structure:**
```json
{
  "customerTilesPerTick": 0.25,
  "animationReferenceTilesPerTick": 0.25,
  "walkFrameDurationMs": 200,
  "minWalkFrameDurationMs": 80,
  "maxWalkFrameDurationMs": 320,
  "celebrationFrameDurationMs": 200
}
```

**map_config JSONB Structure:**
```json
{
  "width": 10,
  "height": 10,
  "walls": [
    {"x": 3, "y": 1},
    {"x": 3, "y": 2}
  ]
}
```

**layout_config JSONB Structure:**
```json
{
  "entryPosition": {"x": 4, "y": 9},
  "waitingPositions": [
    {"x": 2, "y": 5, "facingDirection": "right"},
    {"x": 3, "y": 5, "facingDirection": "right"}
  ],
  "serviceRoomPositions": [
    {"x": 6, "y": 3, "facingDirection": "down"}
  ],
  "staffPositions": [
    {"x": 1, "y": 1, "facingDirection": "down"}
  ]
}
```

---

## Game Metrics (Effect System)

All effects use these metric names (from `GameMetric` enum):

### Core Resources
- `cash` - Direct cash modification
- `time` - Direct time modification
- `exp` - Direct EXP modification
- `freedomScore` - Freedom score modification

### Business Operations
- `spawnIntervalSeconds` - Lead/customer spawn rate (lower = faster)
- `serviceSpeedMultiplier` - Service completion speed
- `serviceCapacity` - Number of available service capacity
- `monthlyExpenses` - Monthly operating expenses
- `monthlyTimeCapacity` - Monthly time budget increase

### Revenue & Pricing
- `serviceRevenueMultiplier` - Revenue multiplier (all services)
- `serviceRevenueFlatBonus` - Flat bonus added to service price
- `highTierServiceRevenueMultiplier` - High-tier service multiplier
- `midTierServiceRevenueMultiplier` - Mid-tier service multiplier
- `lowTierServiceRevenueMultiplier` - Low-tier service multiplier
- `highTierServiceWeightageMultiplier` - High-tier spawn weight
- `midTierServiceWeightageMultiplier` - Mid-tier spawn weight
- `lowTierServiceWeightageMultiplier` - Low-tier spawn weight

### Quality & Conversion
- `failureRate` - Service failure chance (0-100%)
- `conversionRate` - Lead conversion rate

### Special Actions
- `generateLeads` - Immediate lead generation (one-time)

---

## Effect Types

All effects use these types (from `EffectType` enum):

- `add` - Flat addition: `value + effect`
- `percent` - Percentage: `value × (1 + effect/100)`
- `multiply` - Multiplication: `value × effect`
- `set` - Override: `value = effect`

**Application Order:** Add → Percent → Multiply → Set

---

## Indexes (Recommended)

```sql
-- Industry lookups
CREATE INDEX idx_services_industry ON services(industry_id);
CREATE INDEX idx_upgrades_industry ON upgrades(industry_id);
CREATE INDEX idx_marketing_industry ON marketing_campaigns(industry_id);
CREATE INDEX idx_events_industry ON events(industry_id);
CREATE INDEX idx_staff_roles_industry ON staff_roles(industry_id);
CREATE INDEX idx_staff_presets_industry ON staff_presets(industry_id);
CREATE INDEX idx_flags_industry ON flags(industry_id);
CREATE INDEX idx_conditions_industry ON conditions(industry_id);

-- Staff preset lookups
CREATE INDEX idx_staff_presets_role ON staff_presets(staff_role_id);
```

---

## Example Complete Industry Setup

See `freelance_minimal.sql` for a minimal example and `sql/freelance_complete.sql` for a complete example.

**Typical Industry Setup Order:**
1. Insert industry (`industries`)
2. Insert industry config (`industry_simulation_configs`)
3. Insert services (`services`)
4. Insert upgrades (`upgrades`)
5. Insert marketing campaigns (`marketing_campaigns`)
6. Insert events (`events`)
7. Insert staff roles (`staff_roles`)
8. Insert staff presets (`staff_presets`)
9. Insert flags (`flags`)
10. Insert conditions (`conditions`)

---

**Last Updated**: Generated from codebase analysis
**Version**: 1.0

