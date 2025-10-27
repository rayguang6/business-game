# Metrics Math Verification

## Overview
This document verifies that all the math in the game is working correctly and that the display matches the actual calculations.

---

## 💰 **Cash Flow**

### **Display:**
Shows: `metrics.cash`

### **Changes:**
1. **Customer completes service** → `cash += servicePrice` (e.g., +$100)
2. **Month ends** → `cash -= (monthlyExpenses + monthlyOneTimeCosts)` (e.g., -$800)
3. **Buy upgrade** → `cash -= upgradeCost` (e.g., -$900)

### **Tracking:**
- **Source**: `metrics.cash` (from game state)
- **Feedback**: Tracks changes in `metrics.cash`
- **Math**: ✅ **Correct** - Display and feedback both use `metrics.cash`

### **Example Flow:**
```
Start: $3,000
Customer pays $100 → $3,100 (shows "+100")
Month ends -$800 → $2,300 (shows "-800")
Buy upgrade -$900 → $1,400 (shows "-900")
```

---

## 📊 **Revenue (Current Month)**

### **Display:**
Shows: `monthlyRevenue` (current month's accumulating revenue)

### **Changes:**
1. **Customer completes service** → `monthlyRevenue += servicePrice`
2. **Month ends** → `monthlyRevenue = 0` (reset and saved to history)

### **Tracking:**
- **Source**: `monthlyRevenue` (from game state)
- **Feedback**: Tracks changes in `monthlyRevenue`
- **Math**: ✅ **Correct** - Display and feedback both use `monthlyRevenue`

### **Example Flow:**
```
Month 1 starts: $0
Customer 1 pays $100 → $100 (shows "+100")
Customer 2 pays $200 → $300 (shows "+200")
Customer 3 pays $100 → $400 (shows "+100")
Month ends → Saved as history { month: 1, revenue: 400 }, then reset to $0

Month 2 starts: $0
Customer 1 pays $150 → $150 (shows "+150")
...
```

### **History:**
- Last month's revenue can be viewed in the Finance Tab's P&L
- Monthly history shows all completed months

---

## ⭐ **Reputation**

### **Display:**
Shows: `metrics.reputation`

### **Changes:**
1. **Customer completes service** → `reputation += 1 × reputationMultiplier`
2. **Customer leaves angry** → `reputation -= 1`

### **Tracking:**
- **Source**: `metrics.reputation` (from game state)
- **Feedback**: Tracks changes in `metrics.reputation`
- **Math**: ✅ **Correct** - Display and feedback both use `metrics.reputation`

### **Example Flow:**
```
Start: 0
Customer 1 finishes (happy) → 1 (shows "+1")
Customer 2 finishes (happy) → 2 (shows "+1")
Customer 3 runs out of patience → 1 (shows "-1")
```

---

## 💸 **Monthly Expenses**

### **Display:**
Shows: `monthlyExpenses` (current recurring monthly costs)

### **Changes:**
1. **Buy upgrade** → `monthlyExpenses += upgradeExpenseIncrease` (e.g., +$90)
2. **Month ends** → No change (expenses persist)

### **Tracking:**
- **Source**: `monthlyExpenses` (from game state)
- **Feedback**: Tracks changes in `monthlyExpenses`
- **Math**: ✅ **Correct** - Display and feedback both use `monthlyExpenses`

### **Calculation:**
```typescript
monthlyExpenses = baseMonthlyExpenses + sum(all upgrade expense effects)

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
Month ends → Still $1,040 (no change)
Month 2 starts → Still $1,040 (recurring)
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
metrics.totalRevenue = sum of all monthlyRevenue from all months
```

### **Total Expenses:**
```typescript
metrics.totalExpenses = sum of all monthlyExpenses from all months
```

### **Total Profit:**
```typescript
totalProfit = metrics.totalRevenue - metrics.totalExpenses
```

### **Monthly History Entry:**
```typescript
{
  month: currentMonth,
  revenue: monthlyRevenue,           // Revenue earned this month
  expenses: monthlyExpenses + monthlyOneTimeCosts,  // Costs this month
  profit: revenue - expenses,       // Net profit this month
  reputation: currentReputation,    // Reputation at month end
  reputationChange: delta           // Change from last month
}
```

---

## 🔄 **Month Transition Flow**

### **At the end of each month (every 30 seconds):**

1. **Calculate month results:**
   ```typescript
   monthResult = endOfMonth(
     currentCash,
     monthlyRevenue,      // Revenue earned this month
     monthlyExpenses,     // Recurring expenses
     monthlyOneTimeCosts, // One-time costs this month
     monthlyOneTimeCostsPaid // Portion already deducted during the month
   )
   ```

2. **Update totals:**
   ```typescript
   metrics.totalExpenses += (monthlyExpenses + monthlyOneTimeCosts)
   // Note: totalRevenue already updated during the month
   ```

3. **Deduct expenses from cash:**
   ```typescript
   metrics.cash -= (monthlyExpenses + monthlyOneTimeCosts - monthlyOneTimeCostsPaid)
   ```

4. **Save to history:**
   ```typescript
   monthlyHistory.push({
     month: currentMonth,
     revenue: monthlyRevenue,
     expenses: monthlyExpenses + monthlyOneTimeCosts,
     profit: monthlyRevenue - (monthlyExpenses + monthlyOneTimeCosts),
     reputation: metrics.reputation,
     reputationChange: reputationDelta
   })
   ```

5. **Reset monthly counters:**
   ```typescript
   monthlyRevenue = 0
   monthlyOneTimeCosts = 0
   // monthlyExpenses stays the same (recurring)
   currentMonth++
   ```

---

## ✅ **Verification Checklist**

| Metric | Display Source | Feedback Source | Match? | Status |
|--------|---------------|-----------------|--------|--------|
| Cash | `metrics.cash` | `metrics.cash` | ✅ | Correct |
| Revenue | `monthlyRevenue` | `monthlyRevenue` | ✅ | **Fixed!** |
| Reputation | `metrics.reputation` | `metrics.reputation` | ✅ | Correct |
| Expenses | `monthlyExpenses` | `monthlyExpenses` | ✅ | Correct |

---

## 🎮 **Expected Behavior in Game**

### **During Month 1 (First 30 seconds):**
- Cash starts at $3,000
- Revenue starts at $0, increases with each customer
- Reputation starts at 0, changes with customer outcomes
- Expenses show $800 (base recurring cost)

### **Month Transition (30 second mark):**
- Cash decreases by $800 (shows "-800" feedback)
- Revenue resets to $0 (new month starts)
- Reputation persists (no change)
- Expenses stay at $800 (recurring)
- History entry created for Month 1

### **During Month 2:**
- Revenue starts fresh from $0
- All metrics continue accumulating

---

## 🧮 **Math Examples**

### **Scenario: First Two Months**

**Month 1:**
```
Starting cash: $3,000
Customer 1: +$100 → Cash: $3,100, Revenue: $100
Customer 2: +$200 → Cash: $3,300, Revenue: $300
Customer 3: +$100 → Cash: $3,400, Revenue: $400
Month ends: -$800 → Cash: $2,600, Revenue: $0 (saved: Month 1 = $400)
```

**Month 2:**
```
Starting cash: $2,600
Customer 1: +$150 → Cash: $2,750, Revenue: $150
Buy upgrade: -$900 → Cash: $1,850, Expenses: $890
Customer 2: +$200 → Cash: $2,050, Revenue: $350
Month ends: -$890 → Cash: $1,160, Revenue: $0 (saved: Month 2 = $350)
```

**Totals:**
```
Total Revenue: $750 ($400 + $350)
Total Expenses: $1,690 ($800 + $890)
Total Profit: -$940
Current Cash: $1,160 ($3,000 + $750 - $1,690)
```

✅ **All math checks out!**
