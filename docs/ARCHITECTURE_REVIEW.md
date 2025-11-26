# Architecture Review: Requirement/Condition/Flag System

## Executive Summary

**✅ Conditions are NO LONGER used for requirements** - They've been completely removed from the requirement system. The `GameCondition` type still exists in the codebase but appears to be **legacy/unused** code that could potentially be cleaned up.

**✅ The new requirement system is solid** and covers most game design needs. However, there are some potential gaps and improvements worth considering.

---

## 1. Current State: Conditions vs Requirements

### What Changed
- ❌ **Removed**: `condition` type from requirements
- ✅ **Kept**: `flag`, `metric`, `upgrade`, `staff` requirement types
- ⚠️ **Legacy**: `GameCondition` still exists but appears unused

### Where Conditions Are Still Referenced
- `lib/game/conditionEvaluator.ts` - Has evaluation functions but **not called anywhere**
- `lib/store/slices/conditionSlice.ts` - Stores `availableConditions` but **not used**
- `lib/data/conditionRepository.ts` - Can fetch conditions from DB but **not used in game logic**
- Admin panel has a "Conditions" tab but conditions don't affect gameplay

### Recommendation
**Consider removing the Condition system entirely** if it's not being used. It's creating confusion and maintenance overhead. If you need periodic/triggered conditions in the future, you can add them back with a clearer purpose.

---

## 2. Requirement System Architecture Review

### ✅ Strengths

#### **Comprehensive Coverage**
The requirement system handles all major game design patterns:
- **Prerequisites** (upgrade chains, service unlocks)
- **Resource gates** (cash, exp, level checks)
- **State gates** (flags for story progression)
- **Staff gates** (hiring requirements)

#### **Clean Type System**
```typescript
type: 'flag' | 'metric' | 'upgrade' | 'staff'
```
- Clear, explicit types
- Easy to extend
- Type-safe

#### **Flexible Operators**
```typescript
operator: '>=' | '<=' | '>' | '<' | '=='
```
- Covers most comparison needs
- Can express "at least X", "exactly X", "less than X"

#### **Good Separation of Concerns**
- Requirements are data (JSONB in DB)
- Evaluation logic is separate (`requirementChecker.ts`)
- UI is separate (`RequirementsSelector.tsx`)

---

### ⚠️ Potential Gaps & Limitations

#### **1. OR Logic Not Supported**
**Current**: All requirements use AND logic (all must be met)

**Missing**: OR logic (at least one must be met)

**Example Use Case**:
```json
// Want: "Require cash >= 1000 OR level >= 5"
// Currently: Can't express this
```

**Workaround**: Create multiple versions of the same item with different requirements

**Recommendation**: Add requirement groups:
```typescript
{
  type: 'group',
  logic: 'or', // or 'and'
  requirements: [
    { type: 'metric', id: 'cash', operator: '>=', value: 1000 },
    { type: 'metric', id: 'level', operator: '>=', value: 5 }
  ]
}
```

#### **2. No Time-Based Requirements**
**Missing**: "Require X days/months of gameplay"

**Example Use Case**:
- "Unlock after 3 months"
- "Available only in first month"

**Workaround**: Use `gameTime` metric, but it's in seconds (not intuitive)

**Recommendation**: Add `month` metric or time-based requirement type

#### **3. No Compound Metrics**
**Missing**: Requirements based on calculated values

**Example Use Case**:
- "Require profit margin > 20%" (revenue - expenses)
- "Require cash flow > 0" (cash - monthly expenses)

**Workaround**: Pre-calculate and store as flags

**Recommendation**: Add expression evaluator or computed metrics

#### **4. No Negation for Numeric Types**
**Current**: Flags can be negated (`expected: false`)

**Missing**: Numeric types can't be negated

