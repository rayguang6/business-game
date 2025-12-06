import {
  BusinessMetrics,
  BusinessStats,
  MapConfig,
  MapWall,
  MovementConfig,
  UpgradeDefinition,
  UpgradeEffect,
  UpgradeId,
  IndustrySimulationConfig,
  IndustryId,
  BaseUpgradeMetrics,
  IndustryServiceDefinition,
  SimulationLayoutConfig,
  DEFAULT_INDUSTRY_ID,
} from './types';
import {
  useConfigStore,
  getServicesFromStore,
  getUpgradesFromStore,
  getEventsFromStore,
} from '@/lib/store/configStore';
import type { WinCondition, LoseCondition } from './winConditions';

// Import unified simulation config repository
import { fetchSimulationConfig as fetchUnifiedSimulationConfig } from '@/lib/data/simulationConfigRepository';

export type {
  BusinessMetrics,
  BusinessStats,
  MapConfig,
  MapWall,
  MovementConfig,
  UpgradeDefinition,
  UpgradeEffect,
  UpgradeId,
  IndustrySimulationConfig,
  BaseUpgradeMetrics,
  IndustryServiceDefinition,
} from './types';

export { DEFAULT_INDUSTRY_ID } from './types';

const cloneServices = (services: IndustryServiceDefinition[]): IndustryServiceDefinition[] =>
  services.map((service) => ({ ...service }));

const cloneUpgrades = (upgrades: UpgradeDefinition[]): UpgradeDefinition[] =>
  upgrades.map((upgrade) => ({
    ...upgrade,
    levels: upgrade.levels.map((level) => ({
      ...level,
      effects: level.effects.map((effect) => ({ ...effect })),
    })),
  }));

const cloneEvents = (events: IndustrySimulationConfig['events']) =>
  events.map((event) => ({
    ...event,
    choices: event.choices.map((choice) => ({
      ...choice,
      consequences: choice.consequences.map((consequence) => ({
        ...consequence,
        effects: consequence.effects.map((effect) => ({ ...effect })),
      })),
    })),
  }));

const cloneLayout = (layout: SimulationLayoutConfig): SimulationLayoutConfig => ({
  entryPosition: { ...layout.entryPosition },
  waitingPositions: layout.waitingPositions.map((pos) => ({ ...pos })),
  serviceRooms: layout.serviceRooms.map((room) => ({
    roomId: room.roomId,
    customerPosition: { ...room.customerPosition },
    staffPosition: { ...room.staffPosition },
  })),
  staffPositions: layout.staffPositions.map((pos) => ({ ...pos })),
  mainCharacterPosition: layout.mainCharacterPosition
    ? { ...layout.mainCharacterPosition }
    : undefined,
  mainCharacterSpriteImage: layout.mainCharacterSpriteImage,
});

const mergeLayout = (
  base: SimulationLayoutConfig,
  override: SimulationLayoutConfig,
): SimulationLayoutConfig => ({
  entryPosition: override.entryPosition ? { ...override.entryPosition } : { ...base.entryPosition },
  waitingPositions:
    override.waitingPositions && override.waitingPositions.length > 0
      ? override.waitingPositions.map((pos) => ({ ...pos }))
      : base.waitingPositions.map((pos) => ({ ...pos })),
  serviceRooms:
    override.serviceRooms && override.serviceRooms.length > 0
      ? override.serviceRooms.map((room) => ({
          roomId: room.roomId,
          customerPosition: { ...room.customerPosition },
          staffPosition: { ...room.staffPosition },
        }))
      : base.serviceRooms.map((room) => ({
          roomId: room.roomId,
          customerPosition: { ...room.customerPosition },
          staffPosition: { ...room.staffPosition },
        })),
  staffPositions:
    override.staffPositions && override.staffPositions.length > 0
      ? override.staffPositions.map((pos) => ({ ...pos }))
      : base.staffPositions.map((pos) => ({ ...pos })),
  mainCharacterPosition: override.mainCharacterPosition
    ? { ...override.mainCharacterPosition }
    : base.mainCharacterPosition
      ? { ...base.mainCharacterPosition }
      : undefined,
  mainCharacterSpriteImage: override.mainCharacterSpriteImage ?? base.mainCharacterSpriteImage,
});

const getIndustryOverride = (industryId: IndustryId) =>
  useConfigStore.getState().industryConfigs[industryId];

const getGlobalConfigOverride = () => useConfigStore.getState().globalConfig;

