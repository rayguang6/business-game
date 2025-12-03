## Default Industry Config Reference (Non-runtime)

This file preserves the old hardcoded defaults that used to live in `lib/game/industryConfigs.ts`.
They are **not** used at runtime anymore and are only here as a reference when seeding or tuning data.

If you need concrete example values for business metrics, stats, movement, map, or layout, refer to:
- `sql/freelance_complete.sql` for a full working example
- `DATABASE_SETUP_GUIDE.md` for required/optional fields

The engine now **always** reads configuration from the database:
- Global defaults from `global_simulation_config`
- Per-industry overrides from `industry_simulation_config`
- Runtime access through `lib/game/config.ts`

For any new industries, create proper rows in the database instead of relying on hardcoded TS defaults.


