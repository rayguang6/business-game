# Game Design Document
## Business Empire

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** In Development

---

## 1. Game Concept

### 1.1 Elevator Pitch

**Business Empire** is a real-time business simulation game where players build and manage a service-based business from the ground up. The goal is to achieve "financial freedom" by reducing founder workload to part-time hours while maintaining consistent profitability. Players must balance growth, expenses, customer satisfaction, and strategic decision-making to succeed.

### 1.2 Core Fantasy

Players experience the journey of a business founder who:
- Starts with limited capital and high personal workload
- Makes strategic investments in upgrades, staff, and marketing
- Handles unexpected events and challenges
- Gradually automates operations to reduce personal involvement
- Achieves the dream of passive income and work-life balance

### 1.3 Target Audience

- **Primary:** Casual to mid-core players (25-45 years old)
- **Secondary:** Business/entrepreneurship enthusiasts
- **Platform:** Web browser (desktop and mobile)
- **Play Style:** Idle/management hybrid (active decision-making with passive simulation)

### 1.4 Unique Selling Points

1. **Dual Win Condition:** Must achieve both financial success AND reduced workload (not just profit)
2. **Real-Time Customer Flow:** Visual representation of customers moving through the business
3. **Strategic Depth:** Multiple interconnected systems (upgrades, staff, marketing, events)
4. **Multi-Industry Support:** Extensible to different service industries (dental, spa, consulting, etc.)
5. **Meaningful Choices:** Events and decisions have lasting consequences

---

## 2. Core Gameplay

### 2.1 Primary Gameplay Loop

```
START → Select Industry → Start Business
  ↓
Customers Arrive → Serve Customers → Earn Revenue
  ↓
Purchase Upgrades / Hire Staff / Launch Marketing
  ↓
Handle Events → Make Strategic Choices
  ↓
End of Month → Pay Expenses → Check Win/Lose Conditions
  ↓
[WIN] Financial Freedom Achieved OR [LOSE] Business Failed
```

### 2.2 Core Mechanics

#### **Time System**
- **Game Speed:** 1 month = 60 seconds of real time (configurable)
- **Tick Rate:** 10 ticks per second (100ms per tick)
- **Time Scale:** Fast-paced but not overwhelming

#### **Customer System**
- Customers spawn at regular intervals (configurable spawn rate)
- Each customer selects a service (weighted random selection)
- Customers move through stages:
  1. **Arrival** - Spawns at entry point
  2. **Waiting** - Sits in waiting area (patience timer counts down)
  3. **Service** - Assigned to treatment room, service completes over time
  4. **Departure** - Leaves happy (revenue + reputation) or angry (reputation loss)

**Key Mechanics:**
- **Patience System:** Customers have limited patience while waiting
- **Service Capacity:** Limited number of treatment rooms (expandable via upgrades)
- **Service Speed:** Upgrades and staff can speed up service completion
- **Customer Satisfaction:** Happy customers boost reputation; angry customers damage it

#### **Economy System**

**Revenue Sources:**
- Customer service payments (primary)
- Event payouts (occasional)
- Service pricing tiers (low/mid/high) with different multipliers

**Expense Categories:**
- **Base Operations:** Fixed monthly costs (rent, utilities, etc.)
- **Upgrade Costs:** One-time purchase costs + ongoing monthly expenses
- **Staff Salaries:** Monthly salary for each hired staff member
- **Marketing Campaigns:** One-time costs for temporary boosts
- **Event Costs:** Costs associated with event choices

**Profit Calculation:**
- Monthly Profit = Revenue - Expenses - One-Time Costs
- Tracked per month for win condition

#### **Upgrade System**

**Upgrade Types:**
- **Capacity:** More treatment rooms, faster service
- **Efficiency:** Reduced founder hours, faster customer processing
- **Revenue:** Higher service prices, better customer selection
- **Reputation:** Increased reputation gains, customer satisfaction

**Upgrade Mechanics:**
- Upgrades have multiple levels (max level configurable)
- Each level multiplies the effect
- Upgrades can have requirements (flags/conditions) to unlock
- Some upgrades increase monthly expenses

#### **Staff System**

**Staff Roles:**
- Each industry has predefined staff roles
- Staff provide permanent effects (similar to upgrades)
- Staff have monthly salary costs
- Staff can unlock new capabilities (flags)

**Hiring Mechanics:**
- Staff may have requirements to unlock
- Hiring is permanent (no firing mechanic currently)
- Staff effects stack with upgrades

#### **Marketing System**

