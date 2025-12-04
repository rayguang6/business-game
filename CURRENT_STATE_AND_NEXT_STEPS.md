# Admin Stabilization & Cleanup Guide

This document is the implementation checklist for hardening the admin tooling, validating industry layouts, and cleaning up the database schema. Work through each section sequentially; capture progress in your task tracker so we can pick up where we left off in later conversations.

---

## 1. Baseline Verification

### 1.1 Inventory Industry Layout Coverage
1. Run the verification SQL in Supabase (below) and paste the results into the tracker.
2. Mark every industry with `❌ Missing layout` and list the fields that are null/malformed if known.

```sql
SELECT 
  i.id as industry_id,
  i.name as industry_name,
  CASE 
    WHEN isc.entry_position IS NULL THEN '❌ Missing layout'
    ELSE '✅ Has layout'
  END as layout_status
FROM industries i
LEFT JOIN industry_simulation_config isc ON i.id = isc.industry_id
WHERE i.is_available = true
ORDER BY i.id;
```

### 1.2 Admin Panel Smoke Test
For each industry (especially the ❌ ones):
- Navigate to `/admin`.
- Walk through **Global Config**, **Industry Config**, **Services**, **Staff** tabs.
- Confirm data loads without errors and saving works (see checklist in §4).
- Log any issues (UI error, validation gap, Supabase failure) with repro steps.

Deliverable: a short QA note that lists industries tested, failures encountered, and screenshots/logs if possible.

---

## 2. Fill Missing Layouts

### 2.1 Using the Admin Panel (preferred)
For every industry flagged in §1:
1. `/admin` → Industry Config tab → select industry.
2. In “Layout Positions”:
   - Set `entry_position`.
   - Add waiting positions, service rooms, staff positions via the UI.
3. Provide optional overrides (metrics/stats/map) if the designer needs deviations.
4. Save and refresh the page to confirm persistence.

### 2.2 SQL Backfill (only if UI is blocked)
Use the template below, replacing IDs/coordinates:

```sql
INSERT INTO industry_simulation_config (id, industry_id, entry_position, waiting_positions, service_rooms, staff_positions)
VALUES (
  'config-<industry>',
  '<industry>',
  '{"x": 4, "y": 9}'::jsonb,
  '[
    {"x": 1, "y": 1},
    {"x": 1, "y": 2}
  ]'::jsonb,
  '[
    {"roomId": 1, "customerPosition": {"x": 5, "y": 2}, "staffPosition": {"x": 5, "y": 1}}
  ]'::jsonb,
  '[
    {"x": 4, "y": 0}
  ]'::jsonb
)
ON CONFLICT (industry_id) DO UPDATE SET
  entry_position = EXCLUDED.entry_position,
  waiting_positions = EXCLUDED.waiting_positions,
  service_rooms = EXCLUDED.service_rooms,
  staff_positions = EXCLUDED.staff_positions;
```

Re-run the verification query after every batch and keep iterating until all industries show ✅.

---

## 3. Schema Cleanup & Type Alignment

### 3.1 Preconditions
- All industries confirmed ✅.
- Admin smoke test passes without blockers.

### 3.2 Remove Deprecated Columns
Execute in Supabase:

```sql
ALTER TABLE global_simulation_config
  DROP COLUMN IF EXISTS entry_position,
  DROP COLUMN IF EXISTS waiting_positions,
  DROP COLUMN IF EXISTS service_rooms,
  DROP COLUMN IF EXISTS staff_positions;
```

Verify removal:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'global_simulation_config'
ORDER BY column_name;
```

### 3.3 Update TypeScript & Repository Logic
- `lib/data/simulationConfigRepository.ts`: remove the dropped fields from `GlobalSimulationConfigRow` and related parsing logic.
- Ensure calling code no longer references global layout fields.
- Run `npm run lint` / `npm run test` after edits.

---

## 4. Admin Panel Regression Checklist

- [ ] **Global Config Tab**: load/save metrics, stats, movement, win/lose, UI config.
- [ ] **Industry Config Tab**: select industry, edit/save entry + waiting + service rooms + staff positions, overrides, lead dialogues, events.
- [ ] **Services Tab**: CRUD services; flags/upgrades dropdowns populate; save persists.
- [ ] **Staff Tab**: CRUD roles & presets; metric/effect options available.
- [ ] **Upgrades / Marketing / Events Tabs**: CRUD works, effect builders save correctly.
- [ ] **Flags / Conditions Tabs**: selection, creation, deletion, resets all work.
- [ ] **URL State**: refresh retains selected tab/industry via query params.
- [ ] **Data Persistence**: after save + page refresh, data remains intact; gameplay uses new layouts.

Capture pass/fail for each tab plus any GQL/Supabase errors seen in the console.

---

## 5. Data Validation Hardening

### 5.1 Client-Side Guardrails
1. Add a `validateIndustryConfig(config)` helper (shared across hooks/components) to assert:
   - All positions have numeric `x/y`.
   - Service room `customerPosition` and `staffPosition` exist.
   - No negative coordinates.
2. Surface validation errors inline near Save buttons.

### 5.2 Server/DB Constraints
- Add Supabase `CHECK` constraints for key JSON paths (e.g., `jsonb_typeof(entry_position->'x') = 'number'`).
- Optionally write a trigger that calls a PL/pgSQL validation function mirroring the client checks.
- Document constraints in `DATABASE_SETUP_GUIDE.md`.

Deliverable: merged PR with client validation + SQL migration, plus updated docs.

---

## 6. Automated Confidence

### 6.1 Hook/Repository Tests
- Add unit tests for `useIndustrySimulationConfig` and related repositories (mock Supabase client).
- Cover load success/failure, save success/failure, and validation error paths.

### 6.2 Playwright Smoke Test
- Scenario: Start dev server → `/admin` → select fixture industry → edit Global Config field → save → switch to Industry Config → tweak layout coordinate → save → confirm toast/status → reload page → values persist.
- Integrate into CI; document how to run locally.

---

## 7. Telemetry & Backups (Post-Cleanup)

### 7.1 Configuration Backups
- Nightly job (GitHub Action or Supabase cron) exports `global_simulation_config` + `industry_simulation_config` JSON to Supabase Storage or repo.
- Provide a restore script + doc.

### 7.2 Runtime Instrumentation
- Emit structured events (`layout_loaded`, `event_triggered`, etc.) from the sim runtime with industry IDs.
- Ship to Supabase Logflare or a custom analytics table.
- Define dashboards/queries to monitor balancing metrics.

---

## 8. Summary Timeline
1. Baseline verification & admin QA.
2. Fill missing layouts.
3. Schema cleanup + TS alignment.
4. Regression pass + validation hardening.
5. Automated tests & Playwright.
6. Backups + telemetry improvements.

Track progress across these phases to ensure each is complete before moving to the next. Use this doc as the master reference when scheduling tasks or spawning follow-up conversations.
