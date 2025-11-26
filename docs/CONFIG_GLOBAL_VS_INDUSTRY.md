# Global vs Industry-Specific Configuration Guide

This document explains which configuration values should be set in **Global Config** vs **Industry-Specific Config**.

## Configuration Hierarchy

The system uses a three-tier merge system:
```
Code Defaults → Global Config → Industry Config
```

**Priority:** Industry > Global > Code Defaults

This means:
- Set **Global Config** once with sensible defaults
- Only create **Industry Config** overrides for values that differ
- Code defaults ensure the game always works even if configs are missing

## Global Config (Set Once, Shared)

These values should be set in **Global Config** and rarely (if ever) overridden by industries:

### Game Engine Timing (Never Change)
- `ticksPerSecond: 10` - Game engine timing
- `monthDurationSeconds: 60` - Game pacing (how long a month lasts)
- `leavingAngryDurationTicks: 10` - Animation timing

### Game Pacing (Shared)
- `eventTriggerSeconds: [15, 30, 45]` - When events trigger during the month

### Default Balance Values (Override Only If Needed)
- `expGainPerHappyCustomer: 2` - Default EXP gain per happy customer
- `expLossPerAngryCustomer: 1` - Default EXP loss per angry customer
- `conversionRate: 10` - Default lead conversion rate (0-100%)

### Reasonable Defaults (Commonly Overridden)
- `customerSpawnIntervalSeconds: 3` - Default customer spawn rate
- `customerPatienceSeconds: 10` - Default customer patience
- `serviceRevenueMultiplier: 1` - Default pricing multiplier
- `serviceRevenueScale: 10` - Default revenue scale
- `failureRate: 0` - Default failure rate

### Starting Values (Generic Defaults)
- `startingCash: 10000` - Generic starting cash (industries typically override)
- `monthlyExpenses: 3000` - Generic monthly expenses (industries typically override)
- `startingExp: 10` - Starting experience (rarely overridden)
- `startingFreedomScore: 360` - Starting freedom score (rarely overridden)

## Industry-Specific Config (Override What Differs)

Only set values in **Industry Config** that differ from global defaults:

### Commonly Overridden Values

#### Starting Values
```typescript
// Freelance Industry
{
  startingCash: 3000,        // Lower startup costs
  monthlyExpenses: 1000,     // Lower overhead
  startingFreedomScore: 0,   // Starts with no freedom
}

// Restaurant Industry
{
  startingCash: 20000,       // Higher startup (kitchen equipment)
  monthlyExpenses: 8000,      // Higher overhead (rent, ingredients, staff)
}
```

#### Customer Behavior
```typescript
// Fast Food Industry
{
  customerSpawnIntervalSeconds: 1.5,  // Busier (faster spawns)
  customerPatienceSeconds: 5,          // More impatient
}

// Spa Industry
{
  customerSpawnIntervalSeconds: 5,     // Slower (fewer customers)
  customerPatienceSeconds: 15,         // More patient/relaxed
}
```

#### Revenue Models
```typescript
// Freelance Industry
{
  serviceRevenueMultiplier: 1.0,       // Standard hourly rates
  serviceRevenueScale: 5,              // Smaller projects
}

// Dental Industry
{
  serviceRevenueMultiplier: 1.2,       // Premium pricing
  serviceRevenueScale: 10,              // Standard scale
}

// Restaurant Industry
{
  serviceRevenueMultiplier: 0.8,       // Competitive pricing
  serviceRevenueScale: 15,              // Higher volume
}
```

#### Risk & Conversion
```typescript
// Freelance Industry
{
  conversionRate: 15,        // Easier to convert leads
  failureRate: 0,            // Low risk
}

// Restaurant Industry
{
  conversionRate: 10,        // Moderate conversion
  failureRate: 20,           // Higher risk (food quality issues)
}

// Medical Industry
{
  conversionRate: 5,         // Harder to convert (trust required)
  failureRate: 5,             // Serious consequences
}
```

#### Map & Layout (Always Industry-Specific)
```typescript
{
  customerSpawnPosition: { x: 4, y: 9 },  // Unique per industry map
  serviceCapacity: 2,                      // Different concepts (chairs, tables, booths)
  // ... layout positions
}
```

## Best Practices

### ✅ DO:
1. **Set global defaults** for values that are the same across most industries
2. **Override only what differs** in industry configs
3. **Use code defaults** as a safety net (always present)
4. **Document why** an industry overrides a value (in comments or docs)

### ❌ DON'T:
1. **Don't duplicate** values in industry config if they match global
2. **Don't set everything** in industry config - only what's different
3. **Don't change** game engine timing values (ticksPerSecond, etc.)
4. **Don't forget** to merge properly (industry > global > defaults)

## Examples

### Creating a New Industry

**Step 1:** Set Global Config (if not already set)
```typescript
// Admin → Global Config
{
  expGainPerHappyCustomer: 2,
  expLossPerAngryCustomer: 1,
  conversionRate: 10,
  customerSpawnIntervalSeconds: 3,
  customerPatienceSeconds: 10,
  // ... other global defaults
}
```

**Step 2:** Create Industry Config (only override what differs)
```typescript
// Admin → Industry Config → "Restaurant"
{
  // Only set what's different from global
  startingCash: 20000,              // Different from global (10000)
  monthlyExpenses: 8000,             // Different from global (3000)
  customerSpawnIntervalSeconds: 1.5, // Different from global (3)
  customerPatienceSeconds: 5,        // Different from global (10)
  failureRate: 20,                   // Different from global (0)
  serviceRevenueScale: 15,            // Different from global (10)
  
  // Don't set these - they match global defaults
  // expGainPerHappyCustomer: 2,     // Same as global, skip
  // conversionRate: 10,             // Same as global, skip
}
```

## Migration Notes

When migrating existing industries:
1. Check what values differ from global defaults
2. Only keep those differences in industry config
3. Remove values that match global (they'll be inherited automatically)

## Technical Details

The merge happens in `lib/game/config.ts`:
- `getBusinessStats()` - Merges stats: defaults → global → industry
- `getBusinessMetrics()` - Merges metrics: defaults → global → industry

Both functions ensure all fields are present, with industry values taking precedence.

