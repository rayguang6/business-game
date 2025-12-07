# Development Guide

This guide covers the current state of the project and how to work with it.

## Project Status

### ✅ Completed

1. **Unified Simulation Config Migration**
   - Created unified `simulation_config` table
   - Migrated all data from old tables
   - Updated all code to use unified repository
   - Removed deprecated `industrySimulationConfigRepository.ts`

2. **Code Quality Improvements**
   - Fixed Supabase initialization (lazy loading, no crash on missing env vars)
   - Added validation to admin layout form
   - Normalized repository return contracts (null = error, [] = empty)
   - Implemented React Query caching for metric display configs

3. **Data Validation**
   - Admin form validates layout positions (prevents negative coords, NaN, missing positions)
   - Game loaders validate required data and fail fast with clear errors

### ✅ Recently Completed

1. **Database Migration**
   - ✅ Ran `sql/migrations/009_drop_old_simulation_config_tables.sql` in Supabase
   - ✅ Old `global_simulation_config` and `industry_simulation_config` tables dropped
   - ✅ Migration cleanup complete

### ⚠️ Pending

1. **Layout Data Verification**
   - Run verification SQL to check all industries have layout data
   - Backfill any missing layouts via admin panel

---

## Architecture Overview

### Data Layer

**Repositories** (`lib/data/*.ts`):
- All repositories follow pattern: `null` = query failed, `[]` = valid but empty
- Use `supabaseServer` (lazy-initialized, handles missing env vars gracefully)
- Return typed data structures

**Key Repositories:**
- `simulationConfigRepository.ts` - Unified config (global + industry)
- `serviceRepository.ts` - Services per industry
- `upgradeRepository.ts` - Upgrades and levels
- `eventRepository.ts` - Random events
- `metricDisplayConfigRepository.ts` - Metric display configuration

### Configuration System

**Unified Config Table:**
- Single `simulation_config` table with `industry_id` as primary key
- `industry_id = 'global'` = Global defaults
- `industry_id = <industry>` = Industry-specific overrides
- Layout is industry-specific only (no global layout)

**Loading:**
- `loadGlobalSimulationSettings()` - Loads global config
- `loadIndustryContent()` - Loads all industry content (services, upgrades, events, layout, etc.)
- Both functions validate required data and throw clear errors if missing

### State Management

**Zustand Stores:**
- `configStore` - Configuration state (global + industry configs)
- `gameStore` - Game state (metrics, game loop, etc.)

**React Query:**
- Used for caching metric display configs
- Prevents duplicate fetches across components

---

## Development Workflow

### Setting Up

1. **Environment Variables:**
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  # Optional, fallback
   ```

2. **Database Setup:**
   - Run migrations in order: `006`, `007`, `008`, `010`
   - After verification, run `009` to drop old tables
   - Ensure global config exists: `SELECT * FROM simulation_config WHERE industry_id = 'global';`

3. **Verify Setup:**
   - Check browser console for errors
   - Verify admin panel loads
   - Verify game loads for at least one industry

### Adding New Features

**Before starting:**
1. Check `DATABASE_SCHEMA.md` for current schema
2. Review existing repositories for patterns
3. Check if similar functionality exists

**When adding new fields:**
1. Update database schema (migration)
2. Update TypeScript types (`lib/game/types.ts`)
3. Update repository mapping functions
4. Update admin form components (if needed)
5. Update game logic (if needed)

**When adding new tables:**
1. Create migration file
2. Create repository file following existing patterns
3. Create admin actions in `lib/server/actions/adminActions.ts`
4. Create admin hooks/components if needed

### Code Patterns

**Repository Pattern:**
```typescript
// Return null on error, [] on empty
export async function fetchX(industryId: IndustryId): Promise<X[] | null> {
  if (!supabaseServer) return null;
  
  const { data, error } = await supabaseServer
    .from('table_name')
    .select('*')
    .eq('industry_id', industryId);
  
  if (error) {
    console.error('Error:', error);
    return null;
  }
  
  return data || [];
}
```

**Validation Pattern:**
- Validate at load time (fail fast)
- Show clear error messages
- Use TypeScript types for compile-time safety

---

## Admin Panel

### Structure

- `/admin` - Main admin page
- `/admin/global-config` - Global configuration
- `/admin/[industry]/industry-config` - Industry configuration
- `/admin/[industry]/services` - Services management
- `/admin/[industry]/upgrades` - Upgrades management
- `/admin/[industry]/events` - Events management
- `/admin/[industry]/metric-display` - Metric display configuration

### Validation

**Layout Validation:**
- Entry position required
- All positions must have numeric x/y (not NaN, not negative)
- Service rooms must have both customer and staff positions
- Validation errors shown inline, save blocked if errors exist

---

## Testing & Debugging

### Common Issues

**"Layout config not found" error:**
- Industry missing layout in `simulation_config` table
- Fix: Configure layout via admin panel or SQL

**"Missing required industry data" error:**
- Industry missing services, upgrades, or events
- Fix: Add at least 1 of each via admin panel

**Supabase connection errors:**
- Check environment variables
- Verify Supabase project is active
- Check browser console for detailed errors

### Debugging Tips

1. **Check browser console** - All errors logged there
2. **Check Supabase logs** - Database errors visible in Supabase dashboard
3. **Use React DevTools** - Inspect Zustand store state
4. **Use Network tab** - See API requests/responses

---

## Migration Guide

### Running Migrations

1. Open Supabase SQL Editor
2. Run migrations in order (006, 007, 008, 010)
3. Verify data migrated correctly
4. Run 009 to drop old tables (after verification)

### Verification

After running migrations:
```sql
-- Check unified config has data
SELECT industry_id, COUNT(*) FROM simulation_config GROUP BY industry_id;

-- Check layout coverage
SELECT i.id, sc.entry_position IS NOT NULL as has_layout
FROM industries i
LEFT JOIN simulation_config sc ON i.id = sc.industry_id
WHERE i.is_available = true;
```

---

## Next Steps

### Recommended Before New Features

1. ✅ Run migration `009_drop_old_simulation_config_tables.sql`
2. ✅ Verify all industries have layout data
3. ✅ Test admin panel thoroughly
4. ✅ Document any new patterns you create

### Future Improvements

- Add database-level constraints for layout validation
- Add automated tests for data loading
- Add Playwright tests for admin panel
- Improve error messages and user feedback

---

## Resources

- **Database Schema:** See `DATABASE_SCHEMA.md`
- **Database Setup:** See `DATABASE_SETUP_GUIDE.md`
- **Migrations:** See `sql/migrations/` directory
