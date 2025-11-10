import type { IndustryId, SimulationLayoutConfig } from '@/lib/game/types';
import type {
  GlobalSimulationConfigState,
  IndustryContentConfig,
} from '@/lib/store/config/types';
import { fetchGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { fetchServicesForIndustry } from '@/lib/data/serviceRepository';
import { fetchUpgradesForIndustry } from '@/lib/data/upgradeRepository';
import { fetchEventsForIndustry } from '@/lib/data/eventRepository';
import { fetchMarketingCampaignsForIndustry } from '@/lib/data/marketingRepository';
import { fetchStaffDataForIndustry } from '@/lib/data/staffRepository';
import { fetchFlagsForIndustry } from '@/lib/data/flagRepository';
import { fetchConditionsForIndustry } from '@/lib/data/conditionRepository';
import {
  fetchServiceRoomPositionsFromDatabase,
  fetchStaffPositionsFromDatabase,
} from '@/lib/data/layoutRepository';
import { getLayoutConfig } from '@/lib/game/config';

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
    winCondition: result.winCondition,
    loseCondition: result.loseCondition,
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
    staffPositions,
    serviceRoomPositions,
  ] = await Promise.all([
    fetchServicesForIndustry(industryId),
    fetchUpgradesForIndustry(industryId),
    fetchEventsForIndustry(industryId),
    fetchMarketingCampaignsForIndustry(industryId),
    fetchStaffDataForIndustry(industryId),
    fetchFlagsForIndustry(industryId),
    fetchConditionsForIndustry(industryId),
    fetchStaffPositionsFromDatabase(industryId),
    fetchServiceRoomPositionsFromDatabase(industryId),
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

  const baseLayout = getLayoutConfig(industryId);
  const resolvedLayout: SimulationLayoutConfig = {
    entryPosition: { ...baseLayout.entryPosition },
    waitingPositions: baseLayout.waitingPositions.map((pos) => ({ ...pos })),
    serviceRoomPositions: (serviceRoomPositions?.length ? serviceRoomPositions : baseLayout.serviceRoomPositions).map(
      (pos) => ({ ...pos }),
    ),
    staffPositions: (staffPositions?.length ? staffPositions : baseLayout.staffPositions).map((pos) => ({ ...pos })),
  };

  return {
    industryId,
    services,
    upgrades,
    events,
    marketingCampaigns,
    staffRoles: staffResult?.roles ?? [],
    staffPresets: staffResult?.initialStaff ?? [],
    staffNamePool: staffResult?.namePool ?? undefined,
    flags,
    conditions,
    layout: resolvedLayout,
    staffDataAvailable,
  };
}
