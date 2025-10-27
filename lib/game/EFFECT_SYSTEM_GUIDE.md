# Effect System Implementation Guide

## ✅ Completed: Core System

The new `effectManager` is ready at `lib/game/effectManager.ts`.

### Key Features

1. **Centralized stat management** - All modifications go through one system
2. **Consistent formula**: `(base + adds) × (1 + percents/100) × multiplies`, then Set overrides
3. **Application order**: Add → Percent → Multiply → Set
4. **Automatic constraints** - Min/max bounds enforced
5. **Source tracking** - Know what affects each metric
6. **Easy removal** - Remove by ID, source, or category
7. **Shared utilities** - Reuse the same math in previews via helper functions

### Effect Types

```typescript
EffectType.Add      // +50 rooms
EffectType.Percent  // +20% (stored as 20, not 0.2)
EffectType.Multiply // ×2.0 (temporary doubler)
EffectType.Set      // Force to specific value (overrides all)
```

### Usage Example

```typescript
import { effectManager, GameMetric, EffectType } from '@/lib/game/effectManager';

// Add an upgrade effect
effectManager.add({
  id: 'upgrade_extra_room_1',
  source: {
    category: 'upgrade',
    id: 'extra_treatment_room',
    name: 'Extra Treatment Room',
  },
  metric: GameMetric.TreatmentRooms,
  type: EffectType.Add,
  value: 1,
});

// Calculate current value
const rooms = effectManager.calculate(GameMetric.TreatmentRooms, 2);
// Result: 3 (2 base + 1 from upgrade)

// Remove when needed
effectManager.removeBySource('upgrade', 'extra_treatment_room');
```

### Utility helpers

```typescript
import {
  calculateMetricValue,
  applyEffectsToMetrics,
  GameMetric,
} from '@/lib/game/effectManager';

const finalRooms = calculateMetricValue(
  GameMetric.ServiceRooms,
  2,
  effectManager.getEffectsForMetric(GameMetric.ServiceRooms),
);

// Batch apply to a metric map (e.g. upgrade previews)
const metrics = applyEffectsToMetrics(baseMetricMap, pendingEffects);
```

### Percentage Values

**Important**: Percentages are now stored as whole numbers:
- `20` = +20% bonus
- `50` = +50% bonus
- `-20` = -20% reduction

This is more intuitive than decimals (0.2, 0.5, etc).
Percent modifiers are summed first and then applied once, so `-10` and `-5` combine to `-15` (they do not compound).

---

## 📋 Next Steps: Migration

### Step 1: Migrate Upgrades
- Update upgrade purchase to add effects to effectManager
- Remove old calculation code
- Convert percent values from decimal to whole numbers in configs

### Step 2: Migrate Marketing
- Update campaign start/stop to use effectManager
- Remove old marketingEffects array

### Step 3: Migrate Staff
- Update staff hiring to add effects
- Update staff removal (if implemented) to remove effects

### Step 4: Update Game Loop
- Replace manual effect calculations with effectManager.calculate()
- Ensure all metrics use the new system

### Step 5: Cleanup
- Remove old `lib/game/effects.ts` (if safe)
- Remove old `lib/game/upgradeEngine.ts`
- Update types to remove deprecated fields

---

## 🎯 Available Metrics

```typescript
GameMetric.SpawnIntervalSeconds      // How often customers spawn (positive % = faster spawns)
GameMetric.ServiceSpeedMultiplier    // Service speed multiplier (higher = faster service)
GameMetric.TreatmentRooms           // Number of service rooms
GameMetric.ReputationMultiplier     // Reputation gain/loss multiplier
GameMetric.HappyProbability         // Customer satisfaction chance (currently fixed at 100%)
GameMetric.MonthlyExpenses           // Recurring costs
```

---

## 🔍 Debugging

```typescript
// Get all effects for a metric
const effects = effectManager.getEffectsForMetric(GameMetric.TreatmentRooms);

// Get detailed calculation with audit trail
const breakdown = effectManager.calculateDetailed(GameMetric.TreatmentRooms, 2);
console.log(breakdown.steps); // Shows each step of calculation

// Get all active effects
const all = effectManager.getAllEffects();
```

---

## ⚠️ Important Notes

1. **Don't use effectManager for one-time cash transactions**
   - Cash purchases still use direct state mutations
   - EffectManager is for computed stats, not transactions

2. **Level multiplication**
   - Currently: `effect.value * level`
   - Can be changed later if needed

3. **Effect IDs must be unique**
   - Use descriptive IDs: `upgrade_${upgradeId}_${effectIndex}`
   - Helps with debugging

4. **Remove effects when source is removed**
   - When staff is fired: `effectManager.removeBySource('staff', staffId)`
   - When campaign ends: `effectManager.removeBySource('marketing', campaignId)`

---

## 📚 Files Created

- `lib/game/effectManager.ts` - Core system
- `lib/game/__tests__/effectManager.test.ts` - Test suite (framework needed)
- `lib/game/EFFECT_SYSTEM_GUIDE.md` - This guide
