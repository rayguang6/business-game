# How to Use the New Requirement System

## Overview

The requirement system allows you to set prerequisites for:
- **Services** - What's needed to unlock a service
- **Upgrades** - What's needed to purchase an upgrade
- **Marketing Campaigns** - What's needed to run a campaign
- **Events** - What's needed to trigger an event
- **Staff Roles** - What's needed to hire staff

## Requirement Types

### 1. **Flag Requirements** (`flag`)
Boolean state checks - has a flag been set?

**Example:** Unlock a service only if the player has completed their portfolio
```json
{
  "type": "flag",
  "id": "has_portfolio",
  "expected": true
}
```

**In Admin UI:**
- Select a flag from the Flags section
- Toggle "NOT" if you want the flag to be false (expected: false)

---

### 2. **Metric Requirements** (`metric`)
Direct checks against game metrics (cash, exp, level, etc.)

**Example:** Require at least $1000 cash
```json
{
  "type": "metric",
  "id": "cash",
  "operator": ">=",
  "value": 1000
}
```

**Available Metrics:**
- `cash` - Current cash amount
- `exp` - Experience points
- `level` - Player level (calculated from exp)
- `expenses` - Total monthly expenses
- `gameTime` - Game time elapsed
- `freedomScore` - Freedom score

**Operators:**
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `>` - Greater than
- `<` - Less than
- `==` - Equal to

**In Admin UI:**
- Select a metric from the Metrics section
- Set operator (>=, <=, >, <, ==)
- Enter the value

---

### 3. **Upgrade Requirements** (`upgrade`)
Check if another upgrade has reached a certain level

**Example:** Require "Better Computer" upgrade to be at least level 5
```json
{
  "type": "upgrade",
  "id": "better_computer",
  "operator": ">=",
  "value": 5
}
```

**This is what you asked about!** To make Upgrade B require Upgrade A to be level 5:

1. Go to **Upgrades** tab in admin panel
2. Select the upgrade you want to add requirements to (Upgrade B)
3. Scroll to the **Requirements** section
4. Search for "better_computer" (or the ID of Upgrade A)
5. Click on it to add the requirement
6. Set operator to `>=` and value to `5`
7. Save the upgrade

**In Admin UI:**
- Select an upgrade from the Upgrades section
- Set operator (>=, <=, >, <, ==)
- Enter the required level

---

### 4. **Staff Requirements** (`staff`)
Check if you have hired a certain number of staff

**Example:** Require at least 2 developers
```json
{
  "type": "staff",
  "id": "developer",
  "operator": ">=",
  "value": 2
}
```

**Example:** Require at least 5 total staff (any role)
```json
{
  "type": "staff",
  "id": "*",
  "operator": ">=",
  "value": 5
}
```

**In Admin UI:**
- Select a staff role from the Staff section
- Or select "*" for total staff count
- Set operator and value

---

## Real-World Examples

### Example 1: Upgrade Chain
**Scenario:** "Advanced Computer" upgrade requires "Better Computer" to be level 5

1. Create "Better Computer" upgrade (ID: `better_computer`)
2. Create "Advanced Computer" upgrade (ID: `advanced_computer`)
3. In "Advanced Computer", add requirement:
   ```json
   {
     "type": "upgrade",
     "id": "better_computer",
     "operator": ">=",
     "value": 5
   }
   ```

### Example 2: Service Unlock
**Scenario:** "E-commerce Website" service requires:
- Portfolio flag to be set
- At least $2000 cash
- "Better Computer" upgrade level 3+

Add multiple requirements (all must be met):
```json
[
  {
    "type": "flag",
    "id": "has_portfolio",
    "expected": true
  },
  {
    "type": "metric",
    "id": "cash",
    "operator": ">=",
    "value": 2000
  },
  {
    "type": "upgrade",
    "id": "better_computer",
    "operator": ">=",
    "value": 3
  }
]
```

### Example 3: Staff Hiring
**Scenario:** Can only hire "Senior Developer" if:
- You have at least 2 "Developer" staff
- You have at least $5000 cash

```json
[
  {
    "type": "staff",
    "id": "developer",
    "operator": ">=",
    "value": 2
  },
  {
    "type": "metric",
    "id": "cash",
    "operator": ">=",
    "value": 5000
  }
]
```

### Example 4: Marketing Campaign
**Scenario:** "Premium Ad Campaign" requires:
- Level 5 or higher
- "Marketing Training" upgrade level 2+

```json
[
  {
    "type": "metric",
    "id": "level",
    "operator": ">=",
    "value": 5
  },
  {
    "type": "upgrade",
    "id": "marketing_training",
    "operator": ">=",
    "value": 2
  }
]
```

---

## How Requirements Work

### Logic: AND (All Must Be Met)
All requirements in the array must be satisfied. If you have 3 requirements, all 3 must pass.

### Evaluation
Requirements are checked in real-time during gameplay:
- When trying to purchase an upgrade
- When trying to start a service
- When trying to run a marketing campaign
- When trying to hire staff
- When events are triggered

### Display
If requirements aren't met, the UI will show:
- Which requirements are missing
- Current vs required values
- Example: "Better Computer Level >= 5 (Current: 2)"

---

## Step-by-Step: Setting Upgrade Requirements

**Your specific example:** Upgrade B requires Upgrade A to be level 5

1. **Go to Admin Panel** → **Upgrades** tab
2. **Select or create Upgrade B** (the one that needs the requirement)
3. **Scroll to "Requirements" section**
4. **In the search box**, type the ID of Upgrade A (e.g., "better_computer")
5. **Click on Upgrade A** in the results - it will be added with default values (>= 1)
6. **Click the requirement** to edit it
7. **Change the value to 5** (or whatever level you need)
8. **Change operator if needed** (>= is usually what you want)
9. **Save the upgrade**

The requirement will now look like:
```
⚙️ Better Computer >= 5
```

---

## Tips

1. **Use upgrade IDs, not names** - The system uses IDs (like `better_computer`), not display names
2. **Check existing upgrades** - Make sure the upgrade you're referencing exists
3. **Test in game** - After setting requirements, test that they work correctly
4. **Multiple requirements** - You can add as many as you need
5. **Operator choice**:
   - `>=` - "At least level X" (most common)
   - `==` - "Exactly level X"
   - `>` - "More than level X"
   - `<=` - "Level X or less" (rare)
   - `<` - "Less than level X" (rare)

---

## Common Patterns

### Upgrade Chains
```
Basic Computer (no requirements)
  ↓
Better Computer (requires Basic Computer >= 3)
  ↓
Advanced Computer (requires Better Computer >= 5)
  ↓
Super Computer (requires Advanced Computer >= 7)
```

### Service Unlocks
```
Basic Service (no requirements)
  ↓
Mid-Tier Service (requires flag + cash)
  ↓
Premium Service (requires upgrade + level)
```

### Staff Progression
```
Junior Staff (no requirements)
  ↓
Senior Staff (requires 2+ junior staff + cash)
  ↓
Manager (requires 3+ senior staff + level)
```

