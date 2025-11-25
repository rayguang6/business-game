# Financial Tracking & Naming Convention Improvements

## 🔍 Issues Identified

### 1. **Missing Source Tracking**

#### Problem:
- `RevenueEntry` has `sourceId` field but it's **rarely populated**
- `OneTimeCost` **doesn't have `sourceId` field at all**
- `ExpenseBreakdownItem` has `sourceId` but only populated for upgrades/staff, not events

#### Current State:
```typescript
// RevenueEntry - sourceId exists but not used
recordEventRevenue(amount, label) // No sourceId passed
recordEventRevenue(effect.value, `Upgrade: ${upgrade.name}`) // No sourceId
recordEventRevenue(effect.value, `Staff: ${staff.name}`) // No sourceId

// OneTimeCost - no sourceId field
addOneTimeCost({ label, amount, category }) // Can't track source

// ExpenseBreakdownItem - sourceId only for upgrades/staff
{ label: effect.source.name, sourceId: effect.source.id } // Only for events
```

#### Impact:
- Can't link revenue/expenses back to specific sources
- Can't filter/group by source
- Hard to debug where money came from/went to
- Can't implement industry-specific icons/labels per source

---

### 2. **Inconsistent Label Naming Conventions**

#### Problem:
Labels use different formats with no standardization:

```typescript
// Event: "Event Title - Choice Label"
`${event.title} - ${choice.label}`

// Staff: "Staff: Name"
`Staff: ${staff.name}`

// Upgrade: "Upgrade: Name" or "Name (Lvl X)"
`Upgrade: ${upgrade.name}`
`${upgrade.name} (Lvl ${newLevel})`

// Marketing: Just campaign name
campaign.name

// Customer: "Customer: Service Name"
`Customer: ${customer.service.name}`
```

#### Impact:
- Icon detection relies on fragile string matching (`label?.includes('Staff:')`)
- Hard to parse programmatically
- Inconsistent user experience
- Can't easily change format per industry

---

### 3. **Misleading Function Names**

#### Problem:
```typescript
recordEventRevenue()  // Used for ALL sources, not just events!
recordEventExpense()  // Used for ALL sources, not just events!
```

These functions are used for:
- Events ✓
- Upgrades ✗
- Staff ✗
- Marketing ✗
- Customers ✗

#### Impact:
- Confusing codebase
- Misleading API
- Hard to understand what the function does

---

### 4. **Missing Source Metadata**

#### Problem:
No way to track:
- **Source type** (event, upgrade, staff, marketing, customer)
- **Source ID** (which specific event/upgrade/staff)
- **Source name** (for display)
- **Timestamp** (when did this happen)
- **Industry context** (which industry was active)

#### Current:
```typescript
interface RevenueEntry {
  amount: number;
  category: RevenueCategory; // Too generic (Event, Customer, Other)
  label?: string;            // Free-form text
  sourceId?: string;         // Rarely populated
  // Missing: sourceType, sourceName, timestamp, industryId
}
```

---

### 5. **Category vs Source Confusion**

#### Problem:
- `RevenueCategory.Event` is used for ALL non-customer revenue (events, upgrades, staff, marketing)
- `OneTimeCostCategory` doesn't match expense breakdown categories
- Expense breakdown uses string literals (`'base' | 'upgrade' | 'staff' | 'event'`) instead of enum

#### Current:
```typescript
// Revenue categories - too broad
enum RevenueCategory {
  Customer = 'customer',
  Event = 'event',      // Used for events, upgrades, staff, marketing!
  Other = 'other',
}

// One-time cost categories - different from expense breakdown
enum OneTimeCostCategory {
  Upgrade = 'upgrade',
  Event = 'event',
  Marketing = 'marketing',
  Staff = 'staff',
}

// Expense breakdown - string literals, not enum
type ExpenseBreakdownCategory = 'base' | 'upgrade' | 'staff' | 'event';
```

---

### 6. **Fragile Icon Detection**

