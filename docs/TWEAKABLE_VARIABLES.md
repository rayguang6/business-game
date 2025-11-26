# Tweakable Variables & Effects - Quick Reference

## 🎛️ Starting Values (business_metrics)

| Variable | Type | Default | Description | Tweakable |
|----------|------|---------|-------------|-----------|
| `startingCash` | number | 10,000 | Initial cash | ✅ Yes |
| `startingTime` | number | 0-100 | Monthly time budget | ✅ Yes |
| `monthlyExpenses` | number | 3,000 | Base monthly expenses | ✅ Yes |
| `startingExp` | number | 10 | Starting experience | ✅ Yes |
| `startingFreedomScore` | number | 360 | Starting freedom score | ✅ Yes |

---

## ⚙️ Game Mechanics (business_stats)

| Variable | Type | Default | Description | Tweakable |
|----------|------|---------|-------------|-----------|
| `ticksPerSecond` | number | 10 | Game engine speed | ⚠️ Rarely |
| `monthDurationSeconds` | number | 60 | Month length (seconds) | ⚠️ Rarely |
| `customerSpawnIntervalSeconds` | number | 3 | Lead spawn interval | ✅ Yes |
| `customerPatienceSeconds` | number | 10 | Customer patience timer | ✅ Yes |
| `leavingAngryDurationTicks` | number | 10 | Exit animation duration | ⚠️ Rarely |
| `customerSpawnPosition` | object | `{x:4, y:9}` | Customer spawn position | ✅ Yes |
| `serviceCapacity` | number | 2 | Number of service capacity | ✅ Yes |
| `expGainPerHappyCustomer` | number | 2 | EXP gain per success | ✅ Yes |
| `expLossPerAngryCustomer` | number | 1 | EXP loss per failure | ✅ Yes |
| `eventTriggerSeconds` | number[] | `[15,30,45]` | Event trigger times | ✅ Yes |
| `serviceRevenueMultiplier` | number | 1.0 | Revenue multiplier | ✅ Yes |
| `serviceRevenueScale` | number | 10 | Revenue scaling factor | ✅ Yes |
| `conversionRate` | number | 10 | Lead conversion rate | ✅ Yes |
| `failureRate` | number | 0 | Service failure chance (0-100) | ✅ Yes |

---

## 🎮 Movement Config

| Variable | Type | Default | Description | Tweakable |
|----------|------|---------|-------------|-----------|
| `customerTilesPerTick` | number | 0.25 | Customer movement speed | ✅ Yes |
| `animationReferenceTilesPerTick` | number | 0.25 | Animation speed | ✅ Yes |
| `walkFrameDurationMs` | number | 200 | Walk animation frame (ms) | ✅ Yes |
| `minWalkFrameDurationMs` | number | 80 | Min frame duration (ms) | ✅ Yes |
| `maxWalkFrameDurationMs` | number | 320 | Max frame duration (ms) | ✅ Yes |
| `celebrationFrameDurationMs` | number | 200 | Celebration animation (ms) | ✅ Yes |

---

## 🗺️ Map Config

| Variable | Type | Default | Description | Tweakable |
|----------|------|---------|-------------|-----------|
| `width` | number | 10 | Map width (tiles) | ✅ Yes |
| `height` | number | 10 | Map height (tiles) | ✅ Yes |
| `walls` | array | `[]` | Array of wall positions | ✅ Yes |
| `entryPosition` | object | `{x:4, y:9}` | Customer spawn position | ✅ Yes |
| `waitingPositions` | array | `[]` | Waiting area positions | ✅ Yes |
| `serviceRoomPositions` | array | `[]` | Service room positions | ✅ Yes |
| `staffPositions` | array | `[]` | Staff positions | ✅ Yes |

---

## ⚡ All Available Effects (Game Metrics)

### Core Resources
| Metric | Description | Effect Types | Constraints |
|--------|-------------|--------------|-------------|
| `cash` | Direct cash modification | add, set | min=0, roundToInt |
| `time` | Direct time modification | add, set | min=0, roundToInt |
| `exp` | Direct EXP modification | add, set | min=0, roundToInt |
| `freedomScore` | Freedom score modification | add, set | min=0, roundToInt |

### Business Operations
| Metric | Description | Effect Types | Constraints |
|--------|-------------|--------------|-------------|
| `spawnIntervalSeconds` | Lead/customer spawn rate (lower = faster) | add, percent, multiply, set | min=0.1 |
| `serviceSpeedMultiplier` | Service completion speed (higher = faster) | add, percent, multiply, set | min=0.1 |
| `serviceCapacity` | Number of available service capacity | add, percent, multiply, set | min=1, roundToInt |
| `monthlyExpenses` | Monthly operating expenses | add, percent, multiply, set | min=0 |
| `monthlyTimeCapacity` | Monthly time budget increase | add, set | min=0, roundToInt |

