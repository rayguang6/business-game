# Event Effect Types - Cash vs Metric Cash

## Overview

There are two ways to affect cash in events:
1. **`EventEffectType.Cash`** - Simple, direct cash effect
2. **`EventEffectType.Metric` with `GameMetric.Cash`** - Flexible metric effect

## Differences

### 1. **`EventEffectType.Cash`** (Simple)

**Structure:**
```typescript
{
  type: EventEffectType.Cash,
  amount: number,        // Direct amount (e.g., 100 or -50)
  label?: string         // Optional custom label
}
```

**Characteristics:**
- ✅ **Always immediate** - Applied right away
- ✅ **Always Add effect** - Simple addition/subtraction
- ✅ **No duration** - Permanent change
- ✅ **No priority** - Applied in order
- ✅ **Goes through revenue/expense tracking** - Shows up in PnL with proper source tracking
- ✅ **Simple to use** - Just specify amount

**Example:**
```json
{
  "type": "cash",
  "amount": -100,
  "label": "Repair cost"
}
```

**Code Path:**
```typescript
// eventSlice.ts line 258-272
case EventEffectType.Cash: {
  recordEventRevenue/recordEventExpense(amount, sourceInfo, label);
  return; // Immediate, no effectManager
}
```

---

### 2. **`EventEffectType.Metric` with `GameMetric.Cash`** (Flexible)

**Structure:**
```typescript
{
  type: EventEffectType.Metric,
  metric: GameMetric.Cash,
  effectType: EffectType,        // Add, Percent, Multiply, Set
  value: number,                  // Value based on effectType
  durationSeconds?: number | null, // Optional duration (null = permanent)
  priority?: number                // Optional priority
}
```

**Characteristics:**
- ✅ **Flexible effect types** - Can use Add, Percent, Multiply, or Set
- ✅ **Can have duration** - Temporary effects (e.g., +10% cash for 60 seconds)
- ✅ **Can have priority** - Control order of application
- ✅ **More complex** - Requires understanding effect types
- ⚠️ **Behavior depends on effectType**:
  - `EffectType.Add` → Goes through revenue/expense tracking (like Cash)
  - `EffectType.Percent/Multiply/Set` → Goes through effectManager (different path)

**Example 1: Add (Same as Cash):**
```json
{
  "type": "metric",
  "metric": "cash",
  "effectType": "add",
  "value": -100
}
```
→ Behaves exactly like `EventEffectType.Cash`

**Example 2: Percent (Different):**
```json
{
  "type": "metric",
  "metric": "cash",
  "effectType": "percent",
  "value": 10,
  "durationSeconds": 60
}
```
→ Increases cash by 10% for 60 seconds (temporary boost)

**Example 3: Multiply:**
```json
{
  "type": "metric",
  "metric": "cash",
  "effectType": "multiply",
  "value": 1.5
}
```
→ Multiplies current cash by 1.5x

**Code Path:**
```typescript
// eventSlice.ts line 296-325
case EventEffectType.Metric: {
  if (effect.metric === GameMetric.Cash && effect.effectType === EffectType.Add) {
    // Same as EventEffectType.Cash - goes through revenue tracking
    recordEventRevenue/recordEventExpense(value, sourceInfo, label);
  } else {
    // Other effect types go through effectManager
    effectManager.add({ ... });
  }
}
```

---

## When to Use Which?

### Use `EventEffectType.Cash` when:
- ✅ You want simple, immediate cash change
- ✅ You want it tracked in PnL (revenue/expense)
- ✅ You want a permanent change
- ✅ You don't need percentage/multiplier effects
- ✅ **Most common use case** - Simple event payouts/costs

### Use `EventEffectType.Metric` with `GameMetric.Cash` when:
- ✅ You need percentage-based effects (e.g., "+10% of current cash")
- ✅ You need multiplier effects (e.g., "×1.5 cash")
- ✅ You need temporary effects (duration)
- ✅ You need priority control
- ✅ You need Set effects (force cash to specific value)
- ⚠️ **Note:** Only `EffectType.Add` goes through revenue tracking

---

## Important Notes

### ⚠️ **Potential Issue: Delayed Effects**

There's a **bug/inconsistency** in the code:

**Immediate Effects (resolveEventChoice):**
- `EventEffectType.Cash` → ✅ Uses `recordEventRevenue`/`recordEventExpense` (tracked)
- `EventEffectType.Metric` with `GameMetric.Cash` + `Add` → ✅ Uses `recordEventRevenue`/`recordEventExpense` (tracked)

**Delayed Effects (clearLastDelayedOutcome):**
- `EventEffectType.Cash` → ✅ Uses `recordEventRevenue`/`recordEventExpense` (tracked)
- `EventEffectType.Metric` with `GameMetric.Cash` + `Add` → ❌ Uses `applyCashChange` directly (NOT tracked in PnL!)

**Location:** `eventSlice.ts` line 700-701

This means delayed metric cash effects with `Add` type bypass revenue tracking, which is inconsistent.

---

## Summary Table

| Feature | `EventEffectType.Cash` | `EventEffectType.Metric` (Cash + Add) | `EventEffectType.Metric` (Cash + Other) |
|---------|------------------------|----------------------------------------|------------------------------------------|
| **Effect Types** | Add only | Add only | Add, Percent, Multiply, Set |
| **Duration** | No (permanent) | No (permanent) | Yes (optional) |
| **Priority** | No | No | Yes (optional) |
| **PnL Tracking** | ✅ Yes | ✅ Yes (immediate) ❌ No (delayed) | ❌ No (goes through effectManager) |
| **Complexity** | Simple | Simple | Complex |
| **Use Case** | Simple payouts/costs | Simple payouts/costs | Advanced effects |

---

## Recommendation

**For most cases, use `EventEffectType.Cash`:**
- Simpler
- Always tracked in PnL
- More predictable behavior
- Better for event payouts/costs

**Only use `EventEffectType.Metric` with `GameMetric.Cash` if you need:**
- Percentage or multiplier effects
- Temporary effects (duration)
- Priority control

**Fix needed:** The delayed effect handling for `EventEffectType.Metric` with `GameMetric.Cash` + `Add` should use `recordEventRevenue`/`recordEventExpense` instead of `applyCashChange` for consistency.

