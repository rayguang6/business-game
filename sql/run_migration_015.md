# Migration 015: Create Marketing Campaigns for Freelance Industry

## Overview
This migration adds comprehensive marketing campaigns for the freelance industry, implementing the marketing system described in the business game requirements.

## Changes Made

### New Marketing Campaigns Added
1. **Outreach** - Unlimited campaign for instant leads
2. **Social Posting** - Leveled campaign (5 levels) for monthly leads
3. **Before/After Case Study** - Leveled campaign (5 levels) for monthly leads
4. **Templates / Assets** - Leveled campaign (5 levels) for monthly leads
5. **Professional Portfolio Redesign** - Leveled campaign (5 levels) with permanent lead boost + conversion rate
6. **Studio Rebranding Video** - Leveled campaign (5 levels) with permanent lead boost + service bonus price
7. **Press Release & Featured by Media** - Leveled campaign (5 levels) with permanent lead boost + conversion rate
8. **Digital Paid Ad Campaign** - Leveled campaign (5 levels) for immediate leads

### Campaign Types
- **Unlimited Campaigns**: One-time use campaigns with instant or monthly effects
- **Leveled Campaigns**: Multi-level campaigns that can be upgraded 5 times each

### Effects Implemented
- **Instant Leads**: Immediate lead generation (`leads` metric)
- **Monthly Leads**: Ongoing lead generation (`leadsPerMonth` metric)
- **Lead Conversion Rate**: Percentage boost to conversion (`leadConversionRate` metric)
- **Service Bonus Price**: Cash bonus to services (`serviceBonusPrice` metric)

## Database Changes

### Tables Modified
- `marketing_campaigns`: Added 8 new campaigns for freelance industry
- `marketing_campaign_levels`: Added 35 campaign levels (5 levels × 7 leveled campaigns)

### Data Validation
All campaigns include:
- Proper cooldown times (converted from hours to seconds)
- Time costs for each level (10s or 20s per click as specified)
- Correct effect types and durations
- Industry-specific ordering

## Migration Steps

1. **Backup Database** (Recommended)
   ```bash
   # Create a backup before running migration
   pg_dump -h your-host -U your-user -d your-database > backup_before_015.sql
   ```

2. **Run Migration**
   ```bash
   psql -h your-host -U your-user -d your-database -f sql/migrations/015_create_marketing_campaigns.sql
   ```

3. **Verify Migration**
   ```sql
   -- Check campaigns were created
   SELECT industry_id, id, name, campaign_type, cost, time_cost, cooldown_seconds
   FROM marketing_campaigns
   WHERE industry_id = 'freelance'
   ORDER BY "order", name;

   -- Check levels were created
   SELECT campaign_id, level, cost, time_cost, effects
   FROM marketing_campaign_levels
   WHERE industry_id = 'freelance'
   ORDER BY campaign_id, level;
   ```

## Rollback Instructions

If you need to rollback this migration:

```sql
-- Delete campaign levels first (due to foreign key constraints)
DELETE FROM marketing_campaign_levels
WHERE industry_id = 'freelance';

-- Delete campaigns
DELETE FROM marketing_campaigns
WHERE industry_id = 'freelance';
```

## Testing

After migration, test the marketing campaigns in the game:
1. Navigate to the Marketing tab in the freelance industry
2. Verify all 8 campaigns appear with correct names and descriptions
3. Test launching campaigns to ensure effects apply correctly
4. Verify cooldowns and time costs work as expected

## Notes
- All monetary values are in whole dollars (no cents)
- Time costs are in seconds (10s or 20s per click as specified)
- Cooldown times converted from hours to seconds
- Effects use null durationMonths for permanent effects, 1 for monthly effects, null for instant effects