**Campaign Types:**
- **Customer Acquisition:** Increase spawn rate temporarily
- **Reputation Boost:** Increase reputation gains temporarily
- **Revenue Boost:** Increase service revenue temporarily
- **Efficiency Boost:** Speed up service completion temporarily

**Campaign Mechanics:**
- One-time cost to launch
- Temporary effects (duration in seconds)
- Cooldown period before reuse
- May have requirements to unlock

#### **Event System**

**Event Types:**
- **Opportunities:** Positive events with beneficial choices
- **Challenges:** Negative events requiring difficult decisions

**Event Mechanics:**
- Events trigger at specific times during the month
- Multiple choice options with different outcomes
- Two-phase system:
  1. **Resolve:** Player sees calculated outcomes before committing
  2. **Apply:** Effects apply when player confirms
- Events can set flags, modify cash/reputation, or apply temporary effects
- Events filtered by requirements (only eligible events trigger)

---

## 3. Win & Lose Conditions

### 3.1 Win Condition: Financial Freedom

**Requirements (both must be met):**
1. **Part-Time Hours:** Founder working hours ≤ 40 hours/month
2. **Consistent Profit:** Achieve $5,000+ profit for 2 consecutive months

**Design Intent:**
- Win condition represents achieving "passive income" - the business runs profitably without requiring full-time founder involvement
- The dual requirement prevents "brute force" strategies (high profit but high hours) or "minimalist" strategies (low hours but unprofitable)

**Default Values:**
- Founder Hours Max: 40 hours (1 week/month = part-time)
- Monthly Profit Target: $5,000
- Consecutive Months Required: 2

### 3.2 Lose Conditions

**Game Over Triggers (any one causes failure):**
1. **Bankruptcy:** Cash ≤ $0
2. **Reputation Ruined:** Reputation ≤ 0
3. **Founder Burnout:** Founder working hours > 400 hours/month

**Design Intent:**
- Multiple failure modes create tension and strategic depth
- Players must balance financial health, customer satisfaction, and personal well-being
- Burnout condition prevents "grind" strategies

**Default Values:**
- Cash Threshold: $0
- Reputation Threshold: 0
- Founder Hours Max: 400 hours (burnout = ~13 hours/day)

---

## 4. Progression & Balance

### 4.1 Starting State

**Default Starting Metrics:**
- **Cash:** $15,000
- **Monthly Expenses:** $5,000
- **Reputation:** 10
- **Founder Hours:** 360 hours/month (12 hours/day)

**Design Intent:**
- Starting state represents a "bootstrapped" business
- Limited capital requires careful spending
- High founder hours create urgency to automate
- Low reputation requires building customer trust

### 4.2 Progression Curve

**Early Game (Months 1-2):**
- Focus: Survive, build basic infrastructure
- Key Actions: Purchase first upgrades, handle initial events
- Challenge: Cash flow management, basic customer service

**Mid Game (Months 3-5):**
- Focus: Scale operations, reduce founder hours
- Key Actions: Hire staff, purchase efficiency upgrades, strategic marketing
- Challenge: Balancing growth costs with revenue, managing reputation

**Late Game (Months 6+):**
- Focus: Optimize for win condition
- Key Actions: Fine-tune operations, maintain profitability, reduce hours to ≤40
- Challenge: Achieving consistent profit while minimizing founder involvement

### 4.3 Balance Pillars

**Revenue vs. Expenses:**
- Upgrades and staff increase both revenue potential AND expenses
- Players must calculate ROI before purchasing
- Marketing campaigns provide temporary boosts but cost cash

**Speed vs. Quality:**
- Faster service = more customers = more revenue
- But rushing can lead to reputation loss (angry customers)
- Balance service speed with capacity

**Automation vs. Control:**
- Reducing founder hours requires investments (upgrades/staff)
- But investments cost money and increase expenses
- Players must find the optimal automation level

**Short-Term vs. Long-Term:**
- Events offer immediate benefits but may have long-term costs
- Marketing campaigns provide temporary boosts
- Upgrades provide permanent benefits but require upfront investment

---

## 5. Content Systems

### 5.1 Industries

**Current Implementation:**
- **Dental Clinic** (default, fully implemented)

**Planned Extensibility:**
- System designed to support multiple industries
- Each industry has:
  - Unique services (with pricing tiers)
  - Industry-specific upgrades
  - Industry-specific events
  - Industry-specific staff roles
  - Custom layout and visuals

**Industry Design Principles:**
- Each industry should feel distinct
- Services should reflect real-world industry practices
- Upgrades should make thematic sense
- Events should be industry-appropriate

### 5.2 Services

