import type { IndustryId } from '@/lib/game/types';
import type {
  GlobalSimulationConfigState,
  IndustryContentConfig,
} from '@/lib/store/config/types';
import {
  loadGlobalSimulationSettings as loadGlobalFromServer,
  loadIndustryContent as loadIndustryFromServer,
  type IndustryContentLoadResult,
} from '@/lib/server/loadGameData';

// Re-export types from loadGameData for backward compatibility
export type { IndustryContentLoadResult } from '@/lib/server/loadGameData';

/**
 * Load global simulation settings from the database.
 * This is a wrapper around the server-side loadGlobalSimulationSettings.
 * @deprecated Use loadGlobalSimulationSettings from '@/lib/server/loadGameData' directly in server components.
 */
export async function loadGlobalSimulationSettings(): Promise<GlobalSimulationConfigState | null> {
  return await loadGlobalFromServer();
}

/**
 * Load all content for a specific industry.
 * This is a wrapper around the server-side loadIndustryContent.
 * @deprecated Use loadIndustryContent from '@/lib/server/loadGameData' directly in server components.
 */
export async function loadIndustryContent(
  industryId: IndustryId,
): Promise<IndustryContentLoadResult | null> {
  return await loadIndustryFromServer(industryId);
}
