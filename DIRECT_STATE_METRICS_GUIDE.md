# Direct State Metrics Guide

## 🎯 Overview

**Direct State Metrics** are metrics that are stored directly in game state and modified via one-time permanent effects (add/subtract). They are **NOT** calculated every tick.

### The 4 Direct State Metrics:

1. **Cash** 💵 - Money available
2. **Time** ⏰ - Monthly time budget (resets each month)
3. **Skill Level** ⭐ - Player's skill level
4. **Freedom Score** 🕐 - Workload/freedom level

---

## 🔄 How They Work

### **Cash**
- **Storage**: `metrics.cash` (direct state)
- **Modification**: `applyCashChange(amount)`
- **Reset**: Never resets (persists across months)
- **Game Over**: If cash ≤ 0

### **Time**
- **Storage**: `metrics.time` (direct state)
- **Modification**: `applyTimeChange(amount)`
- **Reset**: **Resets monthly** to `getStartingTime(industryId)`
- **Game Over**: If time ≤ 0 (only if time system enabled)
- **How it works**:
  - Time is a **monthly budget** (like hours per month)
  - At month end, it resets to starting value
  - Effects on Time are **permanent additions/subtractions** that persist until month resets
  - Example: +10 hours from event → stays until month resets

### **Skill Level**
- **Storage**: `metrics.skillLevel` (direct state)
- **Modification**: `applySkillLevelChange(amount)`
- **Reset**: Never resets (persists across months)
- **Game Over**: Not used (removed from lose conditions)

### **Freedom Score**
- **Storage**: `metrics.freedomScore` (direct state)
- **Modification**: `applyFreedomScoreChange(amount)`
- **Reset**: Never resets (persists across months)
- **Game Over**: Not used (but could be added)
- **Common Use Cases**:
  - Hiring staff reduces workload (negative effect)
  - Getting retainer increases freedom (positive effect)
  - Rare but important metric

---

## ⚠️ Important Rules

### **1. No Duration/Temporary Effects**

**Direct state metrics are ALWAYS permanent (one-time add/subtract).**

❌ **Don't do this:**
```json
{
  "metric": "cash",
  "type": "add",
  "value": -100,
  "durationSeconds": 30  // ❌ Duration ignored!
}
```

✅ **Do this instead:**
```json
{
  "metric": "cash",
  "type": "add",
  "value": -100
  // No duration - permanent effect
}
```

**Why?**
- Direct state metrics don't track original values
- Reversing temporary effects would be complex and error-prone
- Content creators should use permanent effects only

### **2. Effect Types**

**All effect types work, but Add is most common:**

- ✅ **Add**: `+100` or `-50` (most common for direct state)
- ✅ **Percent**: `+10%` (10% increase)
- ✅ **Multiply**: `×1.5` (50% increase)
- ✅ **Set**: `= 1000` (set to exact value)

**Example:**
```json
// Add $1000 cash
{ "metric": "cash", "type": "add", "value": 1000 }

// Increase skill level by 10%
{ "metric": "skillLevel", "type": "percent", "value": 10 }

// Set time to 100 hours
{ "metric": "time", "type": "set", "value": 100 }
```

### **3. Time Monthly Reset**

**Time resets to starting value each month:**

```typescript
// At month end:
time = getStartingTime(industryId)  // Resets to starting value
```

**Effects on Time:**
- Effects are applied **during the month**
- At month end, Time resets to starting value
- Effects don't carry over to next month (by design)

**Example:**
- Starting Time: 100 hours
- Event gives +10 hours → Time = 110 hours
- Month ends → Time resets to 100 hours
- The +10 hours effect is "lost" (monthly reset)

**If you want permanent Time increase:**
- Use upgrades/staff that modify `startingTime` in config (not via effects)

---

## 📋 Where Direct State Metrics Can Be Modified

### ✅ **Marketing Campaigns**
```json
{
  "effects": [
    { "metric": "cash", "type": "add", "value": 500 }
  ]
}
```

### ✅ **Staff**
```json
{
  "effects": [
    { "metric": "freedomScore", "type": "add", "value": -10 }  // Reduces workload
  ]
}
```

### ✅ **Upgrades**
```json
{
  "effects": [
    { "metric": "skillLevel", "type": "add", "value": 5 }
  ]
}
```

### ✅ **Events**
```json
{
  "type": "metric",
  "metric": "time",
  "effectType": "add",
  "value": 10
}
```

---

## 🎮 HUD Display

All 4 direct state metrics are shown on the HUD:

```
┌─────────────────────────────────────┐
│  💵 Cash: $10,000                   │
│  ⭐ Skill Level: 50                 │
│  ⏰ Available Time: 100h             │
│  🕐 Freedom Score: 360              │
└─────────────────────────────────────┘
```

---

## 🔍 Content Validation

### **Admin Panel Warning**

When creating effects on direct state metrics with duration:

⚠️ **Warning**: "Direct state metrics (Cash, Time, Skill Level, Freedom Score) don't support temporary effects. Duration will be ignored. Use permanent effects only."

### **Best Practices**

1. ✅ Use **Add** type for direct state metrics (most intuitive)
2. ✅ Use **permanent effects** (no duration)
3. ⚠️ Be careful with **Time** - effects reset monthly
4. ✅ **FreedomScore** is rare - use for staff/retainers

---

## 🐛 Common Mistakes

### **Mistake 1: Temporary Cash Effect**
```json
// ❌ Bad - Duration ignored
{
  "metric": "cash",
  "type": "add",
  "value": -1000,
  "durationSeconds": 30
}
```
**Result**: Cash is permanently deducted (duration ignored)

### **Mistake 2: Expecting Time to Persist**
```json
// ⚠️ Works but resets monthly
{
  "metric": "time",
  "type": "add",
  "value": 10
}
```
**Result**: +10 hours this month, but resets next month

### **Mistake 3: Using Calculated Metrics**
```json
// ❌ Wrong - FreedomScore is now direct state
{
  "metric": "freedomScore",
  "type": "add",
  "value": -10
}
// This should work, but make sure it's applied directly, not calculated
```

---

## 📝 Summary

| Metric | Storage | Reset | Game Over | Common Use |
|--------|---------|-------|-----------|------------|
| **Cash** | Direct | Never | Yes (≤0) | Events, revenue |
| **Time** | Direct | Monthly | Yes (≤0) | Monthly budget |
| **Skill Level** | Direct | Never | No | Events, customers |
| **Freedom Score** | Direct | Never | No | Staff, retainers |

**Key Points:**
- ✅ All 4 metrics are direct state (not calculated)
- ✅ All support Add/Percent/Multiply/Set effects
- ✅ All are permanent (no duration tracking)
- ⚠️ Time resets monthly (by design)
- ✅ Content validation prevents temporary effects

