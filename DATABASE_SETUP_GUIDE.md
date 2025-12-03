# Database Setup Guide

## Required Database Content

### 1. Global Config (Required)
**Table:** `global_simulation_config`

**Required Fields:**
- `business_metrics` (JSONB) - Starting cash, expenses, etc. (used as defaults)
- `business_stats` (JSONB) - Game timing, customer spawn rates, etc. (used as defaults)
- `movement` (JSONB) - Movement speeds and animation timing (global only)

**Optional Fields:**
- `map_config` (via `map_width`, `map_height`, `map_walls`) - Map configuration defaults
- `capacity_image` (string) - Capacity indicator image
- `win_condition` (JSONB) - Default win condition
- `lose_condition` (JSONB) - Default lose condition
- `customer_images` (JSONB array) - Default customer images
- `staff_name_pool` (JSONB array) - Default staff name pool

**Note:** Layout columns (`entry_position`, `waiting_positions`, `service_rooms`, `staff_positions`) in `global_simulation_config` are **deprecated** and no longer used. Layout is now industry-specific only.

### 2. Per-Industry Content (Required)
**Each industry MUST have:**

- **Services** (`services` table) - At least 1 service
- **Upgrades** (`upgrades` table) - At least 1 upgrade
- **Events** (`events` table) - At least 1 event
- **Layout** (`industry_simulation_config` table) - **REQUIRED** - Each industry must configure its own layout

**Optional per-industry:**
- **Business Metrics** (`industry_simulation_config.business_metrics`) - Overrides global defaults
- **Business Stats** (`industry_simulation_config.business_stats`) - Overrides global defaults
- **Map Config** (`industry_simulation_config.map_width`, `map_height`, `map_walls`) - Overrides global defaults
- **Marketing Campaigns** (`marketing_campaigns` table)
- **Flags** (`flags` table)
- **Conditions** (`conditions` table)
- **Staff** (`staff_roles` and `staff_presets` tables)

## Layout Configuration

**Layout is now industry-specific only.** Each industry must configure its own layout in `industry_simulation_config`.

**Via Admin Panel:**
1. Go to Admin → Industry Config tab
2. Select an industry
3. Scroll to "Layout Positions" section
4. Edit entry position, waiting positions, service rooms, staff positions
5. Click "Save Industry Config"

**Via SQL:**
```sql
UPDATE industry_simulation_config
SET 
  entry_position = '{"x": 4, "y": 9}'::jsonb,
  waiting_positions = '[
    {"x": 1, "y": 1},
    {"x": 1, "y": 2},
    {"x": 1, "y": 3}
  ]'::jsonb,
  service_rooms = '[
    {"roomId": 1, "customerPosition": {"x": 5, "y": 2}, "staffPosition": {"x": 5, "y": 1}}
  ]'::jsonb,
  staff_positions = '[
    {"x": 4, "y": 0},
    {"x": 5, "y": 0}
  ]'::jsonb
WHERE industry_id = 'dental';
```

## Admin Panel Usage

### Editing Layout in Admin Panel

**Industry Layout (Required):**
- Go to Admin → Industry Config tab
- Select an industry
- Scroll to "Layout Positions" section
- Edit positions using the UI (much easier than JSON!)
- Click "Save Industry Config"

### Adding Industry Content

**Services:**
- Admin → Services tab → Select industry → Add service

**Upgrades:**
- Admin → Upgrades tab → Select industry → Add upgrade

**Events:**
- Admin → Events tab → Select industry → Add event

**Staff:**
- Admin → Staff tab → Select industry → Add role/preset

## Validation & Errors

The game now **fails fast** when required configuration is missing:
- ❌ Missing `business_metrics`, `business_stats`, or `movement` in `global_simulation_config` → game cannot start
- ❌ Missing layout config for an industry (`entry_position`, `waiting_positions`, `service_rooms`, `staff_positions`) → game cannot start
- ❌ Missing all services, upgrades, or events for an industry → game cannot start

In these cases the game shows a **Configuration Error** screen and logs details to the browser console.

Non-critical data still produces **warnings only**:
- ⚠️ Missing staff roles/presets
- ⚠️ Missing flags or conditions
- ⚠️ Missing marketing campaigns

**All warnings and errors are logged to the browser console** – check the console for details.

## Troubleshooting

### "Layout config not found" warning
**Solution:** Configure layout for the industry in Admin → Industry Config tab, or via SQL:
```sql
UPDATE industry_simulation_config
SET entry_position = '{"x": 4, "y": 9}'::jsonb,
    waiting_positions = '[...]'::jsonb,
    service_rooms = '[...]'::jsonb,
    staff_positions = '[...]'::jsonb
WHERE industry_id = 'your-industry-id';
```

### "Missing required industry data" warning
**Solution:** Add at least 1 service, 1 upgrade, and 1 event for the industry in admin panel.

### "Business metrics not found" warning
**Solution:** Ensure global config has `business_metrics` configured. The game will use safe defaults if missing, but you should configure proper values.

### Game won't start
**Check:**
1. Browser console for errors
2. Database has global config with `business_metrics` and `business_stats`
3. Industry has at least 1 service, upgrade, and event
4. Industry has layout configured in `industry_simulation_config`
5. Supabase connection is working

## SQL Scripts

- `sql/freelance_complete.sql` - Example complete industry setup (includes layout)