**Example Use Case**:
- "Require cash < 1000" (can use `<` operator, but not intuitive)
- "Require NOT level 5" (can't express)

**Workaround**: Use `<` or `>` operators

**Recommendation**: Add `not` flag or improve operator support

#### **5. No Service-Specific Requirements**
**Missing**: Requirements based on services completed

**Example Use Case**:
- "Unlock after completing 10 services"
- "Require completing 'Premium Website' service"

**Workaround**: Use flags set by services

**Recommendation**: Add `service` requirement type:
```typescript
{
  type: 'service',
  id: 'premium_website', // or '*' for any service
  operator: '>=',
  value: 10 // completion count
}
```

#### **6. No Customer-Based Requirements**
**Missing**: Requirements based on customer metrics

**Example Use Case**:
- "Require 50 happy customers"
- "Require customer satisfaction > 80%"

**Workaround**: Track via flags/metrics

**Recommendation**: Add customer tracking metrics

---

## 3. Effect System Architecture Review

### ✅ Strengths

#### **Comprehensive Effect Types**
- `add` - Flat addition
- `percent` - Percentage modification
- `multiply` - Multiplicative
- `set` - Override

#### **Clear Application Order**
```
Add → Percent → Multiply → Set
```
- Predictable behavior
- Well-documented

#### **Good Metric Coverage**
- Core resources (cash, time, exp)
- Business operations (capacity, speed, expenses)
- Revenue modifiers (multipliers, flat bonuses)
- Quality metrics (failure rate, conversion rate)

### ⚠️ Potential Gaps

#### **1. Conditional Effects**
**Missing**: Effects that only apply under certain conditions

**Example Use Case**:
- "Increase revenue by 20% IF cash > 5000"
- "Reduce expenses by 10% IF staff count >= 3"

**Recommendation**: Add conditional effects:
```typescript
{
  metric: 'serviceRevenueMultiplier',
  type: 'percent',
  value: 20,
  condition: {
    type: 'metric',
    id: 'cash',
    operator: '>',
    value: 5000
  }
}
```

#### **2. Stacking Limits**
**Missing**: Limits on how many times effects can stack

**Example Use Case**:
- "Max 3 speed upgrades can stack"
- "Revenue multiplier capped at 200%"

**Recommendation**: Add stacking constraints to metrics

#### **3. Effect Dependencies**
**Missing**: Effects that depend on other effects

**Example Use Case**:
- "Speed bonus only applies if capacity > 1"
- "Revenue bonus scales with staff count"

**Recommendation**: Add effect dependencies or computed effects

---

## 4. Overall Architecture Assessment

### ✅ What Works Well

1. **Data-Driven Design**
   - Everything configurable via database
   - No code changes needed for content
   - Admin panel for easy editing

2. **Type Safety**
   - Strong TypeScript types
   - Clear interfaces
   - Good validation

3. **Separation of Concerns**
   - Data layer (repositories)
   - Logic layer (checkers, evaluators)
   - UI layer (components)
   - Store layer (state management)

4. **Extensibility**
   - Easy to add new requirement types
   - Easy to add new metrics
   - Easy to add new effect types

5. **Documentation**
   - Good inline comments
   - Clear function names
   - Migration guides

### ⚠️ Areas for Improvement

1. **Dead Code**
   - `GameCondition` system appears unused
   - `conditionEvaluator.ts` not called
   - Consider cleanup

2. **Missing Features**
   - OR logic for requirements
   - Conditional effects
   - Service/customer-based requirements

3. **Complexity**
   - Some areas could be simplified
   - Effect system has many moving parts
   - Consider helper utilities

---

## 5. Recommendations

### High Priority

1. **Remove or Document Conditions**
   - If unused: Remove `GameCondition` system
   - If needed: Document where/how it's used
   - Reduces confusion

2. **Add OR Logic Support**
   - Most requested missing feature
   - Enables more complex game design
   - Relatively easy to implement

3. **Add Service Requirements**
   - Common game design pattern
   - Enables progression gates
   - Straightforward to add

### Medium Priority

4. **Add Conditional Effects**
   - Enables more dynamic gameplay
   - More complex to implement
   - Can be worked around with flags

5. **Add Time-Based Requirements**
   - Add `month` metric
   - Or time-based requirement type
   - Useful for pacing

### Low Priority

6. **Add Compound Metrics**
   - Nice to have
   - Can be worked around
   - Adds complexity

7. **Improve Documentation**
   - Architecture diagrams
   - Design decision docs
   - More examples

---

## 6. Conclusion

### Is the Current System Enough?

**For 80-90% of game design needs: YES ✅**

The current requirement/effect system covers:
- ✅ Prerequisites and gates
- ✅ Resource requirements
- ✅ State-based unlocks
- ✅ Staff requirements
- ✅ Complex effect combinations
- ✅ Temporary effects
- ✅ Permanent upgrades

### What's Missing?

**For advanced game design: Some gaps ⚠️**

Missing features:
- ❌ OR logic (workaround: multiple items)
- ❌ Service-based requirements (workaround: flags)
- ❌ Conditional effects (workaround: multiple items)
- ❌ Time-based requirements (workaround: gameTime metric)

### Final Verdict

**The architecture is solid and extensible.** The current system will handle most business simulation game needs. The missing features are "nice to have" rather than "must have" - you can work around them with the existing tools.

**Recommendation**: Ship with current system, add missing features as needed based on actual game design requirements.

---

## 7. Quick Reference: What Can You Do?

### ✅ Currently Supported

- [x] Require upgrade level (e.g., "Better Computer >= 5")
- [x] Require cash/exp/level/metrics
- [x] Require flags (boolean state)
- [x] Require staff count
- [x] Complex AND logic (all requirements must be met)
- [x] Multiple requirement types in one item
- [x] Temporary effects (marketing campaigns)
- [x] Permanent effects (upgrades)
- [x] Effect stacking (add → percent → multiply → set)

### ❌ Not Currently Supported

- [ ] OR logic (at least one requirement)
- [ ] Service completion requirements
- [ ] Customer-based requirements
- [ ] Conditional effects (if/then)
- [ ] Time-based requirements (months/days)
- [ ] Compound metrics (calculated values)
- [ ] Effect stacking limits

---

**Last Updated**: Architecture review after requirement system migration
**Reviewer**: Tech Lead / Game Designer perspective

