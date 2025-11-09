# Runtime Data Flow

This document explains how game content moves from Supabase into the runtime store and
how the different systems consume it.

## 1. Loading

| Stage | Responsibility |
| --- | --- |
| `loadGlobalSimulationSettings` | Fetch global metrics/stats/movement from Supabase (`global_simulation_config`). |
| `loadIndustryContent` | Fetch per–industry services, upgrades, events, staff, marketing, flags, conditions, and optional layout positions. |
| `useConfigStore.setGlobalConfig / setIndustryConfig` | Persist the fetched payloads into the shared config store. Each write deeply clones data to guarantee immutability for consumers. |

The loader runs inside `app/game/[industry]/page.tsx` when the game page mounts or the selected
industry changes. If Supabase lacks a record, the loader returns `null` and the UI surfaces an
error instead of silently mutating defaults.

## 2. Access

During gameplay the app only reads from two places:

1. `useConfigStore` – canonical copy of all content pulled from Supabase. Memoized selectors
   (`selectUpgradesForIndustry`, etc.) return cloned snapshots for React components.
2. `lib/game/config.ts` – helper APIs that first try the config store and fall back to
   `createDefaultSimulationConfig` (default numbers) so the simulation can boot even before
   data is loaded.

No system mutates the config once loaded. Any change must go back through Supabase and a reload.

## 3. Consumption Examples

- **Layout/Positioning**: `getLayoutConfig` merges the stored layout override with the baked-in
  default tiles. Canvas components subscribe to `useConfigStore` so changes propagate instantly.
- **Staff**: `lib/game/staffConfig.ts` builds roles/presets directly from the stored industry config.
  Hiring/resetting simply reuses those definitions.
- **Upgrades/Marketing/Events**: slices and UI components resolve definitions via selectors
  (fallback only if the store is empty) ensuring they always reflect Supabase content.
- **Hooks**: `useRandomEventTrigger` queries stored events when picking eligible events each month.

## 4. Default Fallbacks

`createDefaultSimulationConfig` contains the legacy “Dental clinic” numbers. It is used only when
no Supabase data exists (e.g., first boot). Once Supabase tables are populated the runtime never
relies on those defaults.

## 5. Extending the System

1. Add/modify content via Supabase (or the admin UI).
2. Ensure the loader fetches the new table/fields and writes them into `useConfigStore`.
3. Expose selectors/helper getters if other modules need the new data.
4. Components/slices should subscribe to selectors rather than hitting Supabase directly.

Following this pipeline keeps the game data-driven and ensures all systems share the same source of truth.
