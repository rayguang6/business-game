# Migration 014: Create Level Rewards Table

## Instructions

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `sql/migrations/014_create_level_rewards.sql`
4. Run the migration
5. Verify the table was created:
   ```sql
   SELECT * FROM level_rewards LIMIT 1;
   ```

## After Migration

Once the migration is complete, you can insert level rewards data:

1. Run `sql/insert_freelance_level_rewards.sql` to populate level rewards for the 'freelance' industry
2. Verify the data:
   ```sql
   SELECT level, title, narrative, effects, unlocks_flags 
   FROM level_rewards 
   WHERE industry_id = 'freelance' 
   ORDER BY level;
   ```

## Verification

Check that the table structure is correct:
```sql
\d level_rewards
```

Expected columns:
- `id` (TEXT, PRIMARY KEY)
- `industry_id` (TEXT, NOT NULL)
- `level` (INTEGER, NOT NULL)
- `title` (TEXT, NOT NULL)
- `narrative` (TEXT)
- `effects` (JSONB, NOT NULL, DEFAULT '[]')
- `unlocks_flags` (JSONB, DEFAULT '[]')
- `created_at` (TIMESTAMPTZ, NOT NULL)
- `updated_at` (TIMESTAMPTZ, NOT NULL)

Expected indexes:
- `idx_level_rewards_industry_level` (UNIQUE on industry_id, level)
- `idx_level_rewards_industry` (on industry_id)
- `idx_level_rewards_level` (on level)



