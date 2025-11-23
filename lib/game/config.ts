import { createDefaultSimulationConfig } from './industryConfigs';
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
import { DEFAULT_WIN_CONDITION, DEFAULT_LOSE_CONDITION, type WinCondition, type LoseCondition } from './winConditions';

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
    effects: upgrade.effects.map((effect) => ({ ...effect })),
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
  serviceRoomPositions: layout.serviceRoomPositions.map((pos) => ({ ...pos })),
  staffPositions: layout.staffPositions.map((pos) => ({ ...pos })),
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
  serviceRoomPositions:
    override.serviceRoomPositions && override.serviceRoomPositions.length > 0
      ? override.serviceRoomPositions.map((pos) => ({ ...pos }))
      : base.serviceRoomPositions.map((pos) => ({ ...pos })),
  staffPositions:
    override.staffPositions && override.staffPositions.length > 0
      ? override.staffPositions.map((pos) => ({ ...pos }))
      : base.staffPositions.map((pos) => ({ ...pos })),
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

const getFallbackSimulationConfig = (
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustrySimulationConfig => createDefaultSimulationConfig(industryId);

export function getSimulationConfig(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustrySimulationConfig {
  return getFallbackSimulationConfig(industryId);
}

export function getBusinessMetrics(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.businessMetrics) {
    return { ...industryConfig.businessMetrics };
  }
  
  // Check global config
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.businessMetrics) {
    return { ...globalConfig.businessMetrics };
  }
  
  // Fallback to code defaults
  return { ...getSimulationConfig(industryId).businessMetrics };
}

export function getBusinessStats(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  // Get global config first (as base)
  const globalConfig = getGlobalConfigOverride();
  const globalStats = globalConfig?.businessStats;
  
  // Check industry-specific override
  const industryConfig = getIndustryOverride(industryId);
  const industryStats = industryConfig?.businessStats;
  
  // Merge: industry-specific overrides global, but preserve eventTriggerSeconds from global if not set in industry
  if (industryStats) {
    const merged = { ...industryStats };
    // If industry config doesn't have eventTriggerSeconds or it's empty, use global
    if (!merged.eventTriggerSeconds || merged.eventTriggerSeconds.length === 0) {
      if (globalStats?.eventTriggerSeconds && globalStats.eventTriggerSeconds.length > 0) {
        merged.eventTriggerSeconds = [...globalStats.eventTriggerSeconds];
      }
    }
    return merged;
  }
  
  // Use global config if available
  if (globalStats) {
    return { ...globalStats };
  }
  
  // Fallback to code defaults
  return { ...getSimulationConfig(industryId).businessStats };
}

export function getMapConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.mapConfig) {
    return industryConfig.mapConfig;
  }
  
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.mapConfig) {
    return globalConfig.mapConfig;
  }
  
  return getSimulationConfig(industryId).map;
}

export function getMovementConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.movement) {
    return { ...industryConfig.movement };
  }
  
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.movement) {
    return { ...globalConfig.movement };
  }
  
  return getSimulationConfig(industryId).movement;
}

export function getGlobalMovementConfig(): MovementConfig {
  const global = getGlobalConfigOverride()?.movement;
  if (global) {
    return { ...global };
  }
  return { ...getMovementConfigForIndustry(DEFAULT_INDUSTRY_ID) };
}

export function getWinCondition(industryId?: IndustryId): WinCondition {
  // If industryId provided, check industry-specific override
  if (industryId) {
    const industryConfig = getIndustryOverride(industryId);
    if (industryConfig?.winCondition) {
      return { ...industryConfig.winCondition };
    }
  }
  
  // Check global config
  const global = getGlobalConfigOverride()?.winCondition;
  if (global) {
    return { ...global };
  }
  
  // Fallback to code defaults
  return { ...DEFAULT_WIN_CONDITION };
}

export function getLoseCondition(industryId?: IndustryId): LoseCondition {
  // If industryId provided, check industry-specific override
  if (industryId) {
    const industryConfig = getIndustryOverride(industryId);
    if (industryConfig?.loseCondition) {
      return { ...industryConfig.loseCondition };
    }
  }
  
  // Check global config
  const global = getGlobalConfigOverride()?.loseCondition;
  if (global) {
    return { ...global };
  }
  
  // Fallback to code defaults
  return { ...DEFAULT_LOSE_CONDITION };
}

