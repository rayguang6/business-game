# Database Migration Guide: Reputation → Skill Level

This guide covers all database changes needed to migrate from "reputation" to "skill level" terminology.

## ✅ Code Changes Complete

All code has been updated to use `skillLevel` terminology. The code supports both `'reputation'` (legacy) and `'skillLevel'` (new) event types for backward compatibility during migration.

---

## 📋 Database Migration Checklist

### 1. **Global Simulation Config** (`global_simulation_config` table)

**Table:** `global_simulation_config`  
**Column:** `business_metrics` (JSONB)

**Changes needed:**
```sql
-- Update business_metrics JSON
UPDATE global_simulation_config
SET business_metrics = jsonb_set(
  business_metrics,
  '{startingSkillLevel}',
  business_metrics->'startingReputation'
) - 'startingReputation';
```

**Before:**
```json
{
  "startingCash": 20000,
  "monthlyExpenses": 6000,
  "founderWorkHours": 300,
  "startingReputation": 50
}
```

**After:**
```json
{
  "startingCash": 20000,
  "monthlyExpenses": 6000,
  "founderWorkHours": 300,
  "startingSkillLevel": 50
}
```

---

### 2. **Global Simulation Config** - Business Stats

**Table:** `global_simulation_config`  
**Column:** `business_stats` (JSONB)

**Changes needed:**
```sql
-- Update business_stats JSON
UPDATE global_simulation_config
SET business_stats = jsonb_set(
  jsonb_set(
    business_stats,
    '{skillLevelGainPerHappyCustomer}',
    business_stats->'reputationGainPerHappyCustomer'
  ),
  '{skillLevelLossPerAngryCustomer}',
  business_stats->'reputationLossPerAngryCustomer'
) - 'reputationGainPerHappyCustomer' - 'reputationLossPerAngryCustomer';
```

**Before:**
```json
{
  "reputationGainPerHappyCustomer": 1,
  "reputationLossPerAngryCustomer": 5
}
```

**After:**
```json
{
  "skillLevelGainPerHappyCustomer": 1,
  "skillLevelLossPerAngryCustomer": 5
}
```

---

### 3. **Industry Simulation Config** (`industry_simulation_config` table)

**Table:** `industry_simulation_config`  
**Column:** `business_metrics` (JSONB)

**Changes needed:**
```sql
-- Update business_metrics JSON for all industries
UPDATE industry_simulation_config
SET business_metrics = jsonb_set(
  business_metrics,
  '{startingSkillLevel}',
  business_metrics->'startingReputation'
) - 'startingReputation';
```

**Before:**
```json
{
  "startingCash": 15000,
  "monthlyExpenses": 5000,
  "startingReputation": 10,
  "founderWorkHours": 360
}
```

**After:**
```json
{
  "startingCash": 15000,
  "monthlyExpenses": 5000,
  "startingSkillLevel": 10,
  "founderWorkHours": 360
}
```

---

### 4. **Industry Simulation Config** - Business Stats

**Table:** `industry_simulation_config`  
**Column:** `business_stats` (JSONB)

**Changes needed:**
```sql
-- Update business_stats JSON for all industries
UPDATE industry_simulation_config
SET business_stats = jsonb_set(
  jsonb_set(
    business_stats,
    '{skillLevelGainPerHappyCustomer}',
    business_stats->'reputationGainPerHappyCustomer'
  ),
  '{skillLevelLossPerAngryCustomer}',
  business_stats->'reputationLossPerAngryCustomer'
) - 'reputationGainPerHappyCustomer' - 'reputationLossPerAngryCustomer';
```

---

### 5. **Events** (`events` table)

**Table:** `events`  
**Column:** `choices` (JSONB)

**Changes needed:**
```sql
-- Update all event effects from 'reputation' to 'skillLevel'
-- This is a complex JSON update - you may need to do this per event or use a function

-- Example for a single event (adjust WHERE clause):
UPDATE events
SET choices = (
  SELECT jsonb_agg(
    jsonb_set(
      choice,
      '{consequences}',
      (
        SELECT jsonb_agg(
          jsonb_set(
            consequence,
            '{effects}',
            (
              SELECT jsonb_agg(
                CASE 
                  WHEN effect->>'type' = 'reputation' THEN
                    jsonb_set(effect, '{type}', '"skillLevel"')
                  ELSE
                    effect
                END
              )
              FROM jsonb_array_elements(consequence->'effects') AS effect
            )
          )
        )
        FROM jsonb_array_elements(choice->'consequences') AS consequence
      )
    )
  )
  FROM jsonb_array_elements(choices) AS choice
)
WHERE id = 'your-event-id';
```

**Before:**
```json
{
  "effects": [
    {
      "type": "reputation",
      "amount": 3
    }
  ]
}
```

**After:**
```json
{
  "effects": [
    {
      "type": "skillLevel",
      "amount": 3
    }
  ]
}
```