/**
 * Centralized game configuration
 * ------------------------------
 * This module is the single source of truth for all balance numbers that drive the
 * business simulation. The most important business metrics live right at the top so
 * designers can tweak them without hunting through the file.
 */

// -----------------------------------------------------------------------------
// Multi-industry helpers (transitional)
// Default industry stays dental until all features read from these helpers.
// TODO: once every subsystem consumes these APIs, fold them into the primary
// exports above and remove the legacy constants.
// -----------------------------------------------------------------------------

// Removed getFallbackSimulationConfig and getSimulationConfig - no code defaults, data must be in database

export function getBusinessMetrics(industryId: IndustryId = DEFAULT_INDUSTRY_ID): BusinessMetrics | null {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  return industryConfig?.businessMetrics || null;
}

export function getBusinessStats(industryId: IndustryId = DEFAULT_INDUSTRY_ID): BusinessStats | null {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  return industryConfig?.businessStats || null;
}

export function getMapConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  return industryConfig?.mapConfig;
}

export function getMovementConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): MovementConfig | null {
  // Movement is stored in global config only
  const globalConfig = getGlobalConfigOverride();
  return globalConfig?.movement ? { ...globalConfig.movement } : null;
}

export function getGlobalMovementConfig(): MovementConfig | null {
  const global = getGlobalConfigOverride()?.movement;
  if (global) {
    return { ...global };
  }
  
  // Data not loaded - return null (should be caught at load time)
  return null;
}

export function getWinCondition(industryId?: IndustryId): WinCondition | null {
  // Use unified config repository
  if (industryId) {
    const industryConfig = getIndustryOverride(industryId);
    if (industryConfig?.winCondition) {
      return { ...industryConfig.winCondition };
    }
  }

  // Check global config as fallback
  const global = getGlobalConfigOverride()?.winCondition;
  return global ? { ...global } : null;
}

export function getLoseCondition(industryId?: IndustryId): LoseCondition | null {
  // Use unified config repository
  if (industryId) {
    const industryConfig = getIndustryOverride(industryId);
    if (industryConfig?.loseCondition) {
      return { ...industryConfig.loseCondition };
    }
  }

  // Check global config as fallback
  const global = getGlobalConfigOverride()?.loseCondition;
  return global ? { ...global } : null;
}

export function getLayoutConfig(industryId: IndustryId = DEFAULT_INDUSTRY_ID): SimulationLayoutConfig | null {
  // Use unified config repository - layout is industry-specific only
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.layout) {
    return cloneLayout(industryConfig.layout);
  }

  // Data not loaded - return null (should be caught at load time)
  return null;
}

export function getServicesForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustryServiceDefinition[] {
  const stored = getServicesFromStore(industryId);
  // Return empty array if not in store - game will fail if services are missing (correct behavior)
  return stored;
}

export function getUpgradesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const stored = getUpgradesFromStore(industryId);
  // Return empty array if not in store - game will fail if upgrades are missing (correct behavior)
  return stored;
}

export function getEventsForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const stored = getEventsFromStore(industryId);
  // Return empty array if not in store - game will fail if events are missing (correct behavior)
  return stored;
}

export function getCustomerImagesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string[] {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.customerImages && industryConfig.customerImages.length > 0) {
    return [...industryConfig.customerImages];
  }

  // Check global config as fallback
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.customerImages && globalConfig.customerImages.length > 0) {
    return [...globalConfig.customerImages];
  }

  return [];
}

export function getDefaultCustomerImageForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const images = getCustomerImagesForIndustry(industryId);
  return images[0] ?? '/images/customer/customer1.png';
}

export function getStaffNamePoolForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string[] {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.staffNamePool && industryConfig.staffNamePool.length > 0) {
    return [...industryConfig.staffNamePool];
  }

  // Check global config as fallback
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.staffNamePool && globalConfig.staffNamePool.length > 0) {
    return [...globalConfig.staffNamePool];
  }

  console.warn(`[Config] Staff name pool not found for industry ${industryId}. Please configure in database.`);
  return [];
}

export function getCapacityImageForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string | null {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.capacityImage !== undefined) {
    return industryConfig.capacityImage || null;
  }

  // Check global config as fallback
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.capacityImage !== undefined) {
    return globalConfig.capacityImage || null;
  }

  return null;
}

// Default lead dialogues (fallback if not configured)
const DEFAULT_LEAD_DIALOGUES = [
  "It's too expensive",
  "I need to think about it",
  "I found a better one",
  "Maybe next time",
  "Not sure if I can afford it",
  "Let me check my budget",
  "Interesting, but...",
  "I'll come back later"
];

