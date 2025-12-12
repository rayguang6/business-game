import 'server-only';
import type { IndustryId } from '@/lib/game/types';
import type { GlobalSimulationConfigState, IndustryContentConfig } from '@/lib/store/config/types';
// Import unified simulation config repository
import { fetchSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { fetchServicesForIndustry } from '@/lib/data/serviceRepository';
import { fetchUpgradesForIndustry } from '@/lib/data/upgradeRepository';
import { fetchEventsForIndustry } from '@/lib/data/eventRepository';
import { fetchMarketingCampaignsForIndustry } from '@/lib/data/marketingRepository';
import { fetchStaffDataForIndustry } from '@/lib/data/staffRepository';
import { fetchFlagsForIndustry } from '@/lib/data/flagRepository';
import { fetchConditionsForIndustry } from '@/lib/data/conditionRepository';
import { fetchLevelRewardsForIndustry } from '@/lib/data/levelRewardsRepository';
import { fetchCategoriesForIndustry } from '@/lib/data/categoryRepository';
import { fetchIndustriesFromSupabase } from '@/lib/data/industryRepository';
import { fetchAllMetricDisplayConfigs } from '@/lib/data/metricDisplayConfigRepository';
import type { SimulationLayoutConfig, Category } from '@/lib/game/types';

export interface IndustryContentLoadResult extends IndustryContentConfig {
  staffDataAvailable: boolean;
}

/**
 * Resolve layout config from industry config only (no global fallback)
 * Throws error if layout is missing - data must be in database
 */
function resolveLayoutConfig(
  industryId: IndustryId,
  industrySimConfig: Awaited<ReturnType<typeof fetchSimulationConfig>>,
): SimulationLayoutConfig {
  // Try industry-specific layout only
  if (industrySimConfig?.layoutConfig) {
    return industrySimConfig.layoutConfig;
  }

  // No layout found - validate at load time with clear error
  throw new Error(
    `Layout config not found for industry "${industryId}". ` +
    `Please configure layout (entry_position, waiting_positions, service_rooms, staff_positions) ` +
    `in simulation_config table via the admin panel.`
  );
}

/**
 * Load global simulation settings from the database.
 * This should be called once when the game starts.
 */
export async function loadGlobalSimulationSettings(): Promise<GlobalSimulationConfigState | null> {
  const result = await fetchSimulationConfig('global');
  if (!result) {
    throw new Error(
      'Failed to load global simulation config from database. ' +
      'Please ensure simulation_config table has data configured for industry_id = "global".'
    );
  }

  // Validate required fields - fail fast at load time
  if (!result.businessMetrics) {
    throw new Error(
      'Global simulation config is missing business_metrics. ' +
      'Please configure business_metrics in simulation_config table for industry_id = "global".'
    );
  }

  if (!result.businessStats) {
    throw new Error(
      'Global simulation config is missing business_stats. ' +
      'Please configure business_stats in simulation_config table for industry_id = "global".'
    );
  }

  if (!result.movement) {
    throw new Error(
      'Global simulation config is missing movement. ' +
      'Please configure movement in simulation_config table for industry_id = "global".'
    );
  }

  return {
    businessMetrics: result.businessMetrics,
    businessStats: result.businessStats,
    movement: result.movement,
    mapConfig: result.mapConfig,
    capacityImage: result.capacityImage,
    winCondition: result.winCondition,
    loseCondition: result.loseCondition,
    customerImages: result.customerImages,
    staffNamePool: result.staffNamePool,
    leadDialogues: result.leadDialogues,
    uiConfig: result.uiConfig,
  };
}

/**
 * Load all content for a specific industry.
 * This fetches all industry-specific data in parallel for optimal performance.
 */
export async function loadIndustryContent(
  industryId: IndustryId,
): Promise<IndustryContentLoadResult | null> {
  const [
    servicesResult,
    upgradesResult,
    eventsResult,
    marketingResult,
    categoriesResult,
    staffResult,
    flagsResult,
    conditionsResult,
    levelRewardsResult,
    metricDisplayConfigsResult,
    industrySimConfig,
  ] = await Promise.all([
    fetchServicesForIndustry(industryId),
    fetchUpgradesForIndustry(industryId),
    fetchEventsForIndustry(industryId),
    fetchMarketingCampaignsForIndustry(industryId),
    fetchCategoriesForIndustry(industryId),
    fetchStaffDataForIndustry(industryId),
    fetchFlagsForIndustry(industryId),
    fetchConditionsForIndustry(industryId),
    fetchLevelRewardsForIndustry(industryId),
    fetchAllMetricDisplayConfigs(industryId),
    fetchSimulationConfig(industryId),
  ]);

  // Check for errors (null = error, [] = success with no data)
  if (
    servicesResult === null ||
    upgradesResult === null ||
    eventsResult === null ||
    marketingResult === null ||
    categoriesResult === null ||
    flagsResult === null ||
    conditionsResult === null ||
    levelRewardsResult === null ||
    metricDisplayConfigsResult === null
  ) {
    return null;
  }

  // Use results (empty arrays are valid - means no data configured)
  const services = servicesResult;
  const upgrades = upgradesResult;
  const events = eventsResult;
  const marketingCampaigns = marketingResult;
  const categories = categoriesResult;
  const flags = flagsResult;
  const conditions = conditionsResult;
  const levelRewards = levelRewardsResult;
  const metricDisplayConfigs = metricDisplayConfigsResult;

  const staffDataAvailable = Boolean(staffResult);

  // Validate required fields - fail fast at load time
  if (services.length === 0) {
    throw new Error(
      `Industry "${industryId}" has no services configured. ` +
      `Please add at least one service in the admin panel.`
    );
  }

  if (upgrades.length === 0) {
    throw new Error(
      `Industry "${industryId}" has no upgrades configured. ` +
      `Please add at least one upgrade in the admin panel.`
    );
  }

  if (events.length === 0) {
    throw new Error(
      `Industry "${industryId}" has no events configured. ` +
      `Please add at least one event in the admin panel.`
    );
  }

  // Resolve layout config from industry config only (no global fallback)
  const resolvedLayout = resolveLayoutConfig(industryId, industrySimConfig);

  return {
    industryId,
    services,
    upgrades,
    events,
    marketingCampaigns,
    categories,
    staffRoles: staffResult?.roles ?? [],
    staffPresets: staffResult?.initialStaff ?? [],
    staffNamePool: staffResult?.namePool ?? undefined,
    flags,
    conditions,
    levelRewards,
    metricDisplayConfigs,
    layout: resolvedLayout,
    // Industry-specific simulation config overrides
    businessMetrics: industrySimConfig?.businessMetrics,
    businessStats: industrySimConfig?.businessStats,
    mapConfig: industrySimConfig?.mapConfig,
    capacityImage: industrySimConfig?.capacityImage,
    winCondition: industrySimConfig?.winCondition,
    loseCondition: industrySimConfig?.loseCondition,
    leadDialogues: industrySimConfig?.leadDialogues,
    eventSelectionMode: industrySimConfig?.eventSelectionMode,
    eventSequence: industrySimConfig?.eventSequence,
    staffDataAvailable,
  };
}

/**
 * Load all industries from the database.
 * Used for industry selection page.
 */
export async function loadIndustries() {
  return await fetchIndustriesFromSupabase();
}



