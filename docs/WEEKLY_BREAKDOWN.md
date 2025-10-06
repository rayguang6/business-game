# Weekly Revenue & Expense Breakdown

## Overview
The Finance Tab now shows detailed breakdowns for both revenue and expenses in each week's history, making it easy to understand where money came from and where it went.

---

## 📊 **Visual Layout**

### **Week Display Format:**

```
┌─────────────────────────────────────────────────────────┐
│ Week 2 [Latest]                      Profit: $-100      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Revenue                    Expenses                     │
│  $800                       $900                         │
│  ├─ Customer payments: $800 ├─ Recurring costs: $800    │
│  │                           ├─ 🔧 Modern Equipment: $100│
│  │                           │                           │
│  └─ (Future revenue sources)└─ (Other one-time costs)   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 **Revenue Breakdown**

### **Current Implementation:**
Shows all sources of revenue with their amounts

**Main Category:**
- **Customer payments** - Money earned from completed services

**Future Revenue Sources** (placeholders in comments):
- Bonuses
- Investment income  
- Special event rewards
- Tips/Gratuities

### **Example:**
```
Revenue                     $1,200
├─ Customer payments        $1,200
└─ (Future sources)
```

---

## 💸 **Expense Breakdown**

### **Current Implementation:**
Shows all costs separated into recurring and one-time

**Categories:**
1. **Recurring costs** - Weekly operational expenses (base + upgrades)
2. **One-time costs** - Purchases made this week:
   - 🔧 **Upgrades** - Equipment, rooms, training
   - 🔨 **Repairs** - Equipment breakdowns (future)
   - 📋 **Events** - Marketing campaigns, special events (future)

### **Example:**
```
Expenses                    $1,890
├─ Recurring costs          $890
│  ├─ Base operations: $800
│  └─ Modern Equipment: $90 (recurring cost)
│
└─ One-time costs:
   └─ 🔧 Extra Treatment Room  $1,000 (purchase price)
```

---

## 🎯 **Calculation Logic**

### **Revenue Total:**
```typescript
weeklyRevenue = sum(all customer payments during the week)
```

### **Expenses Total:**
```typescript
weeklyExpenses = recurringCosts + oneTimeCosts

recurringCosts = baseOperations + sum(upgrade recurring costs)
oneTimeCosts = sum(upgrade purchases, repairs, events)
```

### **Example Breakdown:**

**Week 2 Scenario:**
```
Starting Week:
- Base recurring: $800
- Upgrade recurring: $90 (from Modern Equipment bought week 1)
- Total recurring: $890

During Week:
- Buy "Extra Treatment Room" for $1,000 (one-time)
- This adds $150 to future recurring costs

Week End Calculation:
- Revenue: $1,200 (12 customers × $100 avg)
- Recurring Costs: $890
- One-time Costs: $1,000 (Extra Room purchase)
- Total Expenses: $1,890
- Profit: $1,200 - $1,890 = -$690

Display:
Revenue: $1,200
  └─ Customer payments: $1,200

Expenses: $1,890
  ├─ Recurring costs: $890
  └─ 🔧 Extra Treatment Room: $1,000
```

---

## 🔮 **Future Enhancements**

### **Revenue Sources to Add:**
1. **Event Bonuses**
   - "Holiday Rush": +$200
   - "Perfect Week": +$150

2. **Investment Income**
   - "Stock dividends": +$50
   - "Property rental": +$100

3. **Customer Tips**
   - Based on satisfaction level
   - "Generous tips": +$45

### **Expense Categories to Add:**
1. **Equipment Repairs** 🔨
   - "Dental chair repair": $300
   - "HVAC maintenance": $150

2. **Random Events** 📋
   - "Health inspection fine": $200
   - "Emergency plumbing": $400

3. **Marketing Campaigns** 📣
   - "Social media ads": $250
   - "Billboard rental": $500

---

## 📱 **Responsive Design**

The breakdown uses a **2-column grid** that displays:
- **Left column**: Revenue breakdown
- **Right column**: Expense breakdown

### **Visual Elements:**
- Color-coded borders (green for revenue, red for expenses)
- Indented sub-items for clarity
- Icons for one-time cost categories
- Semibold totals for easy scanning

---

## ✅ **Benefits**

1. **Transparency** - Players see exactly where money comes from and goes
2. **Learning** - Understand which upgrades are worth the recurring cost
3. **Planning** - Budget for future upgrades by seeing historical patterns
4. **Trust** - No hidden fees or mysterious deductions

---

## 📈 **Usage Patterns**

### **Week 1** (Base operations):
```
Revenue: $800
  └─ Customer payments: $800

Expenses: $800
  └─ Recurring costs: $800
```

### **Week 2** (After buying upgrade):
```
Revenue: $1,000
  └─ Customer payments: $1,000

Expenses: $1,790
  ├─ Recurring costs: $890
  └─ 🔧 Modern Equipment: $900
```

### **Week 3** (Just recurring):
```
Revenue: $1,200
  └─ Customer payments: $1,200

Expenses: $890
  └─ Recurring costs: $890
```

---

## 🎨 **Color Scheme**

| Element | Color | Purpose |
|---------|-------|---------|
| Revenue Total | Green-400 | Positive money in |
| Revenue Items | Green-300 | Sub-items |
| Expense Total | Red-400 | Money out |
| Recurring Costs | Red-300 | Ongoing expenses |
| One-time Costs | Orange-300 | Purchases/events |
| Border | Green/Red-700 | Visual separation |

---

## 🔄 **Toggle/Expand (Future)**

Currently shows all breakdowns by default. Future enhancement:

```typescript
// Click to expand/collapse
[Week 2 ▼]  Profit: -$100
  Revenue: $800 ▼
    └─ [Breakdown shown]
  Expenses: $900 ▼
    └─ [Breakdown shown]

// Collapsed state
[Week 2 ▶]  Profit: -$100
  Revenue: $800 ▶
  Expenses: $900 ▶
```

This keeps the display clean while still allowing players to dive into details when needed.