**⚠️ Note:** For bulk updates, you may want to write a migration function or script.

---

## 🔧 Complete Migration Script

Here's a complete SQL script you can run:

```sql
-- ============================================
-- MIGRATION: Reputation → Skill Level
-- ============================================

BEGIN;

-- 1. Update global_simulation_config business_metrics
UPDATE global_simulation_config
SET business_metrics = jsonb_set(
  business_metrics,
  '{startingSkillLevel}',
  business_metrics->'startingReputation'
) - 'startingReputation'
WHERE business_metrics ? 'startingReputation';

-- 2. Update global_simulation_config business_stats
UPDATE global_simulation_config
SET business_stats = jsonb_set(
  jsonb_set(
    business_stats,
    '{skillLevelGainPerHappyCustomer}',
    business_stats->'reputationGainPerHappyCustomer'
  ),
  '{skillLevelLossPerAngryCustomer}',
  business_stats->'reputationLossPerAngryCustomer'
) - 'reputationGainPerHappyCustomer' - 'reputationLossPerAngryCustomer'
WHERE business_stats ? 'reputationGainPerHappyCustomer';

-- 3. Update industry_simulation_config business_metrics
UPDATE industry_simulation_config
SET business_metrics = jsonb_set(
  business_metrics,
  '{startingSkillLevel}',
  business_metrics->'startingReputation'
) - 'startingReputation'
WHERE business_metrics ? 'startingReputation';

-- 4. Update industry_simulation_config business_stats
UPDATE industry_simulation_config
SET business_stats = jsonb_set(
  jsonb_set(
    business_stats,
    '{skillLevelGainPerHappyCustomer}',
    business_stats->'reputationGainPerHappyCustomer'
  ),
  '{skillLevelLossPerAngryCustomer}',
  business_stats->'reputationLossPerAngryCustomer'
) - 'reputationGainPerHappyCustomer' - 'reputationLossPerAngryCustomer'
WHERE business_stats ? 'reputationGainPerHappyCustomer';

-- 5. Update events - requires a function for nested JSON updates
CREATE OR REPLACE FUNCTION update_event_reputation_to_skilllevel()
RETURNS void AS $$
DECLARE
  event_record RECORD;
  updated_choices JSONB;
BEGIN
  FOR event_record IN SELECT id, choices FROM events LOOP
    -- Process each choice
    SELECT jsonb_agg(
      jsonb_set(
        choice,
        '{consequences}',
        (
          SELECT jsonb_agg(
            jsonb_set(
              consequence,
              '{effects}',
              (
                SELECT jsonb_agg(
                  CASE 
                    WHEN effect->>'type' = 'reputation' THEN
                      jsonb_set(effect, '{type}', '"skillLevel"')
                    ELSE
                      effect
                  END
                )
                FROM jsonb_array_elements(consequence->'effects') AS effect
              )
            )
          )
          FROM jsonb_array_elements(choice->'consequences') AS consequence
        )
      )
    )
    INTO updated_choices
    FROM jsonb_array_elements(event_record.choices) AS choice;
    
    UPDATE events
    SET choices = updated_choices
    WHERE id = event_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT update_event_reputation_to_skilllevel();

-- Drop the function (optional)
DROP FUNCTION update_event_reputation_to_skilllevel();

COMMIT;
```

---

## ✅ Verification Steps

After running the migration:

1. **Check global config:**
   ```sql
   SELECT business_metrics, business_stats FROM global_simulation_config;
   ```

2. **Check industry configs:**
   ```sql
   SELECT industry_id, business_metrics, business_stats FROM industry_simulation_config;
   ```

3. **Check events:**
   ```sql
   SELECT id, choices FROM events LIMIT 5;
   -- Verify no 'reputation' types remain in effects
   ```

4. **Test in game:**
   - Start a new game
   - Verify starting skill level is correct
   - Complete a customer service
   - Verify skill level gain works
   - Trigger an event with skill level effect
   - Verify it applies correctly

---

## 🔄 Backward Compatibility

The code currently supports both `'reputation'` and `'skillLevel'` event types for backward compatibility. After migration, you can remove the legacy support by:

1. Removing the `case 'reputation':` fallback in `lib/data/eventRepository.ts`
2. Removing legacy type checks in `app/admin/components/EventsTab.tsx`

---

## 📝 Summary

**Tables to update:**
- ✅ `global_simulation_config` (business_metrics, business_stats)
- ✅ `industry_simulation_config` (business_metrics, business_stats)
- ✅ `events` (choices JSONB - nested effects)

**Fields renamed:**
- `startingReputation` → `startingSkillLevel`
- `reputationGainPerHappyCustomer` → `skillLevelGainPerHappyCustomer`
- `reputationLossPerAngryCustomer` → `skillLevelLossPerAngryCustomer`
- Event effect type: `"reputation"` → `"skillLevel"`

**Code status:** ✅ Complete - All code uses `skillLevel` terminology

