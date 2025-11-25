# Source Tracking System - How It Works

## 🎯 Overview

The source tracking system automatically tracks where every revenue and expense comes from, making it easy to:
- Display proper icons and labels in the UI
- Filter/group financial entries by source
- Debug where money came from/went to
- Add industry-specific customizations

## 🔄 How It Works

### 1. **Source Information Flow**

```
Admin Creates Content → Game Uses Content → SourceInfo Created → Financial Entry Recorded
```

**Example Flow:**
1. Admin creates an upgrade: `{ id: 'extra-room', name: 'Extra Treatment Room' }`
2. Player purchases upgrade
3. System creates `SourceInfo`: `{ type: SourceType.Upgrade, id: 'extra-room', name: 'Extra Treatment Room' }`
4. Financial entry recorded with full source tracking:
   ```typescript
   {
     amount: 500,
     category: OneTimeCostCategory.Upgrade,
     label: 'Extra Treatment Room',
     sourceId: 'extra-room',
     sourceType: SourceType.Upgrade,
     sourceName: 'Extra Treatment Room'
   }
   ```

### 2. **Source Type System**

**`SourceType` Enum** (`lib/config/sourceTypes.ts`):
- `Customer` - Customer payments (revenue)
- `Event` - Event effects (can be revenue or expense, one-time or monthly)
- `Upgrade` - Upgrade purchases/effects
- `Staff` - Staff-related (salaries, severance)
- `Marketing` - Marketing campaigns
- `Base` - Base operations (monthly expenses)
- `Other` - Fallback for unknown sources

**Key Point:** `SourceType` represents the **origin** of money, not the frequency. Frequency is determined by the data structure:
- `OneTimeCost` = one-time expense
- `ExpenseBreakdownItem` = monthly recurring expense
- `RevenueEntry` = revenue (can be one-time or recurring)

### 3. **Automatic Source Tracking**

When game content is used, `SourceInfo` is automatically created:

```typescript
// Upgrade purchase
const sourceInfo = SourceHelpers.fromUpgrade(upgrade.id, upgrade.name);
addOneTimeCost({ ... }, sourceInfo);

// Event choice
const sourceInfo = SourceHelpers.fromEvent(event.id, event.title);
recordEventRevenue(amount, sourceInfo, label);

// Staff hire/fire
const sourceInfo = SourceHelpers.fromStaff(staff.id, staff.name);
recordEventExpense(amount, sourceInfo, label);

// Marketing campaign
const sourceInfo = SourceHelpers.fromMarketing(campaign.id, campaign.name);
recordEventRevenue(amount, sourceInfo, campaign.name);
```

### 4. **Label Generation Priority**

**Display Label Priority:**
1. `sourceName` (most reliable - comes from game content)
2. `label` (custom label if provided)
3. Category default label (fallback)

**Icon Priority:**
1. `sourceType` → `getIconForSourceType()` (most reliable)
2. Label pattern matching (backward compatibility)
3. Category config (final fallback)

### 5. **Backward Compatibility**

The system maintains backward compatibility:
- Old API: `recordEventRevenue(amount, label)` still works
- Creates default `SourceInfo` with `SourceType.Other`
- Falls back to label parsing for icons if `sourceType` not available

## 📍 Where Source Info Comes From

### **Automatic Sources** (No Admin Changes Needed)

These are automatically tracked when game content is used:

1. **Upgrades** (`lib/store/slices/upgradesSlice.ts`)
   - Source: `upgrade.id`, `upgrade.name`
   - Created via: `SourceHelpers.fromUpgrade()`

2. **Events** (`lib/store/slices/eventSlice.ts`)
   - Source: `event.id`, `event.title`
   - Created via: `SourceHelpers.fromEvent()`

3. **Staff** (`lib/store/slices/staffSlice.ts`)
   - Source: `staff.id`, `staff.name`
   - Created via: `SourceHelpers.fromStaff()`

4. **Marketing** (`lib/store/slices/marketingSlice.ts`)
   - Source: `campaign.id`, `campaign.name`
   - Created via: `SourceHelpers.fromMarketing()`

5. **Customers** (`lib/store/slices/marketingSlice.ts`)
   - Source: `customer.id`, `customer.service.name`
   - Created via: `SourceHelpers.fromCustomer()`

6. **Base Operations** (`lib/features/economy.ts`)
   - Source: Hardcoded `'base_operations'`, `'Base Operations'`
   - Created via: `SourceHelpers.fromBase()`

### **Manual Entry** (Rare Cases)

If you need to manually create a financial entry (e.g., testing, special cases):