export function getLayoutConfig(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.layout) {
    return cloneLayout(industryConfig.layout);
  }
  
  // Check global config
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.layoutConfig) {
    return cloneLayout(globalConfig.layoutConfig);
  }
  
  // Fallback to code defaults
  const config = getSimulationConfig(industryId);
  return cloneLayout(config.layout);
}

export function getServicesForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustryServiceDefinition[] {
  const stored = getServicesFromStore(industryId);
  if (stored.length > 0) {
    return stored;
  }
  const fallback = getFallbackSimulationConfig(industryId);
  return cloneServices(fallback.services);
}

export function getUpgradesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const stored = getUpgradesFromStore(industryId);
  if (stored.length > 0) {
    return stored;
  }
  const fallback = getFallbackSimulationConfig(industryId);
  return cloneUpgrades(fallback.upgrades);
}

export function getEventsForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const stored = getEventsFromStore(industryId);
  if (stored.length > 0) {
    return stored;
  }
  const fallback = getFallbackSimulationConfig(industryId);
  return cloneEvents(fallback.events);
}

export function getCustomerImagesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string[] {
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.customerImages && industryConfig.customerImages.length > 0) {
    return [...industryConfig.customerImages];
  }
  
  // Check global config
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.customerImages && globalConfig.customerImages.length > 0) {
    return [...globalConfig.customerImages];
  }
  
  // Fallback to code defaults
  return [...getSimulationConfig(industryId).customerImages];
}

export function getDefaultCustomerImageForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const images = getCustomerImagesForIndustry(industryId);
  return images[0] ?? '/images/customer/customer1.png';
}

export function getStaffNamePoolForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string[] {
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.staffNamePool && industryConfig.staffNamePool.length > 0) {
    return [...industryConfig.staffNamePool];
  }
  
  // Check global config
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.staffNamePool && globalConfig.staffNamePool.length > 0) {
    return [...globalConfig.staffNamePool];
  }
  
  // Fallback to code defaults (from staffConfig)
  const fallback = getFallbackSimulationConfig(industryId);
  // Note: staffNamePool is not in IndustrySimulationConfig, so use DEFAULT_NAME_POOL from staffConfig
  return ['Ava', 'Noah', 'Mia', 'Ethan', 'Liam', 'Zara', 'Kai', 'Riya', 'Owen', 'Sage', 'Nico', 'Luna', 'Milo', 'Iris', 'Ezra'];
}

export function getCapacityImageForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string | null {
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.capacityImage !== undefined) {
    // Return null if explicitly set to empty string, otherwise return the value
    return industryConfig.capacityImage || null;
  }
  
  // Check global config
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.capacityImage !== undefined) {
    // Return null if explicitly set to empty string, otherwise return the value
    return globalConfig.capacityImage || null;
  }
  
  // No fallback - return null if no image is configured
  return null;
}

export function getTickIntervalMsForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  const stats = getBusinessStats(industryId);
  return Math.round((1 / stats.ticksPerSecond) * 1000);
}

export function getBaseUpgradeMetricsForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): BaseUpgradeMetrics {
  const stats = getBusinessStats(industryId);
  const metrics = getBusinessMetrics(industryId);
  return {
    monthlyExpenses: metrics.monthlyExpenses,
    spawnIntervalSeconds: stats.customerSpawnIntervalSeconds,
    serviceSpeedMultiplier: 1,
    exp: 0, // EXP starts at 0, modified by effects
    treatmentRooms: stats.treatmentRooms,
    // happyProbability removed - not used in game mechanics (customers happy/angry based on patience)
    serviceRevenueMultiplier: stats.serviceRevenueMultiplier ?? 1,
    serviceRevenueFlatBonus: 0,
    founderWorkingHours: getFounderWorkingHoursBase(industryId),
  };
}

export function getTicksPerSecondForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  return getBusinessStats(industryId).ticksPerSecond;
}

export function getRoundDurationSecondsForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number {
  return getBusinessStats(industryId).monthDurationSeconds;
}

export function getFounderWorkingHoursBase(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  return getBusinessMetrics(industryId).startingFreedomScore; // Previously: founderWorkHours
}

/**
 * Get starting time budget for an industry
 */
export function getStartingTime(industryId: IndustryId = DEFAULT_INDUSTRY_ID): number {
  return getBusinessMetrics(industryId).startingTime ?? 0;
}

export function getEventTriggerSecondsForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): number[] {
  const stats = getBusinessStats(industryId);
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
