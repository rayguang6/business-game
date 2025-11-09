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
  const override = getGlobalConfigOverride()?.businessMetrics;
  if (override) {
    return { ...override };
  }
  return { ...getSimulationConfig(industryId).businessMetrics };
}

export function getBusinessStats(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const override = getGlobalConfigOverride()?.businessStats;
  if (override) {
    return { ...override };
  }
  return { ...getSimulationConfig(industryId).businessStats };
}

export function getMapConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).map;
}

export function getMovementConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).movement;
}

export function getGlobalMovementConfig(): MovementConfig {
  const global = getGlobalConfigOverride()?.movement;
  if (global) {
    return { ...global };
  }
  return { ...getMovementConfigForIndustry(DEFAULT_INDUSTRY_ID) };
}

export function getLayoutConfig(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  const config = getSimulationConfig(industryId);
  const baseLayout = cloneLayout(config.layout);
  const override = getIndustryOverride(industryId)?.layout;
  if (override) {
    return mergeLayout(baseLayout, override);
  }
  return baseLayout;
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

export function getCustomerImagesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).customerImages;
}

export function getDefaultCustomerImageForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).defaultCustomerImage;
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
    reputationMultiplier: 1,
    treatmentRooms: stats.treatmentRooms,
    happyProbability: stats.baseHappyProbability,
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
  return getBusinessMetrics(industryId).founderWorkHours;
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