**Service Properties:**
- **Name:** Service description
- **Price:** Base price (used in revenue calculation)
- **Duration:** Service completion time (in seconds)
- **Pricing Tier:** Low / Mid / High (affects revenue multiplier)
- **Weightage:** Selection probability (higher = more likely)
- **Requirements:** Unlock conditions (flags/conditions)

**Service Selection:**
- Weighted random selection from available services
- Services filtered by requirements (unmet requirements = unavailable)
- Tier multipliers affect revenue (high tier = higher multiplier)

### 5.3 Upgrades

**Upgrade Categories:**
- **Capacity:** Treatment rooms, waiting area expansion
- **Efficiency:** Service speed, founder hours reduction
- **Revenue:** Service pricing, customer selection
- **Reputation:** Customer satisfaction, reputation gains
- **Automation:** Staff capabilities, operational efficiency

**Upgrade Effects:**
- **Add:** Flat addition (e.g., +1 treatment room)
- **Percent:** Percentage increase (e.g., +20% service speed)
- **Multiply:** Multiplier (e.g., ×1.5 revenue)
- **Set:** Override value (e.g., set founder hours to 40)

**Upgrade Requirements:**
- Flags: Must have specific flag set (e.g., "staff_trained")
- Conditions: Must meet condition (e.g., cash >= 10000, reputation >= 50)
- All requirements must be met (AND logic)

### 5.4 Events

**Event Structure:**
- **Title:** Event name
- **Summary:** Brief description
- **Category:** Opportunity (positive) or Challenge (negative)
- **Requirements:** When event can trigger
- **Choices:** Multiple options with different outcomes

**Choice Outcomes:**
- **Cost:** Immediate cash cost
- **Effects:** Cash, reputation, or metric modifications
- **Consequences:** Weighted random outcomes (some choices have multiple possible results)
- **Flags:** Can set flags for future unlocks

**Event Timing:**
- Events trigger at specific times during the month (e.g., 15s, 30s, 45s)
- Only one event active at a time
- Events filtered by requirements (only eligible events can trigger)

### 5.5 Staff

**Staff Properties:**
- **Name:** Staff member name
- **Role:** Job title/description
- **Salary:** Monthly cost
- **Effects:** Array of metric effects (same system as upgrades)
- **Requirements:** Unlock conditions
- **Flags:** Can set flags when hired

**Staff Design:**
- Each industry has predefined staff roles
- Staff provide permanent effects (no duration)
- Staff effects stack with upgrades
- Hiring is permanent (no firing mechanic)

### 5.6 Marketing Campaigns

**Campaign Types:**
- **Customer Acquisition:** Increase spawn rate
- **Reputation Boost:** Increase reputation gains
- **Revenue Boost:** Increase service revenue
- **Efficiency Boost:** Speed up service completion

**Campaign Mechanics:**
- **Cost:** One-time cash cost
- **Effects:** Temporary metric modifications (duration in seconds)
- **Cooldown:** Time before campaign can be reused
- **Requirements:** Unlock conditions

---

## 6. Player Experience

### 6.1 Onboarding Flow

1. **Welcome Screen:** Title, "Start Game" button
2. **Industry Selection:** Choose industry (currently only Dental)
3. **Game Start:** Initial state loaded, "Start Game" button
4. **First Customers:** Customers begin spawning
5. **First Event:** Event triggers, player learns event system
6. **First Upgrade:** Player purchases first upgrade
7. **Tutorial Hints:** (Not yet implemented - future feature)

### 6.2 Core Interactions

**During Gameplay:**
- **Watch:** Observe customers moving through business
- **Purchase:** Click upgrades/staff to purchase
- **Launch:** Click marketing campaigns to activate
- **Choose:** Select event options when events trigger
- **Monitor:** View finance tab for monthly breakdown

**UI Tabs:**
- **Home:** Overview, monthly history, current metrics
- **Finance:** Revenue/expense breakdown, profit/loss, monthly history
- **Upgrades:** Purchase upgrades (filtered by requirements/affordability)
- **Staff:** Hire staff roles (filtered by requirements/affordability)
- **Marketing:** Launch campaigns (cooldown tracking, cost)

### 6.3 Feedback Systems

**Visual Feedback:**
- Customer sprites moving through stages
- Revenue numbers appearing when customers complete service
- Reputation changes when customers leave (happy/angry)
- Monthly summary popup at month end

**Audio Feedback:**
- Background music (game music, welcome music)
- Sound effects (service completion, button clicks)
- (Limited implementation - can be expanded)

