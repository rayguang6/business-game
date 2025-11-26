# Game Metrics & Stats Organization

This document provides a comprehensive overview of all metrics and stats tracked in the game, their purpose, and how they're calculated.

## Metric Categories

### 1. Direct State Metrics
These metrics are stored directly in game state and modified immediately (bypass effectManager for Add effects):

- **Cash** (`metrics.cash`)
  - Current available cash
  - Modified directly when customers pay, expenses deducted, etc.
  - Game over if reaches 0

- **Time** (`metrics.time`)
  - Monthly time budget (refreshes each month)
  - Modified directly when upgrades purchased, events occur
  - Game over if reaches 0

- **Exp** (`metrics.exp`)
  - Experience points (reputation/skill level)
  - Modified directly when customers complete services (happy = gain, angry = loss)
  - Used to calculate level: `level = floor(exp / 100)`

- **FreedomScore** (`metrics.freedomScore`)
  - Previously: FounderWorkingHours
  - Tracks founder's freedom/work-life balance
  - Modified directly by upgrades and staff

### 2. Calculated Metrics (via effectManager)
These metrics are calculated on-demand using the effect system:

#### Customer Flow
- **SpawnIntervalSeconds** (`GameMetric.SpawnIntervalSeconds`)
  - Time between customer spawns (in seconds)
  - Lower = faster customer flow
  - Base: `businessStats.customerSpawnIntervalSeconds`
  - Display: Shows as seconds and customers/minute

- **ConversionRate** (`GameMetric.ConversionRate`)
  - Progress each lead adds toward customer conversion (0-100%)
  - Base: `businessStats.conversionRate` (default: 10)
  - Display: Percentage per lead
  - Modifiable by: Upgrades, Marketing, Staff, Events

#### EXP Gain/Loss (Config-Only)
- **ExpGainPerHappyCustomer** (`businessStats.expGainPerHappyCustomer`)
  - EXP gained per happy customer
  - Base: `businessStats.expGainPerHappyCustomer` (default: 1)
  - Display: Integer value
  - **Config-only**: Set in database config, NOT modifiable by upgrades/staff/events
  - Read directly from config in mechanics.ts

- **ExpLossPerAngryCustomer** (`businessStats.expLossPerAngryCustomer`)
  - EXP lost per angry customer
  - Base: `businessStats.expLossPerAngryCustomer` (default: 1)
  - Display: Integer value
  - **Config-only**: Set in database config, NOT modifiable by upgrades/staff/events
  - Read directly from config in mechanics.ts

#### Service Performance
- **ServiceSpeedMultiplier** (`GameMetric.ServiceSpeedMultiplier`)
  - Multiplier for service completion speed
  - Base: 1.0
  - Display: ×{value}

- **ServiceCapacity** (`GameMetric.ServiceCapacity`)
  - Number of available service rooms
  - Base: `businessStats.serviceCapacity`
  - Display: Integer count

- **FailureRate** (`GameMetric.FailureRate`)
  - Chance of service failing (0-100%)
  - Base: `businessStats.failureRate` (default: 0)
  - Display: Percentage

#### Revenue Modifiers
- **ServiceRevenueMultiplier** (`GameMetric.ServiceRevenueMultiplier`)
  - Multiplier for all service revenue
  - Base: `businessStats.serviceRevenueMultiplier` (default: 1)
  - Display: ×{value}

- **ServiceRevenueFlatBonus** (`GameMetric.ServiceRevenueFlatBonus`)
  - Flat bonus added to each service price
  - Base: 0
  - Display: +${value} or -${value}

- **ServiceRevenueScale** (`businessStats.serviceRevenueScale`)
  - Industry-specific payout scale (not an effect, config value)
  - Base: `businessStats.serviceRevenueScale` (default: 1)
  - Display: ×{value}

#### Tier-Specific Revenue Modifiers
- **HighTierServiceRevenueMultiplier** (`GameMetric.HighTierServiceRevenueMultiplier`)
  - Multiplier for high-tier service prices
  - Base: 1
  - Display: ×{value}

- **MidTierServiceRevenueMultiplier** (`GameMetric.MidTierServiceRevenueMultiplier`)
  - Multiplier for mid-tier service prices
  - Base: 1
  - Display: ×{value}

