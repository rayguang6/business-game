# Data Architecture Analysis & Refactoring Recommendations

## Executive Summary

This document analyzes the current data fetching patterns, identifies inconsistencies and legacy code, and provides recommendations for refactoring.

---

## 1. How Data Fetching Currently Works

### 1.1 Data Flow Overview

```
Game Page Load
    ↓
1. Load Global Config (once, on mount)
    ↓
2. Load Industry Content (when industry selected)
    ↓
3. Store in Zustand Config Store
    ↓
4. Game uses config from store (no more DB calls)
```

### 1.2 Detailed Flow

#### **Phase 1: Global Config Loading** (`app/game/[industry]/page.tsx`)

```typescript
// Loaded ONCE when component mounts
useEffect(() => {
  loadGlobalSimulationSettings()  // → fetchGlobalSimulationConfig()
    .then(setGlobalConfigState)    // → Stores in useConfigStore
}, []);
```

**What's loaded:**
- Business metrics (global defaults)
- Business stats (global defaults)
- Movement config (global only)
- Map config (global defaults)
- Layout config (global defaults)
- Win/lose conditions (global defaults)
- Customer images (global only)
- Staff name pool (global only)

#### **Phase 2: Industry Content Loading** (`app/game/[industry]/page.tsx`)

```typescript
// Loaded when industry is selected
useEffect(() => {
  loadIndustryContent(industryId)  // → Fetches ALL industry data in parallel
    .then(setIndustryConfigState)  // → Stores in useConfigStore
}, [selectedIndustry]);
```

**What's loaded (in parallel via Promise.all):**
- Services (`fetchServicesForIndustry`)
- Upgrades (`fetchUpgradesForIndustry`)
- Events (`fetchEventsForIndustry`)
- Marketing campaigns (`fetchMarketingCampaignsForIndustry`)
- Staff data (`fetchStaffDataForIndustry`)
- Flags (`fetchFlagsForIndustry`)
- Conditions (`fetchConditionsForIndustry`)
- Industry simulation config (`fetchIndustrySimulationConfig`)

#### **Phase 3: Runtime Access** (`lib/game/config.ts`)

```typescript
// Game code accesses config from store (NOT database)
getServicesForIndustry(industryId)  // → Reads from useConfigStore
getBusinessMetrics(industryId)     // → Reads from useConfigStore + fallback chain
```

**Fallback Chain (current):**
1. Industry-specific config (from store, loaded from DB)
2. Global config (from store, loaded from DB)

---

## 2. Repository Pattern Analysis

### 2.1 Current Repository Structure

All repositories follow a similar pattern:

```typescript
// Pattern: lib/data/{entity}Repository.ts
export async function fetch{Entity}ForIndustry(industryId: IndustryId): Promise<{Entity}[] | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('{table}')
    .select('...')
    .eq('industry_id', industryId);
  
  if (error) {
    console.error('...', error);
    return null;
  }
  
  return data?.map(mapRowToEntity) ?? [];
}
```

### 2.2 Repository List

| Repository | Table | Returns | Used By |
|------------|-------|---------|---------|
| `serviceRepository.ts` | `services` | `IndustryServiceDefinition[]` | Game, Admin |
| `upgradeRepository.ts` | `upgrades` | `UpgradeDefinition[]` | Game, Admin |
| `eventRepository.ts` | `events` | `GameEvent[]` | Game, Admin |
| `marketingRepository.ts` | `marketing_campaigns` | `MarketingCampaign[]` | Game, Admin |
| `staffRepository.ts` | `staff_roles`, `staff_presets` | `StaffDataResult` | Game, Admin |
| `flagRepository.ts` | `flags` | `GameFlag[]` | Game, Admin |
| `conditionRepository.ts` | `conditions` | `GameCondition[]` | Game, Admin |
| `industryRepository.ts` | `industries` | `Industry[]` | Game, Admin |
| `simulationConfigRepository.ts` | `global_simulation_config` | `GlobalSimulationConfigResult` | Game, Admin |
| `industrySimulationConfigRepository.ts` | `industry_simulation_config` | `IndustrySimulationConfigResult` | Game, Admin |
| `layoutRepository.ts` | `industry_simulation_config` (layout columns) | `SimulationLayoutConfig` | Game |

---

## 3. Inconsistencies & Issues Found

### 3.1 ✅ **DUPLICATE FALLBACK LOGIC REMOVED**

**Previous problem:** Two different fallback systems existed (`configHelpers.ts` async helpers vs `config.ts` sync helpers).

**Current state:**
- `lib/game/configHelpers.ts` has been deleted.
- All loading is routed through `lib/game/simulationConfigService.ts`.
- Runtime access is **only** through `lib/game/config.ts`, which reads from the store.

### 3.2 ❌ **INCONSISTENT NULL HANDLING**

**Problem:** Repositories return different types for "not found":

