# SQL Content Files

## `freelance_complete.sql` - Freelance Industry (Full Content)

This single SQL file creates a complete **Freelance** industry with all required data:

✅ Industry definition  
✅ Industry simulation config (startingTime: 160, startingCash: 2000)  
✅ **7 Services** (from quick logos to e-commerce sites)  
✅ **5 Upgrades** (skills + tools progression)  
✅ **4 Marketing campaigns** (social media, portfolio, cold email, content)  
✅ **7 Events** (mix of opportunities and risks - educational!)  
✅ **7 Flags** (track progress)  
✅ **3 Staff roles** (Virtual Assistant, Junior Designer, Junior Developer)

## How to Execute

### Option 1: Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `freelance_complete.sql`
3. Paste and run

### Option 2: Command Line
```bash
psql -d your_database -f sql/freelance_complete.sql
```

## Notes

- Uses `ON CONFLICT` clauses - safe to run multiple times
- **Events are REQUIRED** - the game checks for `hasEvents` and will error without at least 1 event
- Staff is optional - if no staff data exists, the game treats it as "no staff needed"
- All effects use `reputationMultiplier` (not direct reputation changes)
- Marketing campaigns have temporary durations (1 hour = 3600 seconds)

## Game Design Philosophy

This content is designed to teach real freelance lessons:

### **Time Management**
- Time currency forces players to choose: learn skills (long-term) vs take projects (short-term)
- Monthly refresh creates urgency: "use it or lose it"

### **Cash Flow**
- Irregular income from projects
- Monthly expenses create pressure
- Late payment events teach invoicing importance

### **Skill Development**
- Learning skills costs time (investment)
- Skills unlock better-paying projects
- Portfolio upgrade requires both cash and time

### **Client Management**
- Scope creep events teach boundary-setting
- Difficult client events teach when to say no
- Late payment events teach follow-up importance

### **Scaling**
- Staff roles unlock after learning skills (realistic)
- Staff reduce founder workload but cost monthly
- Balance between hiring help vs staying solo

### **Events Teach Lessons**
- **Late Payment**: Always follow up on invoices
- **Scope Creep**: Set boundaries or get taken advantage of
- **Difficult Client**: Sometimes firing a client is best
- **Big Project**: Risk vs reward - learn new skills?
- **Networking**: Time investment can pay off
- **Equipment**: Invest in tools or struggle with old ones

## Verification

After running, check in admin panel:
- Industry appears in Industries Tab
- Config shows `startingTime: 160`
- Services (7), upgrades (5), marketing (4), events (7), staff (3) all appear
- Game should load without "Missing industry data" error
- Try playing a few months to test the progression!

---

## `dental_complete.sql` - Dental Industry (Basic Content)

Simple but complete content for the **Dental** industry:

✅ Industry definition  
✅ Industry simulation config (startingCash: 5000, startingTime: 120, monthlyExpenses: 3000)  
✅ **5 Services** (cleaning, checkup, filling, root canal, crown)  
✅ **4 Upgrades** (extra room, better equipment, learn implants, waiting area)  
✅ **3 Marketing campaigns** (local ad, promotion, networking)  
✅ **3 Events** (emergency patient, equipment breakdown, patient referral)  
✅ **4 Flags** (track upgrades)  
✅ **2 Staff roles** (Dental Assistant, Receptionist)

### Design Philosophy

**Hybrid Cash + Time:**
- **Cash** for: Equipment, rooms, paid advertising
- **Time** for: Continuing education, networking, training
- **Both** for: Some upgrades (waiting area needs both money and time to design)
- Realistic: Dentists manage both financial and time resources

**Services:** Basic dental procedures from routine to complex  
**Upgrades:** Clinic improvements (rooms, equipment, comfort)  
**Events:** Realistic dental clinic scenarios  
**Staff:** Support roles to help run the clinic

### How to Execute

Same as freelance - copy entire file and run in Supabase SQL Editor.

### Verification

After running:
- Industry appears in Industries Tab
- All content loads correctly
- Game should work without errors

