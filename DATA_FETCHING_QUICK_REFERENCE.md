# Data Fetching Quick Reference Guide

## 🎯 TL;DR - How Data Works

1. **Game loads data ONCE** when page/industry loads → Stores in Zustand
2. **Game runtime reads from store** (no DB calls)
3. **Admin panel fetches fresh** from DB (for editing)

---

## 📋 Repository Functions

All repositories are in `lib/data/` and follow this pattern:

```typescript
// Fetch functions
fetch{Entity}ForIndustry(industryId: IndustryId): Promise<{Entity}[] | null>

// Upsert functions (admin only)
upsert{Entity}ForIndustry(entity: {Entity}): Promise<{success: boolean, ...}>

// Delete functions (admin only)
delete{Entity}ById(id: string): Promise<{success: boolean, ...}>
```

### Available Repositories

| Entity | Repository File | Fetch Function |
|--------|----------------|----------------|
| Services | `serviceRepository.ts` | `fetchServicesForIndustry()` |
| Upgrades | `upgradeRepository.ts` | `fetchUpgradesForIndustry()` |
| Events | `eventRepository.ts` | `fetchEventsForIndustry()` |
| Marketing | `marketingRepository.ts` | `fetchMarketingCampaignsForIndustry()` |
| Staff | `staffRepository.ts` | `fetchStaffDataForIndustry()` |
| Flags | `flagRepository.ts` | `fetchFlagsForIndustry()` |
| Conditions | `conditionRepository.ts` | `fetchConditionsForIndustry()` |
| Industries | `industryRepository.ts` | `fetchIndustriesFromSupabase()` |
| Global Config | `simulationConfigRepository.ts` | `fetchGlobalSimulationConfig()` |
| Industry Config | `industrySimulationConfigRepository.ts` | `fetchIndustrySimulationConfig()` |

---

## 🎮 Game Runtime Access (Use This!)

**For game code, ALWAYS use `lib/game/config.ts`:**

```typescript
import { 
  getServicesForIndustry,
  getUpgradesForIndustry,
  getBusinessMetrics,
  getBusinessStats,
  getLayoutConfig,
  // ... etc
} from '@/lib/game/config';

// These read from store (fast, no DB calls)
const services = getServicesForIndustry(industryId);
const metrics = getBusinessMetrics(industryId);
```

**Fallback Chain:**
1. Industry-specific config (from store)
2. Global config (from store)  
3. Code defaults (hardcoded)

---

## 🔧 Admin Panel Access (Use This!)

**For admin code, use repositories directly:**

```typescript
import { fetchServicesForIndustry } from '@/lib/data/serviceRepository';

// Admin fetches fresh from DB
const services = await fetchServicesForIndustry(industryId);
```

**Why?** Admin needs fresh data for editing, not cached data.

---

## 📊 Data Loading Flow

### Game Page Load

```
1. Component Mounts
   ↓
2. Load Global Config (once)
   fetchGlobalSimulationConfig()
   → Store in useConfigStore.globalConfig
   ↓
3. Industry Selected
   ↓
4. Load Industry Content (parallel)
   Promise.all([
     fetchServicesForIndustry(),
     fetchUpgradesForIndustry(),
     fetchEventsForIndustry(),
     // ... etc
   ])
   → Store in useConfigStore.industryConfigs[industryId]
   ↓
5. Game Starts
   → Reads from store (no more DB calls)
```

### Admin Panel Load

```
1. Tab Opens
   ↓
2. Fetch Fresh from DB
   fetch{Entity}ForIndustry(industryId)
   → Store in local component state
   ↓
3. User Edits
   → Update local state
   ↓
4. User Saves
   upsert{Entity}ForIndustry(entity)
   → Update DB + local state
```

---

## 🗄️ Store Structure

