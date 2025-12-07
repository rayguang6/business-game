# Database Schema Reference

This document describes the current database schema for the Business Game project.

## Overview

The database uses PostgreSQL (via Supabase) with the following key design principles:
- **Unified configuration table** - Single `simulation_config` table for both global and industry-specific settings
- **Industry-based organization** - Most content is organized by `industry_id`
- **JSONB for flexibility** - Complex nested data stored as JSONB
- **Strict validation** - Required fields are enforced at the application level

---

## Core Tables

### `simulation_config`
**Purpose:** Unified table for all simulation configuration (replaces old `global_simulation_config` and `industry_simulation_config` tables)

**Primary Key:** `industry_id` (TEXT)
- `'global'` = Global defaults
- Industry ID = Industry-specific overrides

**Columns:**
- `industry_id` (TEXT, PRIMARY KEY) - 'global' or industry ID
- `business_metrics` (JSONB) - Starting cash, expenses, EXP, time
- `business_stats` (JSONB) - Game timing, customer spawn rates, patience, etc.
- `movement` (JSONB) - Movement speeds and animation timing (global only)
- `map_width` (INTEGER) - Map width in tiles
- `map_height` (INTEGER) - Map height in tiles
- `map_walls` (JSONB) - Array of `{x, y}` wall positions
- `entry_position` (JSONB) - `{x, y}` customer entry point (industry-specific)
- `waiting_positions` (JSONB) - Array of `{x, y}` waiting positions (industry-specific)
- `service_rooms` (JSONB) - Array of service room configs (industry-specific)
- `staff_positions` (JSONB) - Array of `{x, y}` staff positions (industry-specific)
- `main_character_position` (JSONB) - `{x, y}` main character position (industry-specific)
- `main_character_sprite_image` (TEXT) - Sprite image path (industry-specific)
- `win_condition` (JSONB) - Win condition config
- `lose_condition` (JSONB) - Lose condition config
- `event_selection_mode` (TEXT) - 'random' or 'sequence' (industry-specific)
- `event_sequence` (TEXT[]) - Array of event IDs for sequence mode (industry-specific)
- `capacity_image` (TEXT) - Capacity indicator image path
- `customer_images` (TEXT[]) - Array of customer image paths
- `staff_name_pool` (TEXT[]) - Array of staff names
- `lead_dialogues` (TEXT[]) - Array of lead dialogue strings
- `ui_config` (JSONB) - UI timing configuration
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes:**
- Primary key on `industry_id`
- GIN index on `business_metrics`
- GIN index on `business_stats`

**Notes:**
- Layout fields (`entry_position`, `waiting_positions`, `service_rooms`, `staff_positions`) are **industry-specific only**
- Global row (`industry_id = 'global'`) should have `business_metrics`, `business_stats`, and `movement` configured
- Each industry row should have layout configured (required for gameplay)

---

### `industries`
**Purpose:** List of available industries

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Industry identifier
- `name` (TEXT) - Display name
- `is_available` (BOOLEAN) - Whether industry is available for play
- `description` (TEXT, optional) - Industry description
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

### `services`
**Purpose:** Service definitions per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Service identifier
- `industry_id` (TEXT) - Industry this service belongs to
- `name` (TEXT) - Service name
- `duration` (INTEGER) - Service duration in ticks
- `price` (NUMERIC) - Service price
- `tier` (TEXT) - Service tier: 'small', 'medium', 'big'
- `exp_gained` (INTEGER, optional) - EXP gained from this service
- `requirements` (JSONB, optional) - Array of requirement objects
- `pricing_category` (TEXT, optional) - 'low', 'mid', 'high'
- `weightage` (NUMERIC, optional) - Weight for random selection
- `required_staff_role_ids` (TEXT[], optional) - Staff roles that can perform this service
- `time_cost` (INTEGER, optional) - Time cost for this service

**Required:** Each industry must have at least 1 service

---

### `upgrades`
**Purpose:** Upgrade definitions per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Upgrade identifier
- `industry_id` (TEXT) - Industry this upgrade belongs to
- `name` (TEXT) - Upgrade name
- `description` (TEXT, optional) - Upgrade description
- `icon` (TEXT, optional) - Icon path
- `category` (TEXT, optional) - Upgrade category
- `sets_flag` (TEXT, optional) - Flag ID to set when purchased

**Related:** `upgrade_levels` table contains the levels for each upgrade

**Required:** Each industry must have at least 1 upgrade

---

### `upgrade_levels`
**Purpose:** Individual levels for upgrades

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Level identifier
- `upgrade_id` (TEXT) - Parent upgrade ID
- `level` (INTEGER) - Level number (1, 2, 3, ...)
- `cost` (NUMERIC) - Cost to purchase this level
- `description` (TEXT, optional) - Level description
- `icon` (TEXT, optional) - Icon path
- `effects` (JSONB) - Array of effect objects

---

### `events`
**Purpose:** Random events per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Event identifier
- `industry_id` (TEXT) - Industry this event belongs to
- `title` (TEXT) - Event title
- `description` (TEXT) - Event description
- `choices` (JSONB) - Array of choice objects
- `trigger_conditions` (JSONB, optional) - Conditions for triggering
- `priority` (INTEGER, optional) - Event priority

