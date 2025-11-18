# Effect System Architecture - Tech Lead Overview

## 🎯 High-Level Architecture

### Core Principle: **Two-Track System**

The effect system operates on **two parallel tracks**:

1. **Calculated Metrics** (via `effectManager`)
   - Metrics that are computed from base values + effects
   - Examples: `ServiceSpeedMultiplier`, `ServiceRooms`, `MonthlyExpenses`, `FreedomScore`
   - Formula: `(base + adds) × (1 + percents/100) × multiplies, then Set overrides`

2. **Direct State Metrics** (via direct state updates)
   - Metrics that are stored directly in game state
   - Examples: `Cash`, `Time`, `SkillLevel`
   - Modified immediately via `applyCashChange()`, `applyTimeChange()`, `applySkillLevelChange()`

---

## 📊 Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EFFECT SOURCES                            │
├─────────────────────────────────────────────────────────────┤
│  Marketing  │  Staff  │  Upgrades  │  Events               │
└──────┬───────┴────┬────┴──────┬─────┴──────┬────────────────┘
       │            │           │            │
       ▼            ▼           ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│              EFFECT APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  effectManager       │  │  Direct State Updates   │    │
│  │  (Calculated Metrics)│  │  (Cash/Time/SkillLevel) │    │
│  │                      │  │                          │    │
│  │  • ServiceSpeed      │  │  • applyCashChange()    │    │
│  │  • ServiceRooms      │  │  • applyTimeChange()    │    │
│  │  • MonthlyExpenses   │  │  • applySkillLevelChange│    │
│  │  • FreedomScore      │  │                          │    │
│  │  • Revenue Multipliers│  │  ⚠️ Special handling    │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────┐        ┌──────────────────┐
│  Calculated      │        │  Direct State    │
│  Values          │        │  Values          │
└──────────────────┘        └──────────────────┘
```

---

## 🔍 How Each Source Works

### 1. **Marketing Campaigns** ✅ **Consistent**
```typescript
// All effects go through effectManager
effectManager.add({
  metric: GameMetric.AnyMetric,  // ✅ Can use ANY metric
  type: EffectType.Add/Percent/Multiply/Set,
  value: number,
  durationSeconds: number | null
})
```
- ✅ **Fully consistent** - All metrics supported
- ✅ Temporary effects work perfectly
- ✅ Can modify Cash, Time, SkillLevel via `GameMetric.Cash/Time/SkillLevel`

### 2. **Staff** ✅ **Consistent**
```typescript
// All effects go through effectManager
effectManager.add({
  metric: GameMetric.AnyMetric,  // ✅ Can use ANY metric
  type: EffectType.Add/Percent/Multiply/Set,
  value: number
})
```
- ✅ **Fully consistent** - All metrics supported
- ✅ Permanent effects (until staff fired)
- ✅ Can modify Cash, Time, SkillLevel via `GameMetric.Cash/Time/SkillLevel`

### 3. **Upgrades** ✅ **Consistent**
```typescript
// All effects go through effectManager
effectManager.add({
  metric: GameMetric.AnyMetric,  // ✅ Can use ANY metric
  type: EffectType.Add/Percent/Multiply/Set,
  value: number * level  // Multiplied by upgrade level
})
```
- ✅ **Fully consistent** - All metrics supported
- ✅ Permanent effects (until upgrade removed)
- ✅ Can modify Cash, Time, SkillLevel via `GameMetric.Cash/Time/SkillLevel`

### 4. **Events** ⚠️ **Partially Consistent** (Legacy + New System)

Events have **TWO ways** to apply effects:

#### **A. Legacy Types** (Direct Application)
```typescript
// Old way - bypasses effectManager
{ type: 'cash', amount: number }
{ type: 'skillLevel', amount: number }
{ type: 'dynamicCash', expression: string }
```
- ⚠️ **Legacy support** - Still works but bypasses effectManager
- ⚠️ Only supports Add operations
- ⚠️ No temporary effects for Cash/Time/SkillLevel

#### **B. New Metric Type** (Via effectManager)
```typescript
// New way - uses effectManager
{ 
  type: 'metric', 
  metric: GameMetric.AnyMetric,  // ✅ Can use ANY metric
  effectType: EffectType.Add/Percent/Multiply/Set,
  value: number,
  durationSeconds?: number
}
```
- ✅ **Fully consistent** - All metrics supported
- ✅ Supports all effect types
- ✅ Temporary effects work (for non-direct-state metrics)

---

## ⚠️ Inconsistencies & Why They Exist

### **Issue 1: Cash/Time/SkillLevel Special Handling**

**Problem:**
- Cash, Time, SkillLevel are **direct state values** (stored in `metrics` object)
- Other metrics are **calculated on-demand** (via `effectManager.calculate()`)

**Why:**
- Direct state metrics need immediate updates for game over checks
- Calculated metrics are computed when needed (performance optimization)

**Current Behavior:**
- ✅ **Marketing/Staff/Upgrades**: Cash/Time/SkillLevel go through effectManager, but...
  - For `Add` effects: Applied immediately to state
  - For `Percent/Multiply/Set`: Calculated then applied (works but complex)
- ⚠️ **Events**: Has legacy `'cash'` and `'skillLevel'` types that bypass effectManager

### **Issue 2: Temporary Effects for Direct State Metrics**

**Problem:**
- Temporary Cash/Time/SkillLevel effects don't automatically reverse
- Example: Marketing campaign gives +$1000 for 30 seconds → doesn't reverse

**Why:**
- Would require tracking original values and reversing on expiration
- Complex to implement correctly

**Current Behavior:**
- ✅ Temporary effects work for calculated metrics (ServiceSpeed, etc.)
- ⚠️ Temporary Cash/Time/SkillLevel effects are "permanent until manually reversed"

---

## 💡 Tech Lead Recommendations

### **Option A: Keep Current Architecture** (Recommended for Now)

**Pros:**
- ✅ Works well for most use cases
- ✅ Marketing/Staff/Upgrades are fully consistent
- ✅ Events can use new `'metric'` type for full consistency
- ✅ Simple to understand

**Cons:**
- ⚠️ Events have legacy types (but they still work)
- ⚠️ Temporary Cash/Time/SkillLevel effects don't auto-reverse

**Action Items:**
1. ✅ **Code is fine** - No changes needed
2. 📝 **Content Guidelines**:
   - Use `'metric'` type in events (not legacy `'cash'`/`'skillLevel'`)
   - Avoid temporary Cash/Time/SkillLevel effects (or accept they're permanent)
   - Marketing/Staff/Upgrades can use any metric freely

### **Option B: Full Unification** (Future Enhancement)

**If you want 100% consistency:**

1. **Remove legacy event types** (`'cash'`, `'skillLevel'`, `'dynamicCash'`)
   - Migrate all events to use `'metric'` type
   - More work but cleaner architecture

2. **Add temporary effect reversal for direct state metrics**
   ```typescript
   // Track original values
   const originalCash = metrics.cash;
   effectManager.add({ metric: GameMetric.Cash, ... });
   // On expiration, restore original value
   ```
   - More complex but enables temporary Cash/Time/SkillLevel effects

**When to do this:**
- When you have time for a refactor
- When temporary Cash/Time/SkillLevel effects become important
- When you want to remove all legacy code

---

## 📋 Consistency Matrix

| Source | Calculated Metrics | Cash | Time | SkillLevel | Temporary Effects |
|--------|-------------------|------|------|------------|-------------------|
| **Marketing** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (except Cash/Time/SkillLevel) |
| **Staff** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (permanent) |
| **Upgrades** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (permanent) |
| **Events (new)** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (except Cash/Time/SkillLevel) |
| **Events (legacy)** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ❌ No |

**Legend:**
- ✅ = Fully supported
- ⚠️ = Supported but with limitations
- ❌ = Not supported

---

## 🎮 Content vs Code Guidelines

### **What to Configure in Content (Database/Admin Panel):**

✅ **All of these can be configured without code changes:**
- Marketing campaign effects (any metric, any type)
- Staff effects (any metric, any type)
- Upgrade effects (any metric, any type)
- Event effects (use `'metric'` type for consistency)

### **What Requires Code Changes:**

❌ **These need code changes:**
- Adding new `GameMetric` enum values
- Adding new `EffectType` enum values
- Changing effect calculation formula
- Adding new effect sources (beyond Marketing/Staff/Upgrades/Events)

---

## 🚀 Best Practices

### **For Content Creators:**

1. **Use `'metric'` type in events** (not legacy `'cash'`/`'skillLevel'`)
   ```json
   // ✅ Good
   { "type": "metric", "metric": "cash", "effectType": "add", "value": 1000 }
   
   // ⚠️ Works but legacy
   { "type": "cash", "amount": 1000 }
   ```

2. **Avoid temporary Cash/Time/SkillLevel effects** (or accept they're permanent)
   - Marketing campaigns with temporary Cash effects won't reverse
   - Use permanent effects or calculated metrics instead

3. **All effect types work everywhere** (Add, Percent, Multiply, Set)
   - Marketing: ✅ All types
   - Staff: ✅ All types
   - Upgrades: ✅ All types
   - Events: ✅ All types (via `'metric'` type)

### **For Developers:**

1. **New metrics**: Add to `GameMetric` enum → automatically works everywhere
2. **New effect types**: Add to `EffectType` enum → automatically works everywhere
3. **New effect sources**: Follow Marketing/Staff/Upgrades pattern → use `effectManager.add()`

---

## 📝 Summary

**Current State:**
- ✅ **Marketing/Staff/Upgrades**: Fully consistent, all metrics supported
- ⚠️ **Events**: Has legacy types but new `'metric'` type is fully consistent
- ⚠️ **Temporary Cash/Time/SkillLevel**: Don't auto-reverse (by design)

**Recommendation:**
- ✅ **Keep current architecture** - It works well
- 📝 **Use `'metric'` type in events** for consistency
- 🎮 **Configure effects in content** - No code changes needed for most cases

**The system is consistent enough for production use. The inconsistencies are intentional design decisions (direct state vs calculated metrics) and legacy support (events).**

