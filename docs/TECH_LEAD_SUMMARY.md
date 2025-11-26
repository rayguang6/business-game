# Business Game - Tech Lead Summary & Planning Document

## 🎮 Game Overview

**Business Game** is a time-management business simulation game where players run a business, manage resources, serve customers, and grow their enterprise. The game features:

- **Multi-industry support**: Different business types (Dental, Freelance, Restaurant, etc.)
- **Real-time simulation**: Customers spawn, wait, get served, and leave
- **Resource management**: Cash, Time, Experience (EXP), and Freedom Score
- **Progression system**: Upgrades, Staff, Marketing campaigns, Events
- **Monthly cycles**: Game runs in monthly cycles with end-of-month accounting

---

## 🎯 Core Game Mechanics

### 1. **Time System**
- Game runs in **ticks** (default: 10 ticks per second)
- Each month lasts **60 seconds** (configurable per industry)
- Time budget refreshes monthly (starting time configurable)
- Actions consume time (upgrades, marketing, events)

### 2. **Customer Flow**
1. **Leads spawn** at configured intervals (default: every 3-4 seconds)
2. **Lead conversion**: Leads accumulate progress toward becoming customers (conversion rate: 10-15% per lead)
3. **Customer spawns** when lead progress reaches 100%
4. **Customer walks** to waiting area (pathfinding system)
5. **Service assignment**: Customer assigned to available service room
6. **Service completion**: Customer served (duration based on service type)
7. **Outcome**: 
   - **Success**: Customer pays, player gains EXP
   - **Failure**: Service fails (based on failure rate), player loses EXP
   - **Impatience**: Customer leaves if waiting too long (patience timer)

### 3. **Revenue System**
- **Service revenue** = `(servicePrice × tierMultiplier + flatBonus) × revenueMultiplier × revenueScale`
- Revenue tracked per customer, event, upgrade, etc.
- Monthly revenue summary at month end

### 4. **Expense System**
- **Monthly expenses**: Base + upgrade-driven + staff salaries
- **One-time costs**: Upgrades, marketing campaigns, events
- Expenses deducted at month end

### 5. **EXP & Leveling**
- **EXP gain**: +1-2 per happy customer (configurable)
- **EXP loss**: -1 per angry/failed customer (configurable)
- **Level calculation**: `level = floor(EXP / 100)`
- EXP affects service availability (some services require level 3+)

### 6. **Freedom Score**
- Represents work-life balance
- Starts at 0-360 (configurable)
- Decreases when hiring staff (management overhead)
- Can be modified by upgrades/events

### 7. **Win/Lose Conditions**
- **Win**: Reach cash target OR survive target months
- **Lose**: Cash ≤ threshold OR Time ≤ threshold

---

## 📊 Database Schema

### Core Tables

#### `industries`
```sql
- id (PK): string - Industry identifier ('dental', 'freelance', etc.)
- name: string - Display name
- icon: string - Emoji/icon
- description: string - Industry description
- image: string - Industry image path
- map_image: string - Map image path
- is_available: boolean - Whether industry is playable
```

#### `industry_simulation_configs`
```sql
- industry_id (PK, FK): string - References industries.id
- business_metrics: jsonb - Starting values
  {
    "startingCash": number,
    "startingTime": number (optional),
    "monthlyExpenses": number,
    "startingExp": number,
    "startingFreedomScore": number
  }
- business_stats: jsonb - Game mechanics config
  {
    "ticksPerSecond": number (default: 10),
    "monthDurationSeconds": number (default: 60),
    "customerSpawnIntervalSeconds": number,
    "customerPatienceSeconds": number,
    "leavingAngryDurationTicks": number,
    "customerSpawnPosition": {x: number, y: number},
    "serviceCapacity": number,
    "expGainPerHappyCustomer": number,
    "expLossPerAngryCustomer": number,
    "eventTriggerSeconds": number[],
    "serviceRevenueMultiplier": number,
    "serviceRevenueScale": number,
    "conversionRate": number,
    "failureRate": number
  }
- win_condition: jsonb
  {
    "cashTarget": number,
    "monthTarget": number (optional),
    "customTitle": string (optional),
    "customMessage": string (optional)
  }
- lose_condition: jsonb
  {
    "cashThreshold": number,
    "timeThreshold": number
  }
```

