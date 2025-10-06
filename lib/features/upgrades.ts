/**
 * Upgrades Feature
 * Simplified single-level upgrade calculations and helpers.
 */

import { BASE_UPGRADE_METRICS, UpgradeDefinition, UpgradeId, getAllUpgrades, getUpgradeById, UpgradeEffect } from '@/lib/game/config';
import { calculateUpgradeMetrics, UpgradeMetricsResult } from '@/lib/game/upgradeEngine';
import { secondsToTicks } from '@/lib/game/config';
import { Upgrades } from '@/lib/store/types';

export type ActiveUpgradeIds = UpgradeId[]; // Legacy type for compatibility

export interface UpgradeEffects {
  spawnIntervalSeconds: number;
  spawnIntervalTicks: number;
  serviceSpeedMultiplier: number;
  reputationMultiplier: number;
  treatmentRooms: number;
  weeklyExpenses: number;
}

interface UpgradeWithLevel {
  definition: UpgradeDefinition;
  level: number;
}

function resolveActiveUpgrades(upgrades: Upgrades): UpgradeWithLevel[] {
  return Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .map(([id, level]) => ({
      definition: getUpgradeById(id as UpgradeId),
      level,
    }))
    .filter((item): item is UpgradeWithLevel => Boolean(item.definition));
}

export function calculateActiveUpgradeMetrics(upgrades: Upgrades): UpgradeMetricsResult {
  const activeUpgrades = resolveActiveUpgrades(upgrades);
  // Expand upgrades by their levels with multiplied effects
  const expandedUpgrades = activeUpgrades.flatMap(({ definition, level }) => {
    const leveledEffects: UpgradeEffect[] = definition.effects.map(effect => ({
      ...effect,
      value: effect.value * level,
    }));
    return { ...definition, effects: leveledEffects };
  });
  return calculateUpgradeMetrics(BASE_UPGRADE_METRICS, expandedUpgrades);
}

export function getUpgradeEffects(upgrades: Upgrades): UpgradeEffects {
  const { currentMetrics } = calculateActiveUpgradeMetrics(upgrades);

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

export function getEffectiveSpawnInterval(upgrades: Upgrades): number {
  return getUpgradeEffects(upgrades).spawnIntervalTicks;
}

export function getEffectiveServiceSpeedMultiplier(upgrades: Upgrades): number {
  return getUpgradeEffects(upgrades).serviceSpeedMultiplier;
}

export function getEffectiveReputationMultiplier(upgrades: Upgrades): number {
  return getUpgradeEffects(upgrades).reputationMultiplier;
}

export function getEffectiveTreatmentRooms(upgrades: Upgrades): number {
  return getUpgradeEffects(upgrades).treatmentRooms;
}

export function shouldSpawnCustomerWithUpgrades(
  gameTick: number,
  upgrades: Upgrades,
  effects?: UpgradeEffects,
): boolean {
  const upgradeEffects = effects ?? getUpgradeEffects(upgrades);
  return upgradeEffects.spawnIntervalTicks > 0 && gameTick % upgradeEffects.spawnIntervalTicks === 0;
}

export function getUpgradeCatalog(): UpgradeDefinition[] {
  return getAllUpgrades();
}

export function getUpgradeSummary(upgrades: Upgrades) {
  return calculateActiveUpgradeMetrics(upgrades);
}

export function getUpgradeLevel(upgrades: Upgrades, upgradeId: UpgradeId): number {
  return upgrades[upgradeId] || 0;
}

export function canUpgradeMore(upgrades: Upgrades, upgradeId: UpgradeId): boolean {
  const upgrade = getUpgradeById(upgradeId);
  if (!upgrade) return false;
  const currentLevel = getUpgradeLevel(upgrades, upgradeId);
  return currentLevel < upgrade.maxLevel;
}
