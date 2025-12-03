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
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  const industryMetrics = industryConfig?.businessMetrics;
  
  // Get global config as base
  const globalConfig = getGlobalConfigOverride();
  const globalMetrics = globalConfig?.businessMetrics;
  
  // Merge: industry-specific overrides global
  if (industryMetrics && globalMetrics) {
    return { ...globalMetrics, ...industryMetrics };
  }
  
  if (industryMetrics) {
    return industryMetrics;
  }
  
  if (globalMetrics) {
    return globalMetrics;
  }
  
  // Data not loaded - return null (should be caught at load time)
  return null;
}

export function getBusinessStats(industryId: IndustryId = DEFAULT_INDUSTRY_ID): BusinessStats | null {
  // Check industry-specific override first
  const industryConfig = getIndustryOverride(industryId);
  const industryStats = industryConfig?.businessStats;
  
  // Get global config as base
  const globalConfig = getGlobalConfigOverride();
  const globalStats = globalConfig?.businessStats;
  
  // Merge: industry-specific overrides global
  if (industryStats && globalStats) {
    const merged = { ...globalStats, ...industryStats };
    // If industry config doesn't have eventTriggerSeconds or it's empty, use global
    if (!merged.eventTriggerSeconds || merged.eventTriggerSeconds.length === 0) {
      if (globalStats.eventTriggerSeconds && globalStats.eventTriggerSeconds.length > 0) {
        merged.eventTriggerSeconds = [...globalStats.eventTriggerSeconds];
      }
    }
    return merged;
  }
  
  if (industryStats) {
    return industryStats;
  }
  
  if (globalStats) {
    return globalStats;
  }
  
  // Data not loaded - return null (should be caught at load time)
  return null;
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
  
  // No map config found - return undefined (optional config)
  return undefined;
}

export function getMovementConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID): MovementConfig | null {
  const industryConfig = getIndustryOverride(industryId);
  if (industryConfig?.movement) {
    return { ...industryConfig.movement };
  }
  
  const globalConfig = getGlobalConfigOverride();
  if (globalConfig?.movement) {
    return { ...globalConfig.movement };
  }
  
  // Data not loaded - return null (should be caught at load time)
  return null;
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
  
  // Data not loaded - return null (should be caught at load time)
  return null;
}

export function getLoseCondition(industryId?: IndustryId): LoseCondition | null {
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
  
  // Data not loaded - return null (should be caught at load time)
  return null;
}

export function getLayoutConfig(industryId: IndustryId = DEFAULT_INDUSTRY_ID): SimulationLayoutConfig | null {
  // Check industry-specific config only (no global fallback)
  // The layout is resolved during loadIndustryContent which fetches from DB
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
  
  // No customer images found - return empty array (will cause issues, but that's correct - data must be in DB)
  console.warn(`[Config] Customer images not found for industry ${industryId}. Please configure in database.`);
  return [];
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
  
  // No staff name pool found - return empty array (will cause issues if staff are created, but that's correct)
  console.warn(`[Config] Staff name pool not found for industry ${industryId}. Please configure in database.`);
  return [];
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
 * Get starting time budget for an industry
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
