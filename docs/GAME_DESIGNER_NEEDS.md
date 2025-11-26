# Game Designer Needs Analysis

## Quick Answer: Marketing Requirements

**✅ YES! Marketing campaigns CAN require upgrade levels** - They already support the full requirement system!

Just like upgrades, services, events, and staff, marketing campaigns can have requirements:
- Require upgrade level (e.g., "Marketing Training >= 3")
- Require cash/metrics
- Require flags
- Require staff

**Example**: "Premium Ad Campaign" requires:
- Upgrade: "Marketing Training" level 3+
- Metric: Cash >= 5000
- Flag: "Has Portfolio"

---

## Events: What a Game Designer Might Need

### ✅ Currently Supported

1. **Event Requirements** - Events can require:
   - Upgrade levels
   - Cash/metrics
   - Flags
   - Staff count
   - Example: "High-value client event" only triggers if cash >= 10000

2. **Time-Based Triggers** - Events trigger at specific times:
   - Configurable trigger points (e.g., 15s, 30s, 45s into each month)
   - Events check requirements at trigger time

3. **Multiple Choices** - Each event can have multiple choices:
   - Different costs (cash/time)
   - Different consequences
   - Weighted random outcomes

4. **Delayed Consequences** - Choices can have delayed effects:
   - Effects trigger after X seconds
   - Can have success/failure based on requirements
   - Example: "Invest in training" → check requirements after 30s → success/failure

5. **Dynamic Effects** - Effects can be calculated dynamically:
   - `dynamicCash`: "monthlyExpenses * 0.1" (10% of expenses)
   - Calculated at choice time, locked in

6. **Flag Setting** - Choices can set flags:
   - Story progression
   - Unlock new content
   - Track player decisions

---

### ⚠️ Potentially Missing Features

#### 1. **Event Frequency/Cooldown**
**Current**: Events trigger once per trigger point (if requirements met)

**Missing**: 
- Cooldown between same event
- Frequency limits (max X times per game)
- One-time events (can only happen once)

**Use Case**:
- "Big client opportunity" - should only happen once
- "Monthly newsletter" - can happen every month
- "Emergency" - cooldown of 2 months

**Recommendation**: Add to event config:
```typescript
{
  id: "big_client",
  maxOccurrences: 1, // or null for unlimited
  cooldownMonths: 2, // or null for no cooldown
  // ... rest of event
}
```

#### 2. **Event Probability/Weighting**
**Current**: Events are randomly selected from eligible events

**Missing**: 
- Weighted probability (some events more likely)
- Probability modifiers based on game state
- Guaranteed events (weight = 100%)

**Use Case**:
- "Common issue" - 80% chance
- "Rare opportunity" - 5% chance
- "Story event" - guaranteed if requirements met

**Recommendation**: Add weight to events:
```typescript
{
  id: "common_issue",
  weight: 80, // Higher = more likely
  // ... rest of event
}
```

#### 3. **Event Chains/Sequences**
**Current**: Events are independent

**Missing**: 
- Event chains (Event A → Event B → Event C)
- Prerequisite events (Event B only if Event A happened)
- Story branches

**Use Case**:
- "Client referral" → "Follow-up meeting" → "Contract signed"
- "Training started" → "Training completed" → "Skill boost"

**Recommendation**: Add event dependencies:
```typescript
{
  id: "follow_up_meeting",
  requiresEvent: "client_referral", // Must have happened
  // ... rest of event
}
```

#### 4. **Event Visibility/Hidden Events**
**Current**: All events are visible in admin, all trigger randomly

**Missing**: 
- Hidden events (not shown in admin list)
- Conditional visibility
- Debug vs production events

**Use Case**:
- Test events (hidden in production)
- Secret events (unlockable content)
- Debug events (only in dev mode)

**Recommendation**: Add visibility flag:
```typescript
{
  id: "secret_event",
  visible: false, // Hidden from admin UI
  // ... rest of event
}
```

#### 5. **Event Categories Beyond Opportunity/Risk**
**Current**: Only `opportunity` and `risk`

**Missing**: 
- More categories (story, tutorial, milestone, etc.)
- Category-based filtering
- Category-specific UI styling

**Use Case**:
- Story events (narrative progression)
- Tutorial events (teaching mechanics)
- Milestone events (achievement unlocks)

**Recommendation**: Extend category enum:
```typescript
type EventCategory = 'opportunity' | 'risk' | 'story' | 'tutorial' | 'milestone';
```

#### 6. **Event Conditions Beyond Requirements**
**Current**: Requirements are checked at trigger time

