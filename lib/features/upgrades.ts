/**
 * Upgrades Feature
 * Simplified single-level upgrade calculations and helpers.
 */

import { BASE_UPGRADE_METRICS, UpgradeDefinition, UpgradeId, getAllUpgrades, getUpgradeById } from '@/lib/game/config';
import { calculateUpgradeMetrics, UpgradeMetricsResult } from '@/lib/game/upgradeEngine';
import { secondsToTicks } from '@/lib/game/config';

export type ActiveUpgradeIds = UpgradeId[];

export interface UpgradeEffects {
  spawnIntervalSeconds: number;
  spawnIntervalTicks: number;
  serviceSpeedMultiplier: number;
  reputationMultiplier: number;
  treatmentRooms: number;
  weeklyExpenses: number;
}

function resolveActiveUpgrades(activeIds: ActiveUpgradeIds): UpgradeDefinition[] {
  return activeIds
    .map((id) => getUpgradeById(id))
    .filter((upgrade): upgrade is UpgradeDefinition => Boolean(upgrade));
}

export function calculateActiveUpgradeMetrics(activeIds: ActiveUpgradeIds): UpgradeMetricsResult {
  const activeUpgrades = resolveActiveUpgrades(activeIds);
  return calculateUpgradeMetrics(BASE_UPGRADE_METRICS, activeUpgrades);
}

export function getUpgradeEffects(activeIds: ActiveUpgradeIds): UpgradeEffects {
  const { currentMetrics } = calculateActiveUpgradeMetrics(activeIds);

  const spawnIntervalSeconds = Math.max(0.5, currentMetrics.spawnIntervalSeconds);
  const spawnIntervalTicks = Math.max(1, secondsToTicks(spawnIntervalSeconds));

  return {
    spawnIntervalSeconds,
    spawnIntervalTicks,
    serviceSpeedMultiplier: Math.max(0.1, currentMetrics.serviceSpeedMultiplier),
    reputationMultiplier: Math.max(0, currentMetrics.reputationMultiplier),
    treatmentRooms: Math.max(1, Math.round(currentMetrics.treatmentRooms)),
    weeklyExpenses: currentMetrics.weeklyExpenses,
  };
}

export function getEffectiveSpawnInterval(activeIds: ActiveUpgradeIds): number {
  return getUpgradeEffects(activeIds).spawnIntervalTicks;
}

export function getEffectiveServiceSpeedMultiplier(activeIds: ActiveUpgradeIds): number {
  return getUpgradeEffects(activeIds).serviceSpeedMultiplier;
}

export function getEffectiveReputationMultiplier(activeIds: ActiveUpgradeIds): number {
  return getUpgradeEffects(activeIds).reputationMultiplier;
}

export function getEffectiveTreatmentRooms(activeIds: ActiveUpgradeIds): number {
  return getUpgradeEffects(activeIds).treatmentRooms;
}

export function shouldSpawnCustomerWithUpgrades(
  gameTick: number,
  activeIds: ActiveUpgradeIds,
  effects?: UpgradeEffects,
): boolean {
  const upgradeEffects = effects ?? getUpgradeEffects(activeIds);
  return upgradeEffects.spawnIntervalTicks > 0 && gameTick % upgradeEffects.spawnIntervalTicks === 0;
}

export function getUpgradeCatalog(): UpgradeDefinition[] {
  return getAllUpgrades();
}

export function getUpgradeSummary(activeIds: ActiveUpgradeIds) {
  return calculateActiveUpgradeMetrics(activeIds);
}