#### `services`
```sql
- id (PK): string - Service identifier
- industry_id (FK): string - References industries.id
- name: string - Display name
- description: string (optional)
- duration: number - Service duration (ticks or seconds)
- price: number - Base service price
- requirements: jsonb - Array of requirements
  [{"type": "flag"|"level"|"condition", "id": string, "expected": boolean, "level": number}]
- pricing_category: 'low'|'mid'|'high' - Service tier
- weightage: number - Weight for random selection (higher = more likely)
```

#### `upgrades`
```sql
- id (PK): string - Upgrade identifier
- industry_id (FK): string - References industries.id
- name: string - Display name
- description: string
- icon: string - Emoji/icon
- cost: number|string - Cost formula (e.g., "500 + (level * 300)")
- time_cost: number (optional) - Time cost instead of cash
- max_level: number - Maximum upgrade level
- effects: jsonb - Array of effects
  [{"metric": GameMetric, "type": EffectType, "value": number}]
- sets_flag: string (optional) - Flag to set when purchased
- requirements: jsonb - Array of requirements
```

#### `marketing_campaigns`
```sql
- id (PK): string - Campaign identifier
- industry_id (FK): string - References industries.id
- name: string - Display name
- description: string
- cost: number - Cash cost
- time_cost: number - Time cost
- cooldown_seconds: number - Cooldown between uses
- effects: jsonb - Array of effects (can have durationSeconds)
  [{"metric": GameMetric, "type": EffectType, "value": number, "durationSeconds": number}]
- sets_flag: string (optional)
- requirements: jsonb
```

#### `events`
```sql
- id (PK): string - Event identifier
- industry_id (FK): string - References industries.id
- title: string - Event title
- category: 'opportunity'|'risk'
- summary: string - Event description
- choices: jsonb - Array of choices
  [{
    "id": string,
    "label": string,
    "description": string,
    "cost": number (optional),
    "timeCost": number (optional),
    "consequences": [{
      "id": string,
      "label": string,
      "description": string,
      "weight": number,
      "effects": [EventEffect]
    }],
    "setsFlag": string (optional)
  }]
- requirements: jsonb
```

#### `staff_roles`
```sql
- id (PK): string - Staff role identifier
- industry_id (FK): string - References industries.id
- name: string - Role name
- salary: number - Monthly salary
- effects: jsonb - Array of effects
- sets_flag: string (optional)
- requirements: jsonb
- sprite_image: string (optional) - Image path
```

#### `staff_presets`
```sql
- id (PK): string - Preset identifier
- industry_id (FK): string - References industries.id
- staff_role_id (FK): string - References staff_roles.id
- is_available: boolean - Whether preset is available
```

#### `flags`
```sql
- id (PK): string - Flag identifier
- industry_id (FK): string - References industries.id
- name: string - Display name
- description: string
- is_unlocked_by_default: boolean
```

#### `conditions`
```sql
- id (PK): string - Condition identifier
- industry_id (FK): string - References industries.id
- name: string - Display name
- description: string
- type: 'periodic'|'one-time'|'triggered'
- config: jsonb - Condition-specific config
  {
    "periodSeconds": number (for periodic),
    "durationSeconds": number,
    "trigger": string (for triggered)
  }
```

#### `global_simulation_config`
```sql
- id (PK): string - Single row
- business_metrics: jsonb - Global defaults
- business_stats: jsonb - Global defaults
- movement: jsonb - Movement config
- map_config: jsonb - Map config
- layout_config: jsonb - Layout config
- capacity_image: string
- win_condition: jsonb
- lose_condition: jsonb
- customer_images: string[]
- staff_name_pool: string[]
```

---

## 🎛️ Tweakable Variables & Configuration

### Business Metrics (Starting Values)
| Variable | Description | Default | Tweakable |
|----------|-------------|---------|-----------|
| `startingCash` | Initial cash | 10,000 | ✅ Yes |
| `startingTime` | Monthly time budget | 0-100 | ✅ Yes |
| `monthlyExpenses` | Base monthly expenses | 3,000 | ✅ Yes |
| `startingExp` | Starting experience | 10 | ✅ Yes |
| `startingFreedomScore` | Starting freedom score | 360 | ✅ Yes |