```typescript
// useConfigStore (Zustand)
{
  globalConfig: {
    businessMetrics: BusinessMetrics,
    businessStats: BusinessStats,
    movement: MovementConfig,
    mapConfig: MapConfig,
    layoutConfig: SimulationLayoutConfig,
    // ... etc
  },
  
  industryConfigs: {
    [industryId]: {
      services: IndustryServiceDefinition[],
      upgrades: UpgradeDefinition[],
      events: GameEvent[],
      marketingCampaigns: MarketingCampaign[],
      staffRoles: StaffRoleConfig[],
      staffPresets: StaffPreset[],
      flags: GameFlag[],
      conditions: GameCondition[],
      layout: SimulationLayoutConfig,
      // ... etc
    }
  },
  
  configStatus: 'idle' | 'loading' | 'ready' | 'error',
  configError: string | null
}
```

---

## ⚠️ Common Mistakes

### ❌ DON'T: Fetch from DB in game runtime

```typescript
// BAD - Don't do this in game code
const services = await fetchServicesForIndustry(industryId);
```

### ✅ DO: Read from store in game runtime

```typescript
// GOOD - Use config.ts functions
const services = getServicesForIndustry(industryId);
```

---

### ❌ DON'T: Use configHelpers.ts for runtime

```typescript
// BAD - Don't use async helpers in game runtime
const metrics = await getBusinessMetricsWithFallback(industryId);
```

### ✅ DO: Use config.ts sync functions

```typescript
// GOOD - Use sync store-based functions
const metrics = getBusinessMetrics(industryId);
```

---

### ❌ DON'T: Mutate store data directly

```typescript
// BAD - Don't mutate store
const config = useConfigStore.getState().industryConfigs[industryId];
config.services.push(newService);  // ❌ Mutation!
```

### ✅ DO: Use store setters

```typescript
// GOOD - Use store actions
setIndustryConfig(industryId, updatedConfig);
```

---

## 🔍 Debugging Tips

### Check if data is loaded

```typescript
const configStatus = useConfigStore(state => state.configStatus);
// 'idle' | 'loading' | 'ready' | 'error'
```

### Check what's in store

```typescript
const globalConfig = useConfigStore.getState().globalConfig;
const industryConfig = useConfigStore.getState().industryConfigs[industryId];
console.log('Global:', globalConfig);
console.log('Industry:', industryConfig);
```

### Check repository return values

```typescript
const result = await fetchServicesForIndustry(industryId);
// null = Error (check console)
// [] = Success, no data
// [...] = Success, has data
```

---

## 📝 Code Examples

### Game Component (Reading Config)

```typescript
import { getServicesForIndustry, getBusinessMetrics } from '@/lib/game/config';

function MyGameComponent() {
  const industryId = useGameStore(state => state.selectedIndustry?.id);
  
  // Read from store (fast, no DB call)
  const services = getServicesForIndustry(industryId);
  const metrics = getBusinessMetrics(industryId);
  
  return <div>...</div>;
}
```

### Admin Component (Fetching/Editing)

```typescript
import { fetchServicesForIndustry, upsertServiceForIndustry } from '@/lib/data/serviceRepository';

function AdminServicesTab({ industryId }: { industryId: string }) {
  const [services, setServices] = useState([]);
  
  useEffect(() => {
    // Fetch fresh from DB
    fetchServicesForIndustry(industryId).then(setServices);
  }, [industryId]);
  
  const handleSave = async (service) => {
    const result = await upsertServiceForIndustry(service);
    if (result.success) {
      setServices(prev => [...prev, result.data]);
    }
  };
  
  return <div>...</div>;
}
```

---

## 🚀 Performance Notes

- **Game:** Data loaded once, cached in store → Fast runtime access
- **Admin:** Fetches fresh on tab load → Always up-to-date for editing
- **Parallel Loading:** Industry content loads in parallel (`Promise.all`) → Fast initial load

---

## 📚 Related Files

- **Repositories:** `lib/data/*Repository.ts`
- **Config Access:** `lib/game/config.ts`
- **Store:** `lib/store/configStore.ts`
- **Service Layer:** `lib/game/simulationConfigService.ts`
- **Game Page:** `app/game/[industry]/page.tsx`
- **Admin Hooks:** `app/admin/hooks/use*.ts`