### Revenue & Pricing
| Metric | Description | Effect Types | Constraints |
|--------|-------------|--------------|-------------|
| `serviceRevenueMultiplier` | Revenue multiplier (all services) | add, percent, multiply, set | min=0 |
| `serviceRevenueFlatBonus` | Flat bonus added to service price | add, percent, multiply, set | min=-100000 |
| `highTierServiceRevenueMultiplier` | High-tier service multiplier | add, percent, multiply, set | min=0 |
| `midTierServiceRevenueMultiplier` | Mid-tier service multiplier | add, percent, multiply, set | min=0 |
| `lowTierServiceRevenueMultiplier` | Low-tier service multiplier | add, percent, multiply, set | min=0 |
| `highTierServiceWeightageMultiplier` | High-tier spawn weight | add, percent, multiply, set | min=0 |
| `midTierServiceWeightageMultiplier` | Mid-tier spawn weight | add, percent, multiply, set | min=0 |
| `lowTierServiceWeightageMultiplier` | Low-tier spawn weight | add, percent, multiply, set | min=0 |

### Quality & Conversion
| Metric | Description | Effect Types | Constraints |
|--------|-------------|--------------|-------------|
| `failureRate` | Service failure chance (0-100%) | add, percent, multiply, set | min=0, max=100, roundToInt |
| `conversionRate` | Lead conversion rate | add, percent, multiply, set | min=0.1 |

### Special Actions
| Metric | Description | Effect Types | Constraints |
|--------|-------------|--------------|-------------|
| `generateLeads` | Immediate lead generation (one-time) | add | N/A |

---

## 📊 Effect Types

| Type | Formula | Example | Use Case |
|------|---------|---------|----------|
| `add` | `value + effect` | `+100 cash` | Flat bonuses |
| `percent` | `value × (1 + effect/100)` | `+15% revenue` | Percentage boosts |
| `multiply` | `value × effect` | `×2 speed` | Multipliers |
| `set` | `value = effect` | `set to 5 rooms` | Overrides |

**Application Order:** Add → Percent → Multiply → Set

---

## 🎯 Common Balance Tweaks

### Make Game Faster
```json
{
  "customerSpawnIntervalSeconds": 2,      // More customers (was 3)
  "serviceSpeedMultiplier": 1.5,          // Faster service (via effects)
  "serviceCapacity": 3                     // More capacity (was 2)
}
```

### Make Game Easier
```json
{
  "startingCash": 20000,                  // More starting cash (was 10000)
  "monthlyExpenses": 2000,                 // Lower expenses (was 3000)
  "failureRate": 0,                       // No failures (was 0-15)
  "serviceRevenueMultiplier": 1.2         // Higher revenue (was 1.0)
}
```

### Make Game Harder
```json
{
  "startingCash": 5000,                   // Less starting cash (was 10000)
  "monthlyExpenses": 5000,                 // Higher expenses (was 3000)
  "failureRate": 20,                      // More failures (was 0)
  "customerPatienceSeconds": 5,            // Less patience (was 10)
  "serviceRevenueMultiplier": 0.8         // Lower revenue (was 1.0)
}
```

### Adjust Revenue Model
```json
{
  "serviceRevenueMultiplier": 1.5,        // 50% more revenue
  "serviceRevenueScale": 15,               // Higher scaling (was 10)
  "highTierServiceRevenueMultiplier": 1.2  // Via effects: +20% high-tier
}
```

---

## 📈 Service Configuration

### Service Properties
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `duration` | number | Service duration (ticks/seconds) | `2`, `8`, `16` |
| `price` | number | Base service price | `200`, `800`, `2000` |
| `pricing_category` | string | `'low'`, `'mid'`, or `'high'` | `'high'` |
| `weightage` | number | Random selection weight | `60` (60% chance) |
| `requirements` | array | Prerequisites | `[{"type": "level", "level": 3}]` |

### Revenue Calculation Formula
```
Final Revenue = (
  (servicePrice × tierMultiplier) + flatBonus
) × revenueMultiplier × revenueScale
```

Where:
- `tierMultiplier` = tier-specific multiplier from effects
- `flatBonus` = `serviceRevenueFlatBonus` from effects
- `revenueMultiplier` = `serviceRevenueMultiplier` from effects
- `revenueScale` = `serviceRevenueScale` from config

---

## 🚀 Upgrade Configuration

### Upgrade Properties
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `cost` | string/number | Cost formula or number | `"500 + (level * 300)"` |
| `time_cost` | number | Optional time cost | `20` (hours) |
| `max_level` | number | Maximum upgrade level | `3`, `5` |
| `effects` | array | Array of effects | See Effects section |
| `sets_flag` | string | Flag to set when purchased | `"has_portfolio"` |
| `requirements` | array | Prerequisites | See Requirements section |

