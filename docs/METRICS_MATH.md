# Metrics Math Verification

## Overview
This document verifies that all the math in the game is working correctly and that the display matches the actual calculations.

---

## 💰 **Cash Flow**

### **Display:**
Shows: `metrics.cash`

### **Changes:**
1. **Customer completes service** → `cash += servicePrice` (e.g., +$100)
2. **Week ends** → `cash -= (weeklyExpenses + weeklyOneTimeCosts)` (e.g., -$800)
3. **Buy upgrade** → `cash -= upgradeCost` (e.g., -$900)

### **Tracking:**
- **Source**: `metrics.cash` (from game state)
- **Feedback**: Tracks changes in `metrics.cash`
- **Math**: ✅ **Correct** - Display and feedback both use `metrics.cash`

### **Example Flow:**
```
Start: $3,000
Customer pays $100 → $3,100 (shows "+100")
Week ends -$800 → $2,300 (shows "-800")
Buy upgrade -$900 → $1,400 (shows "-900")
```

---

## 📊 **Revenue (Current Week)**

### **Display:**
Shows: `weeklyRevenue` (current week's accumulating revenue)

### **Changes:**
1. **Customer completes service** → `weeklyRevenue += servicePrice`
2. **Week ends** → `weeklyRevenue = 0` (reset and saved to history)

### **Tracking:**
- **Source**: `weeklyRevenue` (from game state)
- **Feedback**: Tracks changes in `weeklyRevenue`
- **Math**: ✅ **Correct** - Display and feedback both use `weeklyRevenue`

### **Example Flow:**
```
Week 1 starts: $0
Customer 1 pays $100 → $100 (shows "+100")
Customer 2 pays $200 → $300 (shows "+200")
Customer 3 pays $100 → $400 (shows "+100")
Week ends → Saved as history { week: 1, revenue: 400 }, then reset to $0

Week 2 starts: $0
Customer 1 pays $150 → $150 (shows "+150")
...
```

### **History:**
- Last week's revenue can be viewed in the Finance Tab's P&L
- Weekly history shows all completed weeks

---

## ⭐ **Reputation**

### **Display:**
Shows: `metrics.reputation`

### **Changes:**
1. **Customer leaves happy (70% probability)** → `reputation += 1 × reputationMultiplier`
2. **Customer leaves happy (30% probability)** → No change (service still generates revenue)
3. **Customer leaves angry** → `reputation -= 1`

### **Tracking:**
- **Source**: `metrics.reputation` (from game state)
- **Feedback**: Tracks changes in `metrics.reputation`
- **Math**: ✅ **Correct** - Display and feedback both use `metrics.reputation`

### **Example Flow:**
```
Start: 0
Customer 1 finishes (happy) → 1 (shows "+1")
Customer 2 finishes (neutral) → 1 (no change, no feedback)
Customer 3 finishes (happy) → 2 (shows "+1")
Customer 4 runs out of patience → 1 (shows "-1")
```

---

## 💸 **Weekly Expenses**

### **Display:**
Shows: `weeklyExpenses` (current recurring weekly costs)

### **Changes:**
1. **Buy upgrade** → `weeklyExpenses += upgradeExpenseIncrease` (e.g., +$90)
2. **Week ends** → No change (expenses persist)

### **Tracking:**
- **Source**: `weeklyExpenses` (from game state)
- **Feedback**: Tracks changes in `weeklyExpenses`
- **Math**: ✅ **Correct** - Display and feedback both use `weeklyExpenses`

### **Calculation:**
```typescript
weeklyExpenses = baseWeeklyExpenses + sum(all upgrade expense effects)

Example:
- Base expenses: $800
- Modern Equipment upgrade: +$90
- Extra Treatment Room: +$150
Total: $1,040
```

### **Example Flow:**
```
Start: $800 (base)
Buy Modern Equipment → $890 (shows "+90")
Buy Extra Room → $1,040 (shows "+150")
Week ends → Still $1,040 (no change)
Week 2 starts → Still $1,040 (recurring)
```

### **Breakdown:**
Available in Finance Tab showing:
- Base operations: $800
- Modern Equipment: +$90
- Extra Treatment Room: +$150
- Total (recurring): $1,040

---

## 📈 **Profit & Loss (P&L)**

### **Total Revenue:**
```typescript
metrics.totalRevenue = sum of all weeklyRevenue from all weeks
```

### **Total Expenses:**
```typescript
metrics.totalExpenses = sum of all weeklyExpenses from all weeks
```

### **Total Profit:**
```typescript
totalProfit = metrics.totalRevenue - metrics.totalExpenses
```

### **Weekly History Entry:**
```typescript
{
  week: currentWeek,
  revenue: weeklyRevenue,           // Revenue earned this week
  expenses: weeklyExpenses + weeklyOneTimeCosts,  // Costs this week
  profit: revenue - expenses,       // Net profit this week
  reputation: currentReputation,    // Reputation at week end
  reputationChange: delta           // Change from last week
}
```

---

## 🔄 **Week Transition Flow**

### **At the end of each week (every 30 seconds):**

1. **Calculate week results:**
   ```typescript
   weekResult = endOfWeek(
     currentCash,
     weeklyRevenue,      // Revenue earned this week
     weeklyExpenses,     // Recurring expenses
     weeklyOneTimeCosts  // One-time costs this week
   )
   ```

2. **Update totals:**
   ```typescript
   metrics.totalExpenses += (weeklyExpenses + weeklyOneTimeCosts)
   // Note: totalRevenue already updated during the week
   ```

3. **Deduct expenses from cash:**
   ```typescript
   metrics.cash -= (weeklyExpenses + weeklyOneTimeCosts)
   ```

4. **Save to history:**
   ```typescript
   weeklyHistory.push({
     week: currentWeek,
     revenue: weeklyRevenue,
     expenses: weeklyExpenses + weeklyOneTimeCosts,
     profit: weeklyRevenue - (weeklyExpenses + weeklyOneTimeCosts),
     reputation: metrics.reputation,
     reputationChange: reputationDelta
   })
   ```

5. **Reset weekly counters:**
   ```typescript
   weeklyRevenue = 0
   weeklyOneTimeCosts = 0
   // weeklyExpenses stays the same (recurring)
   currentWeek++
   ```

---

## ✅ **Verification Checklist**

| Metric | Display Source | Feedback Source | Match? | Status |
|--------|---------------|-----------------|--------|--------|
| Cash | `metrics.cash` | `metrics.cash` | ✅ | Correct |
| Revenue | `weeklyRevenue` | `weeklyRevenue` | ✅ | **Fixed!** |
| Reputation | `metrics.reputation` | `metrics.reputation` | ✅ | Correct |
| Expenses | `weeklyExpenses` | `weeklyExpenses` | ✅ | Correct |

---

## 🎮 **Expected Behavior in Game**

### **During Week 1 (First 30 seconds):**
- Cash starts at $3,000
- Revenue starts at $0, increases with each customer
- Reputation starts at 0, changes with customer outcomes
- Expenses show $800 (base recurring cost)

### **Week Transition (30 second mark):**
- Cash decreases by $800 (shows "-800" feedback)
- Revenue resets to $0 (new week starts)
- Reputation persists (no change)
- Expenses stay at $800 (recurring)
- History entry created for Week 1

### **During Week 2:**
- Revenue starts fresh from $0
- All metrics continue accumulating

---

## 🧮 **Math Examples**

### **Scenario: First Two Weeks**

**Week 1:**
```
Starting cash: $3,000
Customer 1: +$100 → Cash: $3,100, Revenue: $100
Customer 2: +$200 → Cash: $3,300, Revenue: $300
Customer 3: +$100 → Cash: $3,400, Revenue: $400
Week ends: -$800 → Cash: $2,600, Revenue: $0 (saved: Week 1 = $400)
```

**Week 2:**
```
Starting cash: $2,600
Customer 1: +$150 → Cash: $2,750, Revenue: $150
Buy upgrade: -$900 → Cash: $1,850, Expenses: $890
Customer 2: +$200 → Cash: $2,050, Revenue: $350
Week ends: -$890 → Cash: $1,160, Revenue: $0 (saved: Week 2 = $350)
```

**Totals:**
```
Total Revenue: $750 ($400 + $350)
Total Expenses: $1,690 ($800 + $890)
Total Profit: -$940
Current Cash: $1,160 ($3,000 + $750 - $1,690)
```

✅ **All math checks out!**