**Missing**: 
- Conditional event text (different text based on state)
- Conditional choices (choices appear/disappear based on state)
- Dynamic event content

**Use Case**:
- "Client meeting" - different text if you have staff vs solo
- "Investment opportunity" - different choices if cash > 10000

**Recommendation**: Add conditional content:
```typescript
{
  id: "client_meeting",
  summary: "Default text",
  conditionalSummary: [
    { condition: { type: "staff", id: "*", operator: ">=", value: 1 }, text: "Your team meets with client..." },
    { condition: { type: "staff", id: "*", operator: "==", value: 0 }, text: "You meet with client alone..." }
  ],
  // ... rest of event
}
```

#### 7. **Event Replayability**
**Current**: Events can trigger multiple times (if requirements met)

**Missing**: 
- One-time events (can't happen again)
- Event history tracking
- "Already seen" flag

**Use Case**:
- Story events (shouldn't repeat)
- Tutorial events (only once)
- Unique opportunities

**Recommendation**: Add `oneTime` flag:
```typescript
{
  id: "tutorial_event",
  oneTime: true, // Can only happen once per game
  // ... rest of event
}
```

#### 8. **Event Timing Control**
**Current**: Events trigger at fixed time points

**Missing**: 
- Random timing within range
- Time-of-day effects
- Month-specific events

**Use Case**:
- "End of month report" - always at month end
- "Random client call" - anytime in month
- "Holiday sale" - only in December

**Recommendation**: Add timing options:
```typescript
{
  id: "end_of_month",
  timing: "monthEnd", // or "random" or "specific" with time range
  // ... rest of event
}
```

---

## Other Features: Are They Straightforward?

### ✅ Upgrades - Well Covered
- Requirements ✅
- Effects ✅
- Costs (cash/time) ✅
- Max levels ✅
- Flag setting ✅

**Potential Additions**:
- Upgrade trees (visualization)
- Upgrade prerequisites visualization
- Upgrade effects preview

### ✅ Marketing - Well Covered
- Requirements ✅ (YES, they support upgrade requirements!)
- Effects ✅
- Costs (cash/time) ✅
- Cooldowns ✅
- Temporary effects ✅

**Potential Additions**:
- Campaign templates
- Campaign effectiveness tracking
- Campaign history

### ✅ Services - Well Covered
- Requirements ✅
- Pricing categories ✅
- Weightage ✅
- Duration ✅

**Potential Additions**:
- Service bundles
- Service dependencies
- Service unlock visualization

### ✅ Staff - Well Covered
- Requirements ✅
- Effects ✅
- Salary ✅
- Sprite images ✅

**Potential Additions**:
- Staff performance metrics
- Staff training/leveling
- Staff satisfaction

---

## Priority Recommendations

### High Priority (Would Significantly Improve Event Design)

1. **Event Weighting/Probability** ⭐⭐⭐
   - Enables rarity system
   - Better pacing control
   - Easy to implement

2. **One-Time Events** ⭐⭐⭐
   - Essential for story events
   - Prevents repetition
   - Simple flag

3. **Event Cooldown** ⭐⭐
   - Prevents spam
   - Better pacing
   - Medium complexity

### Medium Priority (Nice to Have)

4. **Event Chains** ⭐⭐
   - Enables narratives
   - More complex to implement
   - Can work around with flags

5. **Event Categories** ⭐
   - Better organization
   - UI improvements
   - Low complexity

### Low Priority (Advanced Features)

6. **Conditional Event Content** ⭐
   - Dynamic storytelling
   - Complex to implement
   - Can work around with multiple events

7. **Event Timing Control** ⭐
   - More control
   - Low impact
   - Can work around with trigger points

---

## Summary: What You Actually Need

### For Most Business Simulation Games:

**✅ You're Good!** The current system covers:
- Event requirements (upgrade levels, cash, flags, staff)
- Multiple choices with consequences
- Delayed consequences
- Dynamic effects
- Flag setting

### For Advanced Game Design:

**Consider Adding**:
1. Event weighting (probability system)
2. One-time events (story events)
3. Event cooldown (prevent spam)

**Can Work Around**:
- Event chains (use flags)
- Conditional content (create multiple events)
- Timing control (use trigger points)

---

## Answer to Your Question

> "Can we make marketing require upgrade level?"

**YES! ✅** Marketing campaigns already support the full requirement system. Just go to the Marketing tab, select a campaign, and add requirements in the Requirements section - you can require upgrade levels, cash, flags, staff, etc.

**Example**: "Premium Ad Campaign" requires:
- Upgrade: "Marketing Training" level 3+
- Metric: Cash >= 5000

This is already fully supported! 🎉