#### Problem:
Icons are detected by string matching in labels:
```typescript
if (label?.includes('Staff:')) return '👤';
if (label?.includes('Upgrade:')) return '⚙️';
if (label?.includes('Marketing:') || label?.includes('Campaign')) return '📢';
```

#### Impact:
- Breaks if label format changes
- Can't handle industry-specific icons
- Hard to maintain

---

## 🎯 Proposed Solutions

### 1. **Standardize Source Tracking**

#### Add `sourceId` to `OneTimeCost`:
```typescript
interface OneTimeCost {
  label: string;
  amount: number;
  category: OneTimeCostCategory;
  sourceId?: string;        // NEW
  sourceType?: string;      // NEW: 'event' | 'upgrade' | 'staff' | 'marketing'
  alreadyDeducted?: boolean;
}
```

#### Always populate `sourceId` in `RevenueEntry`:
```typescript
recordEventRevenue(amount, label, sourceId, sourceType)
```

#### Add source tracking to expense breakdown:
```typescript
interface ExpenseBreakdownItem {
  label: string;
  amount: number;
  category: ExpenseBreakdownCategory;
  sourceId?: string;        // Already exists, ensure it's always populated
  sourceType?: string;      // NEW
}
```

---

### 2. **Create Unified Source Type System**

```typescript
enum SourceType {
  Event = 'event',
  Upgrade = 'upgrade',
  Staff = 'staff',
  Marketing = 'marketing',
  Customer = 'customer',
  Base = 'base',           // For base operations
}

interface SourceInfo {
  type: SourceType;
  id: string;
  name: string;
  industryId?: IndustryId; // For industry-specific configs
}
```

---

### 3. **Rename Functions for Clarity**

```typescript
// OLD (misleading)
recordEventRevenue()
recordEventExpense()

// NEW (clear)
recordRevenue(amount, source: SourceInfo, label?: string)
recordExpense(amount, source: SourceInfo, label?: string)
// Or keep old names but make them accept SourceInfo
```

---

### 4. **Standardize Label Format**

#### Option A: Use sourceType + sourceName
```typescript
// Auto-generate labels from source
const label = source.name; // "Extra Treatment Room", "John Doe", "Summer Campaign"

// Display uses sourceType for icon
getIcon(sourceType) // Not from label parsing
```

#### Option B: Use consistent prefix format
```typescript
// Standardized format
`[${sourceType}] ${sourceName}` // "[Upgrade] Extra Treatment Room"
// Or use sourceType enum for icon lookup
```

#### Option C: Industry-specific label generators
```typescript
// In categoryConfig.ts
export function generateLabel(sourceType: SourceType, sourceName: string, industryId?: IndustryId): string {
  const config = getIndustryConfig(industryId);
  return config.labelFormats[sourceType]?.(sourceName) || sourceName;
}
```

---

### 5. **Enhance RevenueEntry & OneTimeCost**

```typescript
interface RevenueEntry {
  amount: number;
  category: RevenueCategory;      // Keep for backward compatibility
  label?: string;
  sourceId?: string;              // Always populate
  sourceType?: SourceType;        // NEW
  sourceName?: string;            // NEW: For display
  timestamp?: number;             // NEW: When it occurred
  industryId?: IndustryId;       // NEW: Context
}

interface OneTimeCost {
  label: string;
  amount: number;
  category: OneTimeCostCategory;
  sourceId?: string;              // NEW
  sourceType?: SourceType;        // NEW
  sourceName?: string;            // NEW
  timestamp?: number;             // NEW
  alreadyDeducted?: boolean;
}
```

---

### 6. **Industry-Specific Configuration**

