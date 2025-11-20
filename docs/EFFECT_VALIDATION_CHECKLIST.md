# Effect Validation Implementation Checklist

## ✅ Completed Changes

### 1. Validation Utility Created
- ✅ `lib/utils/effectValidation.ts` - Centralized validation using enums
- ✅ All validation uses `GameMetric` and `EffectType` enums as single source of truth
- ✅ No hardcoded strings for metric/type validation

### 2. Repositories Updated
- ✅ `staffRepository.ts` - Removed legacy columns, uses validation utility
- ✅ `upgradeRepository.ts` - Uses centralized validation
- ✅ `marketingRepository.ts` - Uses centralized validation  
- ✅ `eventRepository.ts` - Removed legacy 'reputation' support, uses enum validation

### 3. Admin UI Updated
- ✅ `EventsTab.tsx` - Removed legacy 'reputation' type support
- ✅ `useStaff.ts` - Removed legacy serviceSpeed/workloadReduction handling

## ⚠️ Things to Check/Validate

### 1. Database Data Migration (IMPORTANT)

**Old data in SQL files needs migration:**

#### Events Table
- **Old format**: `{"type": "reputation", "amount": 5}`
- **New format**: `{"type": "skillLevel", "amount": 5}`
- **Files affected**: `sql/dental_complete.sql`, `sql/freelance_complete.sql`

#### Effects in Upgrades/Staff/Marketing
- **Old format**: `{"metric": "founderWorkingHours", ...}`
- **New format**: `{"metric": "freedomScore", ...}`
- **Old format**: `{"metric": "reputationMultiplier", ...}`
- **New format**: `{"metric": "skillLevel", ...}` (or use `GameMetric.SkillLevel` with appropriate effect type)

**Action Required:**
1. Review existing database data
2. Run migration script to convert:
   - `reputation` → `skillLevel` in events
   - `founderWorkingHours` → `freedomScore` in effects
   - `reputationMultiplier` → appropriate metric (likely `skillLevel` with `EffectType.Percent`)

### 2. Testing Checklist

#### Staff Effects
- [ ] Create new staff role with effects - verify saves correctly
- [ ] Edit existing staff role - verify effects load correctly
- [ ] Delete staff role - verify no errors
- [ ] Test with invalid effect data - should be filtered out

#### Upgrade Effects
- [ ] Create new upgrade with effects - verify saves correctly
- [ ] Edit existing upgrade - verify effects load correctly
- [ ] Test upgrade effects apply correctly in game
- [ ] Test with invalid effect data - should be filtered out

#### Marketing Effects
- [ ] Create new campaign with effects - verify saves correctly
- [ ] Edit existing campaign - verify effects load correctly
- [ ] Test campaign effects apply correctly in game
- [ ] Test temporary effects (durationSeconds) work correctly

#### Event Effects
- [ ] Create new event with all effect types (cash, skillLevel, dynamicCash, metric)
- [ ] Edit existing event - verify effects load correctly
- [ ] Test event effects apply correctly in game
- [ ] Test with old 'reputation' type - should be rejected/filtered
- [ ] Test metric effects use correct enum values

### 3. Validation Behavior

**What happens with invalid data:**
- Invalid effects are **silently filtered out** (return empty array)
- This is intentional - prevents crashes but may hide data issues

**To check:**
- [ ] Add console warnings when effects are filtered? (optional)
- [ ] Verify admin UI shows empty effects list when all are invalid
- [ ] Test edge cases: null, undefined, malformed JSON

### 4. Enum Consistency

**Verify all metric references use enum:**
- [ ] Search codebase for hardcoded metric strings (should only be in enum definition)
- [ ] Verify `GameMetric` enum values match database values
- [ ] Verify `EffectType` enum values match database values

**Files to check:**
- Admin UI components (should use enum values)
- Game components (should use enum values)
- SQL files (should match enum values)

### 5. Backward Compatibility

**What was removed:**
- ❌ Legacy `service_speed` and `workload_reduction` columns in staff_roles
- ❌ Legacy `reputation` type in events (now `skillLevel`)
- ❌ Legacy `founderWorkingHours` metric (now `freedomScore`)

**Impact:**
- Old database records with legacy formats will be filtered out
- Need to migrate existing data before deploying

## 🔍 Quick Validation Commands

### Check for remaining legacy references:
```bash
# Search for reputation (should only find comments)
grep -r "reputation" --include="*.ts" --include="*.tsx" | grep -v "//" | grep -v "Previously"

# Search for hardcoded metric strings (should only find enum definitions)
grep -r "serviceSpeedMultiplier\|founderWorkingHours\|reputationMultiplier" --include="*.ts" --include="*.tsx"
```

### Test validation utility:
```typescript
import { validateAndParseUpgradeEffects } from '@/lib/utils/effectValidation';

// Should return empty array (invalid)
console.log(validateAndParseUpgradeEffects([{ metric: 'invalid', type: 'add', value: 10 }]));

// Should return valid effect
console.log(validateAndParseUpgradeEffects([{ metric: 'cash', type: 'add', value: 10 }]));
```

## 📝 Next Steps

1. **Before deploying:**
   - [ ] Run database migration script
   - [ ] Test with real database data
   - [ ] Verify no console errors/warnings

2. **After deploying:**
   - [ ] Monitor for validation errors
   - [ ] Check admin UI works correctly
   - [ ] Verify game effects apply correctly

3. **Future improvements:**
   - [ ] Add logging for filtered effects (optional)
   - [ ] Consider migration tool for old data
   - [ ] Add unit tests for validation utility