**Required:** Each industry must have at least 1 event

---

### `marketing_campaigns`
**Purpose:** Marketing campaign definitions per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Campaign identifier
- `industry_id` (TEXT) - Industry this campaign belongs to
- `name` (TEXT) - Campaign name
- `description` (TEXT, optional) - Campaign description
- `cost` (NUMERIC) - Campaign cost
- `duration_seconds` (INTEGER) - Campaign duration
- `effects` (JSONB) - Array of effect objects
- `sets_flag` (TEXT, optional) - Flag ID to set
- `requirements` (JSONB, optional) - Array of requirement objects

---

### `flags`
**Purpose:** Game flags per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Flag identifier
- `industry_id` (TEXT) - Industry this flag belongs to
- `name` (TEXT) - Flag name
- `description` (TEXT) - Flag description

---

### `conditions`
**Purpose:** Game conditions per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Condition identifier
- `industry_id` (TEXT) - Industry this condition belongs to
- `name` (TEXT) - Condition name
- `description` (TEXT) - Condition description
- `requirements` (JSONB) - Array of requirement objects
- `effects` (JSONB, optional) - Array of effect objects

---

### `staff_roles`
**Purpose:** Staff role definitions per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Role identifier
- `industry_id` (TEXT) - Industry this role belongs to
- `name` (TEXT) - Role name
- `salary` (NUMERIC) - Monthly salary
- `effects` (JSONB) - Array of effect objects
- `sprite_image` (TEXT, optional) - Sprite image path
- `sets_flag` (TEXT, optional) - Flag ID to set
- `requirements` (JSONB, optional) - Array of requirement objects

---

### `staff_presets`
**Purpose:** Pre-configured staff members per industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Preset identifier
- `industry_id` (TEXT) - Industry this preset belongs to
- `role_id` (TEXT) - Staff role ID
- `name` (TEXT, optional) - Staff name
- `salary` (NUMERIC, optional) - Override salary
- `service_speed` (NUMERIC, optional) - Service speed multiplier

---

### `metric_display_config`
**Purpose:** Display configuration for game metrics (labels, visibility, priority)

**Primary Key:** `id` (TEXT) - Format: `{industry_id}_{metric_id}`

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Composite ID
- `industry_id` (TEXT) - 'global' for defaults, industry ID for overrides
- `metric_id` (TEXT) - Metric identifier (e.g., 'cash', 'exp')
- `display_label` (TEXT) - Display label
- `description` (TEXT, optional) - Metric description
- `unit` (TEXT, optional) - Unit label (e.g., 'h', 'x', '%')
- `icon_path` (TEXT, optional) - Icon image path
- `show_on_hud` (BOOLEAN) - Show on HUD
- `show_in_details` (BOOLEAN) - Show in details panel
- `priority` (INTEGER, optional) - Display priority (lower = shown first)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Constraints:**
- Unique constraint on `(industry_id, metric_id)`
- `metric_id` must be a valid GameMetric enum value

**Indexes:**
- Index on `(industry_id, metric_id)`
- Index on `metric_id`

---

## Migration History

1. **006_create_unified_simulation_config.sql** - Created unified `simulation_config` table, migrated data from old tables
2. **007_create_metric_display_config.sql** - Created `metric_display_config` table
3. **008_simplify_metric_display_config.sql** - Simplified metric display config schema
4. **009_drop_old_simulation_config_tables.sql** - Drops old `global_simulation_config` and `industry_simulation_config` tables (run after migration verification)
5. **010_convert_spawn_interval_to_leads_per_month.sql** - Converts spawn interval to leads per month in business_stats

---

## Data Requirements

### Global Configuration (Required)
- Row in `simulation_config` with `industry_id = 'global'`
- Must have: `business_metrics`, `business_stats`, `movement`

### Per-Industry Configuration (Required)
Each industry must have:
- Row in `simulation_config` with layout configured (`entry_position`, `waiting_positions`, `service_rooms`, `staff_positions`)
- At least 1 service in `services` table
- At least 1 upgrade in `upgrades` table (with at least 1 level in `upgrade_levels`)
- At least 1 event in `events` table

### Optional Per-Industry Content
- Marketing campaigns
- Flags
- Conditions
- Staff roles and presets
- Metric display config overrides

---

## Verification Queries

### Check layout coverage:
```sql
SELECT 
  i.id as industry_id,
  i.name as industry_name,
  CASE 
    WHEN sc.entry_position IS NULL THEN '❌ Missing layout'
    ELSE '✅ Has layout'
  END as layout_status
FROM industries i
LEFT JOIN simulation_config sc ON i.id = sc.industry_id
WHERE i.is_available = true
ORDER BY i.id;
```

### Check required content:
```sql
SELECT 
  i.id,
  (SELECT COUNT(*) FROM services WHERE industry_id = i.id) as services_count,
  (SELECT COUNT(*) FROM upgrades WHERE industry_id = i.id) as upgrades_count,
  (SELECT COUNT(*) FROM events WHERE industry_id = i.id) as events_count
FROM industries i
WHERE i.is_available = true;
```

### Verify migration:
```sql
SELECT industry_id, COUNT(*) 
FROM simulation_config 
GROUP BY industry_id;
```