### Example Upgrade Effect
```json
{
  "metric": "serviceSpeedMultiplier",
  "type": "percent",
  "value": 15
}
```
This adds +15% service speed per upgrade level.

---

## 📢 Marketing Configuration

### Marketing Properties
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `cost` | number | Cash cost | `50`, `100`, `150` |
| `time_cost` | number | Time cost | `1`, `2`, `4` |
| `cooldown_seconds` | number | Cooldown between uses | `30`, `60`, `120` |
| `effects` | array | Array of effects | Can have `durationSeconds` |
| `sets_flag` | string | Flag to set | `"has_portfolio"` |
| `requirements` | array | Prerequisites | See Requirements section |

### Temporary Effect Example
```json
{
  "metric": "serviceRevenueMultiplier",
  "type": "percent",
  "value": 15,
  "durationSeconds": 60
}
```
This adds +15% revenue for 60 seconds.

---

## 👥 Staff Configuration

### Staff Properties
| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `salary` | number | Monthly salary | `400`, `800`, `1500` |
| `effects` | array | Array of effects | Active while hired |
| `sets_flag` | string | Flag to set when hired | `"has_assistant"` |
| `requirements` | array | Prerequisites | See Requirements section |

### Staff Effect Example
```json
[
  {
    "metric": "monthlyExpenses",
    "type": "add",
    "value": 400
  },
  {
    "metric": "spawnIntervalSeconds",
    "type": "percent",
    "value": -15
  }
]
```
This adds $400/month expenses and reduces spawn interval by 15% (faster spawns).

---

## 🎲 Event Configuration

### Event Effect Types
| Type | Description | Example |
|------|-------------|---------|
| `cash` | Direct cash modification | `{"type": "cash", "amount": 300}` |
| `exp` | Direct EXP modification | `{"type": "exp", "amount": 5}` |
| `dynamicCash` | Formula-based cash | `{"type": "dynamicCash", "expression": "monthlyRevenue * 0.1"}` |
| `metric` | Standard metric effect | `{"type": "metric", "metric": "serviceRevenueMultiplier", "effectType": "percent", "value": 10, "durationSeconds": 90}` |

### Event Consequence Weight
- `weight: 100` = 100% chance (only consequence)
- `weight: 70` = 70% chance (if multiple consequences)
- Higher weight = more likely to occur

---

## 🏷️ Requirements System

### Requirement Types
| Type | Description | Example |
|------|-------------|---------|
| `flag` | Boolean flag requirement | `{"type": "flag", "id": "has_portfolio", "expected": true}` |
| `level` | Level requirement | `{"type": "level", "level": 3}` |
| `condition` | Condition requirement | `{"type": "condition", "id": "high_demand", "expected": true}` |

### Requirement Logic
- All requirements must be met (AND logic)
- `expected: true` = requirement must be met
- `expected: false` = requirement must NOT be met

---

## 📝 Win/Lose Conditions

### Win Condition
```json
{
  "cashTarget": 50000,                    // Win when reaching this cash
  "monthTarget": 10,                      // OR win after N months
  "customTitle": "Victory!",              // Optional custom title
  "customMessage": "You succeeded!"       // Optional custom message
}
```

### Lose Condition
```json
{
  "cashThreshold": 0,                     // Lose if cash <= this
  "timeThreshold": 0                      // Lose if time <= this (0 = disabled)
}
```

---

## 🎨 Visual Configuration

### Customer Images
- Array of image paths: `["/images/customer/customer1.png", ...]`
- Default: First image in array

### Staff Images
- Sprite image path: `"/images/staff/staff1.png"`
- Can be local or Supabase Storage URL

### Capacity Image
- Optional image for capacity display
- Set in `global_simulation_config.capacity_image` or industry config

---

## 🔧 Quick Balance Formulas

### Customer Spawn Rate
- **Faster**: `customerSpawnIntervalSeconds: 2` (was 3)
- **Slower**: `customerSpawnIntervalSeconds: 5` (was 3)

### Service Speed
- **Faster**: Effect `{"metric": "serviceSpeedMultiplier", "type": "percent", "value": 20}` (+20%)
- **Slower**: Effect `{"metric": "serviceSpeedMultiplier", "type": "percent", "value": -10}` (-10%)

### Revenue Boost
- **Small**: `serviceRevenueMultiplier: 1.1` (+10%)
- **Medium**: `serviceRevenueMultiplier: 1.25` (+25%)
- **Large**: `serviceRevenueMultiplier: 1.5` (+50%)

### Failure Rate
- **Low Risk**: `failureRate: 5` (5% failure chance)
- **Medium Risk**: `failureRate: 15` (15% failure chance)
- **High Risk**: `failureRate: 30` (30% failure chance)

---

**Last Updated**: Generated from codebase analysis
**Version**: 1.0