**Numerical Feedback:**
- Real-time cash/reputation display
- Monthly profit/loss tracking
- Founder hours tracking
- Revenue/expense breakdowns

### 6.4 Pacing

**Time Pressure:**
- Customers have limited patience (creates urgency)
- Monthly expenses must be paid (creates financial pressure)
- Founder hours must be reduced (creates long-term goal)

**Decision Points:**
- Upgrade purchases (strategic investment)
- Staff hiring (permanent commitment)
- Marketing campaigns (temporary boost vs. cost)
- Event choices (risk/reward decisions)

**Rest Periods:**
- Events pause the game (allows thoughtful decisions)
- Month transitions provide natural break points
- No time pressure during event resolution

---

## 7. Systems Design

### 7.1 Requirements & Unlocks

**Flag System:**
- Simple boolean state tracking
- Set by: Upgrades, events, marketing campaigns, staff hiring
- Used by: Requirements on upgrades/events/services/marketing/staff
- Design Intent: Create progression gates and unlock chains

**Condition System:**
- Dynamic evaluation (not stored as booleans)
- Examples: `cash >= 10000`, `reputation >= 50`, `month >= 3`
- Used by: Requirements on upgrades/events/services/marketing/staff
- Design Intent: Create dynamic unlock conditions based on game state

**Requirement Logic:**
- All requirements must be met (AND logic)
- Supports both flags and conditions
- Clean IDs (no prefix handling)

### 7.2 Effect System

**Centralized Effect Manager:**
- All stat modifications go through single system
- Supports: Upgrades, Marketing, Staff, Events
- Effect Types: Add, Percent, Multiply, Set
- Effect Order: Add → Percent → Multiply → Set

**Effect Duration:**
- **Permanent:** Upgrades, Staff (no duration)
- **Temporary:** Marketing campaigns, Event effects (duration in seconds)
- **Expiration:** Temporary effects automatically expire

**Effect Calculation:**
- Formula: `(base + adds) × (1 + percents/100) × multiplies, then Set overrides`
- Constraints: Some metrics have min/max values (e.g., ServiceRooms ≥ 1)

### 7.3 Pathfinding & Movement

**Customer Movement:**
- A* pathfinding algorithm
- Horizontal/vertical movement only (no diagonals)
- Dynamic walls (occupied waiting positions become temporary obstacles)
- Configurable movement speed (tiles per tick)

**Layout System:**
- Grid-based layout (10×10 default)
- Entry position (customer spawn point)
- Waiting positions (chairs for customers)
- Service room positions (treatment rooms)
- Staff positions (where staff stand)
- Walls (obstacles for pathfinding)

---

## 8. Art & Audio Direction

### 8.1 Visual Style

**Current Implementation:**
- 2D sprite-based characters
- Grid-based layout
- Simple, clean UI
- Industry-specific backgrounds

**Art Assets:**
- Customer sprites (multiple variations)
- Staff sprites (role-based)
- Map backgrounds (industry-specific)
- UI elements (buttons, cards, popups)

### 8.2 Audio Design

**Current Implementation:**
- Background music (game music, welcome music, selection music)
- Sound effects (button clicks, service completion)
- Audio controls (volume, mute)

**Future Expansion:**
- More sound effects (customer arrival, reputation changes)
- Dynamic music (intensity based on game state)
- Voice-over for events (optional)

---

## 9. Technical Architecture (High-Level)

### 9.1 Platform

- **Framework:** Next.js 15 + React 19
- **State Management:** Zustand (slice pattern)
- **Backend:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

### 9.2 Data Architecture

**Two-Store Pattern:**
- **Config Store:** Read-only game content (services, upgrades, events, staff, marketing)
- **Game Store:** Mutable runtime state (cash, customers, metrics, flags)

**Data Flow:**
1. Content loaded from Supabase on game start
2. Stored in config store (immutable)
3. Game store reads from config store
4. Game state updated during gameplay
5. No mutation of config during gameplay

### 9.3 Content Management

**Admin UI:**
- Edit services, upgrades, events, staff, marketing campaigns
- Edit global simulation settings
- Edit industry-specific configs
- Manage flags and conditions

**Content Storage:**
- All content stored in Supabase
- Editable via admin UI
- Changes require game reload to take effect

---

## 10. Future Features & Roadmap

### 10.1 Planned Features

**Short-Term:**
- [ ] Save/Load system (persist game state)
- [ ] Tutorial/onboarding system
- [ ] More sound effects and music
- [ ] Additional industries (beyond dental)
- [ ] Balance tuning based on playtesting