```typescript
// Some return null
fetchServicesForIndustry() → null | IndustryServiceDefinition[]

// Some return empty array
fetchServicesForIndustry() → [] (when no data)

// Some return null OR empty array
fetchFlagsForIndustry() → null | GameFlag[]  // null = error, [] = no flags
```

**Impact:** Callers must handle both `null` and `[]` cases.

**Recommendation:** Standardize:
- `null` = Error (DB failure, Supabase not configured)
- `[]` = Success but no data found

### 3.3 ✅ **LEGACY FALLBACK CODE REMOVED FROM CONFIG.TS**

**Previous problem:** `lib/game/config.ts` used hardcoded defaults (`createDefaultSimulationConfig`) as a final fallback.

**Current state:**
- `config.ts` no longer calls `createDefaultSimulationConfig` or any other code-level defaults.
- If required data (global config or per-industry config) is missing, the loaders throw and the game shows a configuration error page.

### 3.4 ❌ **LEGACY FIELD SUPPORT**

**Problem:** Support for old field names:

```typescript
// industrySimulationConfigRepository.ts:38-43
startingFreedomScore: c.startingFreedomScore ?? (c as any).founderWorkHours  // Legacy support
```

**Impact:** Code supports old database schema.

**Recommendation:**
- ✅ **KEEP** if database still has old data
- ❌ **REMOVE** after database migration completes

### 3.5 ✅ **DUPLICATE LAYOUT FETCHING REMOVED**

**Current behavior:**
- Layout config is resolved only via `fetchIndustrySimulationConfig()` inside `simulationConfigService.ts`.
- There is no separate `layoutRepository`-driven fallback during game load.

### 3.6 ❌ **INCONSISTENT ERROR HANDLING**

**Problem:** Some repositories log errors, some don't:

```typescript
// serviceRepository.ts - Logs error
if (error) {
  console.error('Failed to fetch services from Supabase', error);
  return null;
}

// industryRepository.ts - Logs only in dev
if (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Supabase query error:', error);
  }
  return null;
}
```

**Recommendation:** Standardize error logging (always log, but maybe different levels).

### 3.7 ⚠️ **ADMIN VS GAME DATA FETCHING**

**Problem:** Admin panel uses repositories directly, game uses store:

```typescript
// Admin (useServices.ts)
const result = await fetchServicesForIndustry(industryId);  // Direct DB call

// Game (config.ts)
getServicesForIndustry(industryId)  // Reads from store
```

**Impact:** Admin always hits DB, game uses cached store.

**Recommendation:**
- ✅ **KEEP** - Admin needs fresh data for editing
- ✅ **KEEP** - Game uses cached data for performance

---

## 4. Data Loading Behavior

### 4.1 When Data is Fetched

| Context | When | What |
|---------|------|------|
| **Game Start** | On page mount | Global config (once) |
| **Game Start** | When industry selected | Industry content (once per industry) |
| **Game Runtime** | Never | Uses cached store data |
| **Admin Panel** | On tab load | Fetches fresh from DB |
| **Admin Panel** | On save | Upserts to DB, updates local state |

### 4.2 Data Lifecycle

```
1. INITIAL LOAD (Game Page)
   ├─ Global config → Store (persists for session)
   └─ Industry config → Store (persists for session)

2. RUNTIME (During Game)
   └─ All reads from store (no DB calls)

3. ADMIN EDITING
   ├─ Loads fresh from DB (for editing)
   ├─ Saves to DB (upsert)
   └─ Updates local admin state (not game store)

4. GAME RESTART
   └─ Uses cached store data (no reload unless page refresh)
```

### 4.3 Store Structure

```typescript
// useConfigStore (Zustand)
{
  globalConfig: GlobalSimulationConfigState | null,
  industryConfigs: {
    [industryId]: IndustryContentConfig
  },
  configStatus: 'idle' | 'loading' | 'ready' | 'error',
  configError: string | null
}
```

**Key Points:**
- ✅ Data is **cloned** when stored (prevents mutations)
- ✅ Data is **cached** per industry (no reload on switch)
- ✅ Store persists for **session lifetime** (until page refresh)

---

## 5. Tech Lead Recommendations

### 5.1 ✅ **IMMEDIATE ACTIONS (High Priority)**

#### **1. Remove `configHelpers.ts`** ✅ Done
- Logic is now centralized in `lib/game/simulationConfigService.ts`.

#### **2. Standardize Repository Return Types**
- **Why:** Inconsistent null/empty array handling
- **Action:** 
  - `null` = Error
  - `[]` = Success, no data
- **Risk:** Medium (requires updating callers)

#### **3. Consolidate Layout Fetching** ✅ Done
- Layout is only fetched via `fetchIndustrySimulationConfig()` and parsed through `layoutRepository` helpers.

### 5.2 ⚠️ **MEDIUM PRIORITY (Technical Debt)**