```typescript
// lib/config/categoryConfig.ts
export interface IndustryCategoryConfig {
  icons: Record<SourceType, string>;
  labelFormats: Record<SourceType, (name: string) => string>;
  categoryLabels: Record<string, string>;
}

export const INDUSTRY_CATEGORY_CONFIGS: Record<IndustryId, IndustryCategoryConfig> = {
  [IndustryId.Freelance]: {
    icons: {
      [SourceType.Upgrade]: '⚙️',
      [SourceType.Staff]: '👤',
      // ...
    },
    labelFormats: {
      [SourceType.Upgrade]: (name) => `${name} Subscription`,
      [SourceType.Staff]: (name) => `Contractor: ${name}`,
    },
  },
  // Other industries...
};

export function getCategoryConfig(industryId: IndustryId): IndustryCategoryConfig {
  return INDUSTRY_CATEGORY_CONFIGS[industryId] || DEFAULT_CONFIG;
}
```

---

### 7. **Fix Icon Detection**

Instead of label parsing:
```typescript
// OLD (fragile)
if (label?.includes('Staff:')) return '👤';

// NEW (robust)
function getRevenueIcon(entry: RevenueEntry): string {
  if (entry.sourceType) {
    const config = getCategoryConfig(entry.industryId);
    return config.icons[entry.sourceType] || '💰';
  }
  // Fallback to category-based detection
  return REVENUE_CATEGORY_CONFIG[entry.category]?.icon || '💰';
}
```

---

## 📋 Implementation Priority

### Phase 1: Critical (Do First)
1. ✅ Add `sourceId` to `OneTimeCost`
2. ✅ Always populate `sourceId` in `RevenueEntry`
3. ✅ Create `SourceType` enum
4. ✅ Update all `recordEventRevenue/Expense` calls to include source info

### Phase 2: Important (Do Next)
5. ✅ Standardize label generation
6. ✅ Fix icon detection to use `sourceType` instead of label parsing
7. ✅ Add `sourceType` to all interfaces
8. ✅ Update expense breakdown to always include `sourceId`

### Phase 3: Enhancement (Nice to Have)
9. ✅ Industry-specific configurations
10. ✅ Timestamp tracking
11. ✅ Rename functions (with backward compatibility)
12. ✅ Enhanced metadata (industryId, sourceName, etc.)

---

## 🔧 Migration Strategy

1. **Add new fields as optional** (backward compatible)
2. **Gradually populate** new fields in all creation points
3. **Update display logic** to prefer new fields, fallback to old
4. **Deprecate old patterns** with warnings
5. **Remove old code** after full migration

---

## 💡 Additional Suggestions

### 1. **Revenue/Expense Grouping**
Allow grouping by sourceType for better analytics:
```typescript
const revenueBySource = groupBy(monthlyRevenueDetails, 'sourceType');
```

### 2. **Source Linking**
Link back to source objects for details:
```typescript
interface RevenueEntry {
  // ...
  sourceRef?: {
    type: SourceType;
    id: string;
    // Can fetch full object: getSource(sourceRef)
  };
}
```

### 3. **Audit Trail**
Track all changes for debugging:
```typescript
interface FinancialTransaction {
  type: 'revenue' | 'expense';
  amount: number;
  source: SourceInfo;
  timestamp: number;
  month: number;
  // ... other metadata
}
```

### 4. **Category Consolidation**
Unify all category enums:
```typescript
enum FinancialCategory {
  // Revenue
  Customer = 'customer',
  Event = 'event',
  Upgrade = 'upgrade',
  Staff = 'staff',
  Marketing = 'marketing',
  
  // Expenses
  Base = 'base',
  UpgradeMonthly = 'upgrade_monthly',
  StaffMonthly = 'staff_monthly',
  EventMonthly = 'event_monthly',
  // ...
}
```

---

## 📝 Summary

**Key Issues:**
- Missing source tracking (`sourceId` not populated)
- Inconsistent label formats
- Misleading function names
- Fragile icon detection
- No industry-specific support

**Key Solutions:**
- Add `SourceType` enum
- Always populate `sourceId` and `sourceType`
- Standardize label generation
- Use `sourceType` for icon detection
- Support industry-specific configs

**Benefits:**
- Better tracking and debugging
- Industry-specific customization
- More maintainable code
- Better user experience
- Easier to add new features