### Business Stats (Game Mechanics)
| Variable | Description | Default | Tweakable |
|----------|-------------|---------|-----------|
| `ticksPerSecond` | Game engine speed | 10 | ⚠️ Rarely |
| `monthDurationSeconds` | Month length (seconds) | 60 | ⚠️ Rarely |
| `customerSpawnIntervalSeconds` | Lead spawn interval | 3 | ✅ Yes |
| `customerPatienceSeconds` | Customer patience timer | 10 | ✅ Yes |
| `leavingAngryDurationTicks` | Exit animation duration | 10 | ⚠️ Rarely |
| `serviceCapacity` | Number of service capacity | 2 | ✅ Yes |
| `expGainPerHappyCustomer` | EXP per successful service | 2 | ✅ Yes |
| `expLossPerAngryCustomer` | EXP loss per failure | 1 | ✅ Yes |
| `serviceRevenueMultiplier` | Revenue multiplier | 1.0 | ✅ Yes |
| `serviceRevenueScale` | Revenue scaling factor | 10 | ✅ Yes |
| `conversionRate` | Lead conversion rate | 10 | ✅ Yes |
| `failureRate` | Service failure chance (%) | 0 | ✅ Yes |
| `eventTriggerSeconds` | Event trigger times | [15,30,45] | ✅ Yes |

### Movement Config
| Variable | Description | Default | Tweakable |
|----------|-------------|---------|-----------|
| `customerTilesPerTick` | Customer movement speed | 0.25 | ✅ Yes |
| `animationReferenceTilesPerTick` | Animation speed | 0.25 | ✅ Yes |
| `walkFrameDurationMs` | Walk animation frame | 200ms | ✅ Yes |
| `minWalkFrameDurationMs` | Min frame duration | 80ms | ✅ Yes |
| `maxWalkFrameDurationMs` | Max frame duration | 320ms | ✅ Yes |
| `celebrationFrameDurationMs` | Celebration animation | 200ms | ✅ Yes |

### Map Config
| Variable | Description | Default | Tweakable |
|----------|-------------|---------|-----------|
| `width` | Map width (tiles) | 10 | ✅ Yes |
| `height` | Map height (tiles) | 10 | ✅ Yes |
| `walls` | Array of wall positions | [] | ✅ Yes |
| `entryPosition` | Customer spawn position | {x:4, y:9} | ✅ Yes |
| `waitingPositions` | Waiting area positions | [] | ✅ Yes |
| `serviceRoomPositions` | Service room positions | [] | ✅ Yes |
| `staffPositions` | Staff positions | [] | ✅ Yes |

---

## ⚡ Effect System

### Effect Types
1. **Add** (`add`): Flat addition: `value + effect`
2. **Percent** (`percent`): Percentage: `value × (1 + effect/100)`
3. **Multiply** (`multiply`): Multiplication: `value × effect`
4. **Set** (`set`): Override: `value = effect`

### Application Order
Effects are applied in this order: **Add → Percent → Multiply → Set**

### Game Metrics (What Can Be Affected)

#### Core Resources
- `cash` - Direct cash modification
- `time` - Direct time modification
- `exp` - Direct EXP modification
- `freedomScore` - Freedom score modification

#### Business Operations
- `spawnIntervalSeconds` - Lead/customer spawn rate (lower = faster)
- `serviceSpeedMultiplier` - Service completion speed (higher = faster)
- `serviceCapacity` - Number of available service capacity
- `monthlyExpenses` - Monthly operating expenses
- `monthlyTimeCapacity` - Monthly time budget increase

#### Revenue & Pricing
- `serviceRevenueMultiplier` - Revenue multiplier (applied to all services)
- `serviceRevenueFlatBonus` - Flat bonus added to service price
- `highTierServiceRevenueMultiplier` - High-tier service multiplier
- `midTierServiceRevenueMultiplier` - Mid-tier service multiplier
- `lowTierServiceRevenueMultiplier` - Low-tier service multiplier
- `highTierServiceWeightageMultiplier` - High-tier spawn weight
- `midTierServiceWeightageMultiplier` - Mid-tier spawn weight
- `lowTierServiceWeightageMultiplier` - Low-tier spawn weight

#### Quality & Conversion
- `failureRate` - Service failure chance (0-100%)
- `conversionRate` - Lead conversion rate (progress per lead)

#### Special Actions
- `generateLeads` - Immediate lead generation (one-time)

### Effect Sources
Effects can come from:
1. **Upgrades** - Permanent effects (until upgrade removed)
2. **Marketing Campaigns** - Temporary effects (with durationSeconds)
3. **Staff** - Dynamic effects (active while staff hired)
4. **Events** - One-time or temporary effects