#### **4. Remove Legacy Fallback Code**
- **Why:** Code defaults rarely used, adds complexity
- **Action:** 
  - Add logging when fallback is used
  - Monitor for 1-2 weeks
  - Remove if never triggered
- **Risk:** Medium (safety net removal)

#### **5. Standardize Error Logging**
- **Why:** Inconsistent error handling
- **Action:** Create shared error logging utility
- **Risk:** Low

#### **6. Remove Legacy Field Support**
- **Why:** Old schema support (`founderWorkHours` → `startingFreedomScore`)
- **Action:** 
  - Check database for old data
  - Migrate if needed
  - Remove legacy support
- **Risk:** Low (if DB migrated)

### 5.3 💡 **FUTURE IMPROVEMENTS (Nice to Have)**

#### **7. Add Data Validation Layer**
- **Why:** Catch bad data early
- **Action:** Add Zod schemas for repository responses
- **Risk:** Low

#### **8. Add Repository Caching**
- **Why:** Admin panel hits DB on every tab switch
- **Action:** Add React Query or SWR for admin panel
- **Risk:** Medium (new dependency)

#### **9. Extract Repository Interface**
- **Why:** Standardize repository pattern
- **Action:** Create base repository interface/abstract class
- **Risk:** Low (refactor)

---

## 6. Should We Delete Config?

### 6.1 Current Config Files

| File | Purpose | Keep? |
|------|---------|-------|
| `lib/game/config.ts` | Runtime config access (store-based) | ✅ **KEEP** |
| `lib/game/simulationConfigService.ts` | Load global + industry config from DB into store | ✅ **KEEP** |
| `lib/game/industryConfigs.ts` | Hardcoded defaults (legacy) | ❌ **DELETED** |

### 6.2 Recommendation (Updated)

**✅ KEEP `config.ts`** - Core runtime config system
- Used throughout game code
- Provides fallback chain (industry → global) using **store-backed DB data only**
- Well-structured and performant

**✅ KEEP `simulationConfigService.ts`** - Single entry point for loading config
- Handles validation and “fail fast” behavior if required data is missing.

**❌ DELETE `industryConfigs.ts`** - Legacy hardcoded defaults are no longer part of the runtime.
- Use SQL seeds (e.g. `sql/freelance_complete.sql`) or admin tooling for initial data instead.

---

## 7. Best Practices Recommendations

### 7.1 Repository Pattern

**✅ DO:**
- Return `null` on error, `[]` on success (no data)
- Log errors consistently
- Validate and map data before returning
- Use TypeScript types strictly

**❌ DON'T:**
- Mix null and empty array semantics
- Return raw database rows
- Skip error handling

### 7.2 Config Access Pattern

**✅ DO:**
- Use `config.ts` functions for runtime access
- Read from store (not DB) during game
- Load data once at game start

**❌ DON'T:**
- Fetch from DB during game runtime
- Mutate store data directly
- Use `configHelpers.ts` for runtime access

### 7.3 Data Loading Pattern

**✅ DO:**
- Load global config once on mount
- Load industry config when industry selected
- Use parallel fetching (`Promise.all`) for industry content
- Store in Zustand for session persistence

**❌ DON'T:**
- Reload data unnecessarily
- Fetch sequentially when parallel is possible
- Store raw DB responses (always map/validate)

---

## 8. Summary

### Current State
- ✅ **Good:** Data loaded once, cached in store, efficient runtime access
- ⚠️ **Issues:** Duplicate fallback logic, inconsistent error handling, legacy code
- ❌ **Problems:** Redundant layout fetching, inconsistent null handling

### Recommended Actions
1. **Delete** `configHelpers.ts` (duplicate logic)
2. **Standardize** repository return types (null vs [])
3. **Consolidate** layout fetching (remove redundancy)
4. **Monitor** fallback usage before removing code defaults
5. **Standardize** error logging

### Risk Assessment
- **Low Risk:** Removing `configHelpers.ts`, consolidating layout fetching
- **Medium Risk:** Standardizing return types (requires caller updates)
- **Low Risk:** Standardizing error logging

---

## 9. Questions to Consider

1. **Do we need code defaults?** (Currently fallback if DB fails)
   - If DB is reliable → Remove
   - If DB might fail → Keep with logging

2. **Should admin panel cache data?** (Currently always hits DB)
   - If editing needs fresh data → Keep current
   - If performance is issue → Add React Query/SWR

3. **Should we add data validation?** (Currently minimal validation)
   - If data quality is concern → Add Zod schemas
   - If data is trusted → Keep current

4. **Should we remove legacy field support?** (`founderWorkHours`)
   - If DB migrated → Remove
   - If old data exists → Keep until migration

---

## Next Steps

1. Review this analysis with team
2. Prioritize recommendations
3. Create refactoring tickets
4. Implement changes incrementally
5. Test thoroughly after each change

