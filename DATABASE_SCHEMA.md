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
- `order` (INTEGER, optional) - Display order (lower = shown first, defaults to 0)

**Required:** Each industry must have at least 1 service

**Indexes:**
- Index on `(industry_id, order)` for efficient sorting

---

### `categories`
**Purpose:** Category definitions for upgrades and marketing campaigns

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Category identifier
- `industry_id` (TEXT) - Industry this category belongs to (required)
- `name` (TEXT) - Category name
- `order_index` (INTEGER) - Display order (lower = shown first, defaults to 0)
- `description` (TEXT, optional) - Category description
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Notes:**
- All categories are industry-specific - each industry maintains its own categories
- Categories can be used by both upgrades and marketing campaigns within the same industry

**Indexes:**
- Index on `industry_id` for efficient filtering
- Index on `(industry_id, order_index)` for efficient sorting

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
- `category_id` (TEXT, optional) - Reference to categories table
- `sets_flag` (TEXT, optional) - Flag ID to set when purchased
- `order` (INTEGER, optional) - Display order (lower = shown first, defaults to 0)

**Related:** `upgrade_levels` table contains the levels for each upgrade

**Required:** Each industry must have at least 1 upgrade

**Indexes:**
- Index on `(industry_id, order)` for efficient sorting
- Index on `category_id` for efficient category filtering

---

### `upgrade_levels`
**Purpose:** Individual levels for upgrades

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Level identifier
- `upgrade_id` (TEXT) - Parent upgrade ID
- `industry_id` (TEXT) - Industry this level belongs to
- `level` (INTEGER) - Level number (1, 2, 3, ...)
- `name` (TEXT) - Level name
- `cost` (NUMERIC) - Cost to purchase this level
- `time_cost` (INTEGER, optional) - Time cost for this level
- `description` (TEXT, optional) - Level description
- `icon` (TEXT, optional) - Icon path
- `effects` (JSONB) - Array of effect objects
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

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

**Unique Constraint:** `(industry_id, id)` - Ensures campaign IDs are unique per industry

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Campaign identifier
- `industry_id` (TEXT) - Industry this campaign belongs to
- `name` (TEXT) - Campaign name
- `description` (TEXT, optional) - Campaign description
- `campaign_type` (TEXT, NOT NULL) - Campaign type: 'leveled' (level-based like upgrades) or 'unlimited' (unlimited clicks). Defaults to 'unlimited'
- `max_level` (INTEGER, optional) - Maximum level for leveled campaigns (only used when campaign_type = 'leveled')
- `cost` (NUMERIC, optional) - Campaign cost (cash). NULL for leveled campaigns (cost is at level level), required for unlimited campaigns
- `time_cost` (NUMERIC, optional) - Optional time cost (hours). NULL for leveled campaigns, optional for unlimited campaigns
- `cooldown_seconds` (INTEGER, optional) - How long before this campaign can be run again (same for all levels)
- `effects` (JSONB, optional) - Campaign effects (JSONB array). NULL for leveled campaigns (effects are at level level), required for unlimited campaigns
- `category_id` (TEXT, optional) - Reference to categories table
- `sets_flag` (TEXT, optional) - Flag ID to set when campaign is launched
- `requirements` (JSONB, optional) - Array of requirement objects (all must be met = AND logic)
- `order` (INTEGER, optional) - Display order (lower = shown first, defaults to 0)

**Indexes:**
- Index on `(industry_id, order)` for efficient sorting
- Index on `category_id` for efficient category filtering
- Unique constraint on `(industry_id, id)` for foreign key relationships

---

### `marketing_campaign_levels`
**Purpose:** Individual levels for leveled marketing campaigns (similar to upgrade_levels)

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - Level identifier (auto-generated UUID)
- `campaign_id` (TEXT, NOT NULL) - Parent campaign ID
- `industry_id` (TEXT, NOT NULL) - Industry this level belongs to
- `level` (INTEGER, NOT NULL) - Level number (1, 2, 3, ...)
- `name` (TEXT, NOT NULL) - Level name
- `description` (TEXT, optional) - Level description
- `icon` (TEXT, optional) - Icon path
- `cost` (NUMERIC, NOT NULL, DEFAULT 0) - Cost to purchase this level
- `time_cost` (NUMERIC, optional) - Optional time cost (hours) for this level
- `effects` (JSONB, NOT NULL, DEFAULT '[]') - Array of effect objects for this level
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Foreign Keys:**
- `(campaign_id, industry_id)` references `marketing_campaigns(id, industry_id)` ON DELETE CASCADE

**Unique Constraint:**
- `(campaign_id, industry_id, level)` - Ensures each level number is unique per campaign

**Indexes:**
- Index on `(campaign_id, industry_id)` for efficient campaign queries
- Index on `(campaign_id, industry_id, level)` for efficient level lookups

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
- `order` (INTEGER, optional) - Display order (lower = shown first, defaults to 0)

**Indexes:**
- Index on `(industry_id, order)` for efficient sorting

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

### `leaderboard_entries`
**Purpose:** Store game results for leaderboard display, organized by industry

**Primary Key:** `id` (TEXT)

**Columns:**
- `id` (TEXT, PRIMARY KEY) - UUID (auto-generated)
- `industry_id` (TEXT, NOT NULL) - Industry identifier (references industries.id)
- `username` (TEXT, NOT NULL) - Player username
- `cash` (NUMERIC, NOT NULL) - Final cash amount when game ended
- `leveraged_time` (NUMERIC, NULL) - Final leveraged time capacity (efficiency metric - lower = more efficient)
- `game_over_reason` (TEXT, NULL) - Reason game ended: 'victory', 'cash', 'time', or null
- `current_month` (INTEGER, NULL) - Month when game ended
- `created_at` (TIMESTAMPTZ, NOT NULL) - Timestamp of entry (auto-generated)

**Indexes:**
- Index on `(industry_id, cash DESC)` - For efficient leaderboard queries sorted by cash
- Index on `(industry_id, created_at DESC)` - For efficient queries sorted by date

**Notes:**
- Entries are saved when a game ends (victory or loss)
- Leaderboard is displayed per industry, sorted by cash in descending order
- Leveraged time capacity represents efficiency (lower capacity = more efficient team management)

---

## Migration History

1. **006_create_unified_simulation_config.sql** - Created unified `simulation_config` table, migrated data from old tables
2. **007_create_metric_display_config.sql** - Created `metric_display_config` table
3. **008_simplify_metric_display_config.sql** - Simplified metric display config schema
4. **009_drop_old_simulation_config_tables.sql** - Drops old `global_simulation_config` and `industry_simulation_config` tables (run after migration verification)
5. **010_convert_spawn_interval_to_leads_per_month.sql** - Converts spawn interval to leads per month in business_stats
6. **011_add_order_to_collections.sql** - Adds `order` column to `upgrades`, `marketing_campaigns`, `staff_roles`, and `services` tables for display ordering
7. **012_add_categories.sql** - Creates `categories` table and adds `category_id` foreign keys to `upgrades` and `marketing_campaigns` tables
8. **013_create_leaderboard_entries.sql** - Creates `leaderboard_entries` table for storing game results per industry

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
