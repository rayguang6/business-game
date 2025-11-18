# Quick Start Guide for Content Planning

## Step 1: Open in Google Sheets

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. For each CSV file:
   - File → Import → Upload
   - Select the CSV file
   - Choose "Replace spreadsheet"
   - Click "Import data"

## Step 2: Plan Your Industry

### Industry Config (Sheet 1)
Fill in ONE row with your industry details:
- **Industry ID**: Use lowercase, no spaces (e.g., `coffee-shop`)
- **Starting Cash**: How much money to start with
- **Starting Time**: Monthly time budget (use `0` if no time currency)
- **Monthly Expenses**: Base costs per month

### Services (Sheet 2)
Add 5-7 services customers can buy:
- **Price**: What customer pays
- **Duration**: How long it takes (hours)
- **Weightage**: Higher = more common (total should be ~100)
- **Pricing Category**: `low`, `mid`, or `high`

### Upgrades (Sheet 3)
Add 3-5 things players can unlock:
- **Cash Cost**: Money needed (use `0` if time-only)
- **Time Cost**: Time needed (use `0` if cash-only)
- **Effects**: What it changes (see examples)
- **Sets Flag**: Flag name to unlock (optional)

### Marketing (Sheet 4)
Add 2-4 marketing actions:
- **Cooldown**: Seconds before can use again
- **Effects**: Temporary boosts (include `durationSeconds`)

### Events (Sheet 5)
Add 3-5 random events:
- **Category**: `opportunity` (good) or `risk` (challenge)
- **Choices**: Multiple options per event
- **Consequences**: Multiple outcomes per choice
- **Weight**: Probability % (must total 100 per choice)

### Staff (Sheet 6)
Add 1-3 hireable roles:
- **Salary**: Monthly cost
- **Effects**: What they do (usually speed boost + workload reduction)

### Flags (Sheet 7)
List all flags you'll use:
- Used in requirements to unlock content
- Set by upgrades/staff/events

## Step 3: Use Examples

Each CSV file includes example rows from `dental` and `freelance` industries. Use these as templates!

## Step 4: Share with Developers

Once filled out, share the Google Sheet with developers who will convert it to SQL.

---

## Common Patterns

### Learning Upgrade (Time-Only)
```
Name: Learn New Skill
Cash Cost: 0
Time Cost: 20-40 hours
Effect: reputationMultiplier boost
Sets Flag: learned-skill
```

### Equipment Upgrade (Cash-Only)
```
Name: Better Equipment
Cash Cost: 3000-5000
Time Cost: 0
Effect: serviceSpeedMultiplier boost + monthlyExpenses increase
```

### Marketing Campaign (Time-Only)
```
Name: Networking Event
Cash Cost: 0
Time Cost: 8 hours
Cooldown: 900 seconds (15 minutes)
Effect: Temporary reputationMultiplier boost
```

### Event Structure
```
Event: Big Opportunity
Category: opportunity
Choice 1: Accept (cost: 0)
  → Success (70%): +cash, +reputation
  → Struggle (30%): +cash (less), -reputation
Choice 2: Decline (cost: 0)
  → Safe (100%): No change
```

---

## Need Help?

Check `README.md` for detailed column descriptions and JSON format examples!

