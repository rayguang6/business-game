import { getIndustrySimulationConfig, getAllSimulationConfigs } from './industryConfigs';
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
  DEFAULT_INDUSTRY_ID,
} from './types';

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

export function getSimulationConfig(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustrySimulationConfig {
  return getIndustrySimulationConfig(industryId);
}

export function getBusinessMetrics(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).businessMetrics;
}

export function getBusinessStats(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).businessStats;
}

export function getMapConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).map;
}

export function getMovementConfigForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).movement;
}

export function getLayoutConfig(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).layout;
}

export function getServicesForIndustry(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): IndustryServiceDefinition[] {
  const config = getSimulationConfig(industryId);
  return config.services.map((service) => ({ ...service }));
}

export function getUpgradesForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).upgrades;
}

export function getEventsForIndustry(industryId: IndustryId = DEFAULT_INDUSTRY_ID) {
  return getSimulationConfig(industryId).events;
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

export function getAllSimulationConfigsList(): IndustrySimulationConfig[] {
  return getAllSimulationConfigs();
}

export function getUpgradeById(
  id: UpgradeId,
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): UpgradeDefinition | undefined {
  return getUpgradesForIndustry(industryId).find((upgrade) => upgrade.id === id);
}

export function getAllUpgrades(industryId: IndustryId = DEFAULT_INDUSTRY_ID): UpgradeDefinition[] {
  return getUpgradesForIndustry(industryId).map((upgrade) => ({
    ...upgrade,
    effects: upgrade.effects.map((effect) => ({ ...effect })),
  }));
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