- **LowTierServiceRevenueMultiplier** (`GameMetric.LowTierServiceRevenueMultiplier`)
  - Multiplier for low-tier service prices
  - Base: 1
  - Display: ×{value}

#### Tier-Specific Weightage Modifiers
- **HighTierServiceWeightageMultiplier** (`GameMetric.HighTierServiceWeightageMultiplier`)
  - Multiplier for high-tier service selection probability
  - Base: 1
  - Display: ×{value}

- **MidTierServiceWeightageMultiplier** (`GameMetric.MidTierServiceWeightageMultiplier`)
  - Multiplier for mid-tier service selection probability
  - Base: 1
  - Display: ×{value}

- **LowTierServiceWeightageMultiplier** (`GameMetric.LowTierServiceWeightageMultiplier`)
  - Multiplier for low-tier service selection probability
  - Base: 1
  - Display: ×{value}

#### Expenses & Capacity
- **MonthlyExpenses** (`GameMetric.MonthlyExpenses`)
  - Monthly recurring expenses
  - Base: `getMonthlyBaseExpenses(industryId)`
  - Display: ${value}/month

- **MonthlyTimeCapacity** (`GameMetric.MonthlyTimeCapacity`)
  - Additional monthly time capacity (permanent increase)
  - Base: 0
  - Display: +{value}h/month

### 3. Monthly Tracking Metrics
These are reset each month and tracked in `monthlyHistory`:

- **monthlyRevenue** - Total revenue for current month
- **monthlyExpenses** - Total expenses for current month
- **monthlyOneTimeCosts** - One-time costs (upgrades, repairs, etc.)
- **totalRevenue** (`metrics.totalRevenue`) - Lifetime total revenue
- **totalExpenses** (`metrics.totalExpenses`) - Lifetime total expenses

### 4. Game State Metrics
- **gameTime** - Current game time in seconds
- **currentMonth** - Current month number
- **leadProgress** - Progress toward next customer (0-100%)
- **conversionRate** - Stored in game state (calculated from effectManager)

## Effect System

All calculated metrics use the `effectManager` system which applies effects in this order:
1. **Add** - Flat addition: `value + effect`
2. **Percent** - Percentage: `value × (1 + effect/100)`
3. **Multiply** - Multiplication: `value × effect`
4. **Set** - Override: `value = effect` (highest priority wins)

### Effect Sources
- **Upgrades** - Permanent effects (category: 'upgrade')
- **Marketing** - Temporary campaign effects (category: 'marketing')
- **Staff** - Dynamic effects based on hired staff (category: 'staff')
- **Events** - One-time or temporary event effects (category: 'event')

## Display Locations

### Live Modifiers (GameCanvas)
Shows real-time calculated metrics affecting gameplay, organized into sections:

**Customer Flow:**
- Spawn interval (with customers/minute)
- Conversion rate (always shown, with base value if modified)

**Service Performance:**
- Service speed multiplier
- Service rooms count
- Failure rate (only if > 0)

**Revenue Modifiers:**
- Price multiplier
- Price bonus (only if ≠ 0)
- Payout scale (only if ≠ 1)

**Expenses & Capacity:**
- Monthly expenses (if > 0)
- Monthly time capacity bonus (if > 0)

**Tier Modifiers:**
- Tier-specific revenue multipliers (always shown: High/Mid/Low)
- Tier-specific weightage multipliers (always shown: High/Mid/Low)

**Base Stats (Non-editable):**
- Customer patience (seconds)
- Month duration (seconds)

**EXP Modifiers (Config-Only):**
- EXP per happy customer (read directly from config - NOT modifiable by upgrades/staff/events)
- EXP per angry customer (read directly from config - NOT modifiable by upgrades/staff/events)

### Key Metrics (TopBar)
Shows core player stats:
- Cash
- Exp/Level
- Time Budget (if enabled)
- Freedom Score

### Lead Conversion Progress (GameCanvas)
Shows:
- Lead progress percentage
- Conversion rate per lead

## Recommendations

1. **Live Modifiers** shows all active calculated metrics that affect gameplay
2. **Metrics are grouped logically** (Customer Flow, Service Performance, Revenue, etc.)
3. **Tier multipliers are always shown** (even at base 1.0) for transparency
4. **Base stats section** shows important non-editable configuration values
5. **Conditional display** is used for metrics that may be zero/unmodified to reduce clutter