### Effect Constraints
Some metrics have constraints:
- `cash`: min=0, roundToInt=true
- `time`: min=0, roundToInt=true
- `serviceCapacity`: min=1, roundToInt=true
- `freedomScore`: min=0, roundToInt=true
- `exp`: min=0, roundToInt=true
- `failureRate`: min=0, max=100, roundToInt=true
- `conversionRate`: min=0.1

---

## 📈 Metrics & Stats

### Player Metrics (Tracked in GameState)
```typescript
interface Metrics {
  cash: number;                    // Current cash
  time: number;                    // Current time budget
  totalRevenue: number;            // Lifetime revenue
  totalExpenses: number;           // Lifetime expenses
  exp: number;                     // Current experience
  freedomScore: number;           // Current freedom score
  totalLeadsSpawned: number;       // Lifetime leads
  totalCustomersGenerated: number;  // Lifetime customers
  totalTimeSpent: number;          // Lifetime time spent
}
```

### Monthly Tracking
```typescript
interface MonthlyHistoryEntry {
  month: number;
  revenue: number;
  expenses: number;
  oneTimeCosts: OneTimeCost[];
  profit: number;
  exp: number;
  expChange: number;
  level: number;
  levelChange: number;
  freedomScore: number;
  revenueBreakdown: RevenueEntry[];
  expenseBreakdown: ExpenseBreakdownItem[];
  leadsSpawned: number;
  customersGenerated: number;
  customersServed: number;
  customersLeftImpatient: number;
  customersServiceFailed: number;
  timeSpent: number;
  timeSpentDetails: TimeSpentEntry[];
}
```

### Revenue Categories
- `customer` - Customer payments
- `event` - Event payouts
- `other` - Other income sources

### Expense Categories
- `base` - Base monthly expenses
- `upgrade` - Upgrade-driven expenses
- `staff` - Staff salaries
- `event` - Event costs
- `other` - Other expenses

### Customer Tracking
- `customersServed` - Successfully served customers
- `customersLeftImpatient` - Customers who left due to impatience
- `customersServiceFailed` - Customers whose service failed

---

## 🎨 Service System

### Service Properties
- **Duration**: How long service takes (ticks/seconds)
- **Price**: Base service price
- **Pricing Category**: `low`, `mid`, or `high`
- **Weightage**: Random selection weight (higher = more likely)
- **Requirements**: Flags, levels, or conditions needed

### Revenue Calculation
```
Final Revenue = (
  (servicePrice × tierMultiplier) + flatBonus
) × revenueMultiplier × revenueScale
```

Where:
- `tierMultiplier` = tier-specific multiplier (high/mid/low)
- `flatBonus` = `serviceRevenueFlatBonus` from effects
- `revenueMultiplier` = `serviceRevenueMultiplier` from effects
- `revenueScale` = `serviceRevenueScale` from config

---

## 🚀 Upgrade System

### Upgrade Properties
- **Cost**: Cash cost (can be formula: `"500 + (level * 300)"`)
- **Time Cost**: Optional time cost (uses time instead of cash)
- **Max Level**: Maximum upgrade level
- **Effects**: Array of effects applied per level
- **Sets Flag**: Optional flag to set when purchased
- **Requirements**: Prerequisites (flags, levels, conditions)

### Upgrade Effects
Upgrades can affect any `GameMetric` using any `EffectType`. Effects stack multiplicatively across levels.

---

## 📢 Marketing System

### Marketing Campaign Properties
- **Cost**: Cash cost
- **Time Cost**: Time cost
- **Cooldown**: Seconds between uses
- **Effects**: Array of effects (can have `durationSeconds` for temporary effects)
- **Sets Flag**: Optional flag
- **Requirements**: Prerequisites

### Temporary Effects
Marketing effects can have `durationSeconds` to create temporary boosts (e.g., +15% revenue for 60 seconds).

---

## 👥 Staff System

### Staff Properties
- **Salary**: Monthly salary (adds to monthly expenses)
- **Effects**: Array of effects (active while staff hired)
- **Sets Flag**: Optional flag when hired
- **Requirements**: Prerequisites
- **Sprite Image**: Visual representation

### Staff Effects
Staff effects are active as long as the staff member is hired. They're removed when staff is fired.

---

## 🎲 Event System

### Event Properties
- **Category**: `opportunity` or `risk`
- **Choices**: Array of player choices
- **Requirements**: Prerequisites