```typescript
import { SourceHelpers } from '@/lib/utils/financialTracking';
import { createRevenueEntry, createOneTimeCost } from '@/lib/utils/financialTracking';

// Option 1: Use helpers
const sourceInfo = SourceHelpers.fromEvent('custom-event', 'Custom Event Name');
recordEventRevenue(100, sourceInfo, 'Custom label');

// Option 2: Use factory functions
const revenueEntry = createRevenueEntry(100, sourceInfo, 'Custom label');
addRevenueEntry(revenueEntry, 100);
```

## 🎨 UI Display System

### **Icon Display** (`lib/config/categoryConfig.ts`)

Icons are determined by `sourceType` (single source of truth):

```typescript
const SOURCE_TYPE_ICON_MAP: Record<SourceType, string> = {
  [SourceType.Customer]: '💵',
  [SourceType.Event]: '📋',
  [SourceType.Upgrade]: '⚙️',
  [SourceType.Staff]: '👤',
  [SourceType.Marketing]: '📢',
  [SourceType.Base]: '🏢',
  [SourceType.Other]: '💰',
};
```

**To change icons:** Update `SOURCE_TYPE_ICON_MAP` in `categoryConfig.ts`

### **Label Display** (`lib/utils/financialTracking.ts`)

Labels prioritize `sourceName` over `label`:

```typescript
// Revenue
getRevenueDisplayLabel(entry) // Returns sourceName || label || category default

// Expenses
getExpenseDisplayLabel(expense) // Returns sourceName || label
```

## ✅ What's Already Working

✅ **All game content automatically tracks sources**
- Upgrades, Events, Staff, Marketing, Customers all use `SourceInfo`
- No manual entry needed for normal gameplay

✅ **UI automatically displays correct icons and labels**
- Uses `sourceType` for icons
- Uses `sourceName` for labels
- Falls back gracefully for legacy entries

✅ **Backward compatible**
- Old code still works
- Legacy entries get default source info

## 🔧 Admin Interface Status

### **No Changes Needed** ✅

The admin interface doesn't need changes because:

1. **Admin creates game content** (events, upgrades, etc.) with IDs and names
2. **Game automatically creates SourceInfo** when content is used
3. **Financial entries are created automatically** - admin doesn't create them directly

**Example:**
- Admin creates upgrade: `{ id: 'extra-room', name: 'Extra Treatment Room' }`
- When player purchases it, system automatically:
  - Creates `SourceInfo` from upgrade data
  - Records financial entry with full source tracking
  - UI displays correct icon and label

### **Potential Future Enhancements** (Optional)

If you want to add admin features later:

1. **Source Type Override** (Low Priority)
   - Allow admin to specify custom `sourceType` for special cases
   - Currently not needed - all sources are automatically categorized

2. **Custom Icons Per Industry** (Medium Priority)
   - Allow industry-specific icon mappings
   - Would require extending `categoryConfig.ts` with industry support

3. **Label Templates** (Low Priority)
   - Allow admin to customize label format per source type
   - Currently labels come from content names (which admin controls)

## 📝 Code Examples

### **Creating a Revenue Entry**

```typescript
// Automatic (recommended)
const sourceInfo = SourceHelpers.fromEvent(event.id, event.title);
recordEventRevenue(100, sourceInfo, 'Event payout');

// Manual (rare cases)
const sourceInfo = {
  type: SourceType.Other,
  id: 'custom-id',
  name: 'Custom Source'
};
recordEventRevenue(100, sourceInfo, 'Custom label');
```

### **Creating an Expense Entry**

```typescript
// Automatic (recommended)
const sourceInfo = SourceHelpers.fromUpgrade(upgrade.id, upgrade.name);
addOneTimeCost({
  label: upgrade.name,
  amount: upgrade.cost,
  category: OneTimeCostCategory.Upgrade,
  sourceId: sourceInfo.id,
  sourceType: sourceInfo.type,
  sourceName: sourceInfo.name,
}, { deductNow: true });

// Using factory function
const cost = createOneTimeCost(500, sourceInfo, 'Upgrade purchase');
addOneTimeCost(cost, { deductNow: true });
```

### **Displaying in UI**

```typescript
// Get icon
const icon = entry.sourceType 
  ? getIconForSourceType(entry.sourceType)
  : getRevenueIcon(entry.category, entry.label);

// Get label
const displayLabel = getRevenueDisplayLabel(entry);

// Render
<span>{icon} {displayLabel}</span>
```

## 🚀 Summary

**How It Works:**
1. Admin creates game content (events, upgrades, etc.) with IDs and names
2. When content is used, system automatically creates `SourceInfo`
3. Financial entries are recorded with full source tracking
4. UI displays correct icons and labels based on `sourceType` and `sourceName`

**What Needs Changes:**
- ✅ **Nothing!** The system is fully automatic
- Admin interface doesn't need changes
- All source tracking happens automatically

**Future Enhancements (Optional):**
- Industry-specific icon mappings
- Custom label templates
- Source type overrides (rarely needed)

