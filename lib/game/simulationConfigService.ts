import type { IndustryId, SimulationLayoutConfig } from '@/lib/game/types';
import type {
  GlobalSimulationConfigState,
  IndustryContentConfig,
} from '@/lib/store/config/types';
import { fetchGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { fetchIndustrySimulationConfig } from '@/lib/data/industrySimulationConfigRepository';
import { fetchServicesForIndustry } from '@/lib/data/serviceRepository';
import { fetchUpgradesForIndustry } from '@/lib/data/upgradeRepository';
import { fetchEventsForIndustry } from '@/lib/data/eventRepository';
import { fetchMarketingCampaignsForIndustry } from '@/lib/data/marketingRepository';
import { fetchStaffDataForIndustry } from '@/lib/data/staffRepository';
import { fetchFlagsForIndustry } from '@/lib/data/flagRepository';
import { fetchConditionsForIndustry } from '@/lib/data/conditionRepository';
import { getLayoutConfigWithFallback } from '@/lib/game/configHelpers';

export interface IndustryContentLoadResult extends IndustryContentConfig {
  staffDataAvailable: boolean;
}

export async function loadGlobalSimulationSettings(): Promise<GlobalSimulationConfigState | null> {
  const result = await fetchGlobalSimulationConfig();
  if (!result) {
    return null;
  }

  return {
    businessMetrics: result.businessMetrics,
    businessStats: result.businessStats,
    movement: result.movement,
    mapConfig: result.mapConfig,
    layoutConfig: result.layoutConfig,
    capacityImage: result.capacityImage,
    winCondition: result.winCondition,
    loseCondition: result.loseCondition,
    customerImages: result.customerImages,
    staffNamePool: result.staffNamePool,
  };
}

export async function loadIndustryContent(
  industryId: IndustryId,
): Promise<IndustryContentLoadResult | null> {
  const [
    servicesResult,
    upgradesResult,
    eventsResult,
    marketingResult,
    staffResult,
    flagsResult,
    conditionsResult,
    industrySimConfig,
  ] = await Promise.all([
    fetchServicesForIndustry(industryId),
    fetchUpgradesForIndustry(industryId),
    fetchEventsForIndustry(industryId),
    fetchMarketingCampaignsForIndustry(industryId),
    fetchStaffDataForIndustry(industryId),
    fetchFlagsForIndustry(industryId),
    fetchConditionsForIndustry(industryId),
    fetchIndustrySimulationConfig(industryId),
  ]);

  if (
    !servicesResult ||
    !upgradesResult ||
    !eventsResult ||
    !marketingResult ||
    flagsResult === null ||
    conditionsResult === null
  ) {
    return null;
  }

  const services = servicesResult ?? [];
  const upgrades = upgradesResult ?? [];
  const events = eventsResult ?? [];
  const marketingCampaigns = marketingResult ?? [];
  const flags = flagsResult ?? [];
  const conditions = conditionsResult ?? [];

  const staffDataAvailable = Boolean(staffResult);

  // Load layout config from database (with fallback)
  const resolvedLayout = await getLayoutConfigWithFallback(industryId);

  return {
    industryId,
    services,
    upgrades,
    events,
    marketingCampaigns,
    staffRoles: staffResult?.roles ?? [],
    staffPresets: staffResult?.initialStaff ?? [],
    staffNamePool: industrySimConfig?.staffNamePool ?? staffResult?.namePool ?? undefined,
    flags,
    conditions,
    layout: resolvedLayout,
    // Industry-specific simulation config overrides
    businessMetrics: industrySimConfig?.businessMetrics,
    businessStats: industrySimConfig?.businessStats,
    movement: industrySimConfig?.movement,
    mapConfig: industrySimConfig?.mapConfig,
    capacityImage: industrySimConfig?.capacityImage,
    winCondition: industrySimConfig?.winCondition,
    loseCondition: industrySimConfig?.loseCondition,
    customerImages: industrySimConfig?.customerImages,
    staffDataAvailable,
  };
}