**Medium-Term:**
- [ ] Staff movement/animation
- [ ] More customer sprite variety
- [ ] Analytics dashboard (graphs, trends)
- [ ] Achievement system
- [ ] Multiple save slots

**Long-Term:**
- [ ] Multiplayer/leaderboards (optional)
- [ ] Seasonal events
- [ ] Expansion packs (new industries)
- [ ] Mobile app version

### 10.2 Design Questions to Resolve

1. **Month Duration:** Is 60 seconds = 1 month the right pace? Should it be configurable?
2. **Win Condition Balance:** Is $5k profit for 2 months achievable? Should it scale?
3. **Founder Hours Reduction:** Is the curve from 360 → 40 hours balanced?
4. **Customer Patience:** Is 10 seconds enough? Should it scale with service duration?
5. **Event Frequency:** 3 events/month - is this optimal?
6. **Marketing Cooldowns:** Should cooldowns be in game time or real time?
7. **Service Pricing:** How should service prices relate to revenue calculation?
8. **Staff Firing:** Should players be able to fire staff? Should there be contracts?

---

## 11. Success Metrics

### 11.1 Player Engagement

- **Session Length:** Target 15-30 minutes per session
- **Retention:** Target 40% Day-1 retention, 20% Day-7 retention
- **Completion Rate:** Target 30% of players achieve win condition

### 11.2 Balance Metrics

- **Average Win Time:** Target 20-40 minutes (4-8 months in-game)
- **Upgrade Purchase Rate:** Track which upgrades are purchased most
- **Event Choice Distribution:** Track which event choices players prefer
- **Failure Reasons:** Track which lose condition triggers most often

### 11.3 Content Metrics

- **Service Usage:** Track which services are selected most
- **Staff Hiring:** Track which staff roles are hired most
- **Marketing Usage:** Track which campaigns are used most
- **Event Engagement:** Track event completion rate

---

## 12. Design Principles

### 12.1 Core Principles

1. **Meaningful Choices:** Every decision should have consequences
2. **Transparency:** Players should understand how systems work
3. **Fairness:** Win/lose conditions should be achievable and fair
4. **Depth:** Multiple viable strategies should exist
5. **Pacing:** Game should feel engaging but not overwhelming

### 12.2 Design Constraints

1. **No Pay-to-Win:** All content accessible through gameplay
2. **No Grinding:** Progression should feel natural, not repetitive
3. **No Surprises:** Players should see outcomes before committing (two-phase event system)
4. **No Dead Ends:** All paths should lead to either win or lose (no soft locks)

### 12.3 Player Agency

- Players control: Upgrade purchases, staff hiring, marketing launches, event choices
- Players influence: Customer satisfaction (via upgrades), revenue (via investments)
- Players cannot control: Customer spawn rate (except via upgrades/marketing), random event outcomes

---

## Appendix A: Default Values Reference

### Starting State
- Cash: $15,000
- Monthly Expenses: $5,000
- Reputation: 10
- Founder Hours: 360 hours/month

### Win Condition
- Founder Hours Max: 40 hours/month
- Monthly Profit Target: $5,000
- Consecutive Months Required: 2

### Lose Conditions
- Cash Threshold: $0
- Reputation Threshold: 0
- Founder Hours Max: 400 hours/month

### Time System
- Ticks Per Second: 10
- Month Duration: 60 seconds
- Customer Spawn Interval: 3 seconds (base)
- Customer Patience: 10 seconds (base)

### Business Stats
- Treatment Rooms: 2 (base)
- Reputation Gain Per Happy Customer: 1
- Reputation Loss Per Angry Customer: 1
- Service Revenue Multiplier: 1 (base)
- Service Revenue Scale: 10

---

## Appendix B: Glossary

- **Tick:** One game loop iteration (100ms default)
- **Game Time:** Elapsed time in seconds (increments every N ticks)
- **Month:** One business month (60 seconds default)
- **Service:** A customer service offering (e.g., "Teeth Cleaning")
- **Upgrade:** A permanent improvement to the business
- **Staff:** A hired employee with permanent effects
- **Marketing Campaign:** A temporary boost with duration and cooldown
- **Event:** A narrative choice point with consequences
- **Flag:** A boolean state tracker (unlock condition)
- **Condition:** A dynamic evaluation (e.g., "cash >= 10000")
- **Requirement:** A flag or condition that must be met to unlock content
- **Effect:** A modification to a game metric (Add, Percent, Multiply, Set)
- **Founder Hours:** The monthly hours the founder must work (win condition target: ≤40)

---

**Document Status:** Living document - updated as game evolves  
**Next Review:** After playtesting and balance tuning

