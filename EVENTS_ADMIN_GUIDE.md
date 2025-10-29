# Events Admin Panel Guide

## Overview
The Events section in the Admin Panel allows non-technical partners to create and manage game events with multiple choices and consequences.

## Feature Structure

### 1. Event (Top Level)
- **ID**: Unique identifier (e.g., `dental-inspection`)
- **Title**: Display name (e.g., "Health Inspection")
- **Category**: `opportunity` or `risk`
- **Summary**: Description shown to players
- **Choices**: Array of player choices (see below)

### 2. Choices (Per Event)
Each event can have multiple choices:
- **Choice ID**: Unique identifier (e.g., `prepare-now`)
- **Label**: Button text shown to player (e.g., "Prepare Now")
- **Description** (optional): Tooltip/explanation
- **Cost** (optional): Upfront cash cost before selection
- **Consequences**: Array of possible outcomes (see below)

### 3. Consequences (Per Choice)
Each choice has one or more consequences (randomly selected based on weight):
- **Consequence ID**: Unique identifier (e.g., `success`)
- **Label** (optional): Display name
- **Description** (optional): Details
- **Weight**: Positive integer (higher = more likely to occur)
- **Effects**: Immediate one-time effects
- **Temporary Effects**: Time-limited modifiers

### 4. Effects (Per Consequence)
Immediate, permanent effects:
- **Cash**: Add/subtract money (with optional label like "Renovation Cost")
- **Reputation**: Increase/decrease reputation score

### 5. Temporary Effects (Per Consequence)
Time-limited modifiers using the Effect System:
- **Metric**: What to modify (dropdown)
  - Service Rooms
  - Monthly Expenses
  - Service Speed Multiplier
  - Spawn Interval (seconds)
  - Service Revenue (flat bonus)
  - Service Revenue Multiplier
  - Happy Probability
  - Reputation Multiplier
- **Type**: How to modify (dropdown)
  - Add (flat) - e.g., +1 room or +100 revenue
  - Percent (%) - e.g., +15% speed
  - Multiply (×) - e.g., ×1.5 for 50% boost
  - Set (=) - Force a value, overwrites others
- **Value**: Numeric value for the effect
- **Duration (seconds)**: How long the effect lasts
- **Priority** (optional): Higher priority effects apply first

## Workflow

### Creating a New Event
1. Select an Industry from the Industries section
2. In the Events section, click **"+ New Event"**
3. Fill in Event details (ID, Title, Category, Summary)
4. Click **"+ Add Choice"** to create player options
5. For each choice, fill in details and click **"Save Choice"**
6. For each choice, click **"+ Add Consequence"** to add outcomes
7. Configure consequences with effects and temporary effects
8. Click **"Save Consequence"**
9. Finally, click **"Save Event"** to persist to Supabase

### Editing Existing Events
1. Select the Industry
2. Click on the Event button to load its data
3. Modify Event fields or click on Choices to edit them
4. Click on a Choice, then edit its Consequences
5. Always click **"Save Event"** to persist changes

### Understanding Consequences
- Each choice must have at least one consequence
- When a player selects a choice, ONE consequence is randomly picked based on weights
- Example: 
  - Consequence A (weight: 3) = 75% chance
  - Consequence B (weight: 1) = 25% chance
- Use effects for immediate impact (cash, reputation)
- Use temporary effects for time-limited bonuses/penalties

## Data Flow

```
Event
  └─ Choices[]
       └─ Consequences[]
            ├─ Effects[] (cash, reputation)
            └─ Temporary Effects[] (timed modifiers)
```

## Persistence

- All data is stored in Supabase `events` table
- Choices and Consequences are stored as JSONB in the `data` column
- Changes are saved when you click **"Save Event"**
- Remember: Saving a Choice or Consequence only updates local state - you must **"Save Event"** to persist to database

## Tips

- Use descriptive IDs (kebab-case) for easier debugging
- Set appropriate weights to balance gameplay
- Test temporary effects with short durations first
- Use the "Label" field on cash effects to explain the cost/gain
- Higher priority temporary effects override lower ones

## Troubleshooting

**Q: My choices aren't showing up in the game**  
A: Make sure you clicked **"Save Event"** after adding choices

**Q: Consequences aren't applying**  
A: Check that:
- Consequence has at least one effect or temporary effect
- Weight is a positive integer
- Event is saved to the database

**Q: Temporary effects aren't working**  
A: Verify:
- Metric and Type are selected from dropdowns
- Value and Duration are valid numbers
- Duration is greater than 0

**Q: How do I make an event industry-specific?**  
A: Events are automatically scoped to the selected Industry. Make sure you select the correct industry before creating/editing events.