export function getLeadDialoguesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string[] {
  // Use unified config repository
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.leadDialogues && industryConfig.leadDialogues.length > 0) {
    return [...industryConfig.leadDialogues];
  }

  // Check global config as fallback
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.leadDialogues && globalConfig.leadDialogues.length > 0) {
    return [...globalConfig.leadDialogues];
  }

  // Fallback to defaults
  return [...DEFAULT_LEAD_DIALOGUES];
}

export function getTickIntervalMsForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  return Math.round((1 / stats.ticksPerSecond) * 1000);
}

export function getBaseUpgradeMetricsForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): BaseUpgradeMetrics {
  const stats = getBusinessStats(industryId);
  const metrics = getBusinessMetrics(industryId);
  if (!stats || !metrics) throw new Error('Business config not loaded');
  return {
    monthlyExpenses: metrics.monthlyExpenses,
    spawnIntervalSeconds: stats.customerSpawnIntervalSeconds,
    serviceSpeedMultiplier: 1,
    exp: 0, // EXP starts at 0, modified by effects
    serviceCapacity: stats.serviceCapacity,
    // happyProbability removed - not used in game mechanics (customers happy/angry based on patience)
    serviceRevenueMultiplier: stats.serviceRevenueMultiplier ?? 1,
    serviceRevenueFlatBonus: 0,
    founderWorkingHours: getFounderWorkingHoursBase(industryId),
  };
}

export function getTicksPerSecondForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  return stats.ticksPerSecond;
}

export function getRoundDurationSecondsForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number {
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  return stats.monthDurationSeconds;
}

export function getFounderWorkingHoursBase(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  const metrics = getBusinessMetrics(industryId);
  if (!metrics) throw new Error('Business metrics not loaded');
  return metrics.startingFreedomScore; // Previously: founderWorkHours
}

/**
 * Get starting available time for an industry
 */
export function getStartingTime(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  const metrics = getBusinessMetrics(industryId);
  if (!metrics) throw new Error('Business metrics not loaded');
  return metrics.startingTime ?? 0;
}

export function getEventTriggerSecondsForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number[] {
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  const duration = stats.monthDurationSeconds;
  if (duration <= 0) {
    return [];
  }

  const configured = (stats.eventTriggerSeconds ?? [])
    .filter((value) => value > 0 && value < duration);

  return [...new Set(configured)].sort((a, b) => a - b);
}

export function secondsToTicks(
  seconds: number,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number {
  return Math.round(seconds * getTicksPerSecondForIndustry(industryId));
}

export function ticksToSeconds(
  ticks: number,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number {
  return ticks / getTicksPerSecondForIndustry(industryId);
}

export function getCurrentMonth(
  gameTimeSeconds: number,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number {
  const roundDuration = getRoundDurationSecondsForIndustry(industryId);
  return Math.floor(gameTimeSeconds / roundDuration) + 1;
}

export function getMonthProgress(
  gameTimeSeconds: number,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number {
  const roundDuration = getRoundDurationSecondsForIndustry(industryId);
  const currentMonthTime = gameTimeSeconds % roundDuration;
  return (currentMonthTime / roundDuration) * 100;
}

export function isNewMonth(
  gameTimeSeconds: number,
  previousGameTime: number,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): boolean {
  return getCurrentMonth(gameTimeSeconds, industryId) > getCurrentMonth(previousGameTime, industryId);
}

export function calculateMonthlyRevenuePotential(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): {
  customersPerMonth: number;
  averageServicePrice: number;
  potentialRevenue: number;
  realisticTarget: number;
} {
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  const services = getServicesForIndustry(industryId);

  const customersPerMonth = Math.floor(stats.monthDurationSeconds / stats.customerSpawnIntervalSeconds);
  const averageServicePrice =
    services.reduce((sum, service) => sum + service.price, 0) / Math.max(services.length, 1);
  const potentialRevenue = customersPerMonth * averageServicePrice;
  const realisticTarget = potentialRevenue * 0.7;

  return {
    customersPerMonth,
    averageServicePrice,
    potentialRevenue,
    realisticTarget,
  };
}

export function getExpPerLevel(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');
  return stats.expPerLevel ?? 200; // Default fallback
}

export const getUiConfig = () => {
  const globalConfig = getGlobalConfigOverride();
  return {
    eventAutoSelectDurationSeconds: globalConfig?.uiConfig?.eventAutoSelectDurationSeconds ?? 10,
    outcomePopupDurationSeconds: globalConfig?.uiConfig?.outcomePopupDurationSeconds ?? 5,
  };
};