### Choice Properties
- **Cost**: Upfront cash cost
- **Time Cost**: Upfront time cost
- **Consequences**: Array of weighted consequences
- **Sets Flag**: Optional flag

### Consequence Properties
- **Weight**: Selection probability (higher = more likely)
- **Effects**: Array of `EventEffect` (cash, exp, metric)
- **Delayed Consequence**: Optional delayed effect

### Event Effect Types
1. **Cash**: Direct cash modification
2. **Exp**: Direct EXP modification
3. **DynamicCash**: Formula-based cash (e.g., `"monthlyRevenue * 0.1"`)
4. **Metric**: Standard metric effect (with optional duration)

---

## 🏷️ Flag System

Flags are boolean state trackers used for:
- **Requirements**: Services, upgrades, staff require flags
- **Unlocking**: Flags unlock new content
- **Tracking**: Track game state (e.g., "has_portfolio", "learned_web_dev")

---

## 🔄 Condition System

Conditions represent dynamic game states:
- **Periodic**: Recurring conditions (e.g., "High Demand Period" every 180 seconds)
- **One-time**: Single occurrence
- **Triggered**: Condition-based triggers

---

## 📝 Important Code Locations

### Core Game Logic
- `lib/game/mechanics.ts` - Main game loop and tick processing
- `lib/game/effectManager.ts` - Effect calculation system
- `lib/game/config.ts` - Configuration management
- `lib/store/gameStore.ts` - Game state management

### Features
- `lib/features/customers.ts` - Customer logic
- `lib/features/leads.ts` - Lead system
- `lib/features/services.ts` - Service selection
- `lib/features/upgrades.ts` - Upgrade calculations
- `lib/features/staff.ts` - Staff management
- `lib/features/economy.ts` - Financial calculations

### Data Layer
- `lib/data/*Repository.ts` - Database access layer
- `lib/supabase/client.ts` - Supabase client

### UI
- `app/game/[industry]/page.tsx` - Main game screen
- `app/admin/page.tsx` - Admin configuration panel

---

## 🎯 Design Philosophy

### Configuration Hierarchy
```
Code Defaults → Global Config → Industry Config
```

Priority: **Industry > Global > Code Defaults**

### Effect System Philosophy
- **Centralized**: All effects go through `effectManager`
- **Composable**: Effects stack and combine
- **Traceable**: Full audit trail for debugging
- **Flexible**: Supports permanent and temporary effects

### Game Balance Philosophy
- **Risk vs Reward**: Higher risk (failure rate) = higher reward potential
- **Time Management**: Time is a limited resource
- **Progression**: EXP unlocks new services
- **Scaling**: Upgrades and staff enable growth

---

## 🔧 Common Tweaks

### Make Game Faster
- Reduce `customerSpawnIntervalSeconds` (more customers)
- Increase `serviceSpeedMultiplier` (faster service)
- Increase `serviceCapacity` (more capacity)

### Make Game Easier
- Increase `startingCash`
- Decrease `monthlyExpenses`
- Decrease `failureRate`
- Increase `serviceRevenueMultiplier`

### Make Game Harder
- Decrease `startingCash`
- Increase `monthlyExpenses`
- Increase `failureRate`
- Decrease `customerPatienceSeconds` (less time to serve)

### Adjust Revenue
- Modify `serviceRevenueMultiplier` (affects all services)
- Modify `serviceRevenueScale` (scaling factor)
- Adjust individual service `price`
- Use tier-specific multipliers

---

## 📚 Additional Resources

- `docs/DATA_FLOW.md` - Data flow documentation
- `docs/EVENT_EFFECT_TYPES.md` - Event system details
- `docs/EXPENSE_VALIDATION_GUIDE.md` - Expense validation
- `docs/METRICS_ORGANIZATION.md` - Metrics organization
- `docs/SOURCE_TRACKING_SYSTEM.md` - Source tracking

---

## 🎮 Example Industry Configuration

See `freelance_minimal.sql` and `sql/freelance_complete.sql` for complete examples of:
- Industry definition
- Starting values
- Services (3-7 services)
- Upgrades (3-5 upgrades)
- Marketing campaigns (3-4 campaigns)
- Events (3-7 events)
- Staff roles (2-3 roles)
- Flags and conditions

---

**Last Updated**: Generated from codebase analysis
**Version**: 1.0

