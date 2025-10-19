/**
 * Upgrades Feature
 * Simplified single-level upgrade calculations and helpers.
 */

import {
  DEFAULT_INDUSTRY_ID,
  UpgradeDefinition,
  UpgradeId,
  getAllUpgrades,
  getUpgradeById,
  getBaseUpgradeMetricsForIndustry,
  UpgradeEffect,
  secondsToTicks,
} from '@/lib/game/config';
import { calculateUpgradeMetrics, UpgradeMetricsResult } from '@/lib/game/upgradeEngine';
import { Upgrades } from '@/lib/store/types';
import { IndustryId } from '@/lib/game/types';

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

function resolveActiveUpgrades(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeWithLevel[] {
  return Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .map(([id, level]) => ({
      definition: getUpgradeById(id as UpgradeId, industryId),
      level,
    }))
    .filter((item): item is UpgradeWithLevel => Boolean(item.definition));
}

export function calculateActiveUpgradeMetrics(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeMetricsResult {
  const activeUpgrades = resolveActiveUpgrades(upgrades, industryId);
  // Expand upgrades by their levels with multiplied effects
  const expandedUpgrades = activeUpgrades.flatMap(({ definition, level }) => {
    const leveledEffects: UpgradeEffect[] = definition.effects.map(effect => ({
      ...effect,
      value: effect.value * level,
    }));
    return { ...definition, effects: leveledEffects };
  });
  const baseMetrics = getBaseUpgradeMetricsForIndustry(industryId);
  return calculateUpgradeMetrics(baseMetrics, expandedUpgrades);
}

export function getUpgradeEffects(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeEffects {
  const { currentMetrics } = calculateActiveUpgradeMetrics(upgrades, industryId);

  const spawnIntervalSeconds = Math.max(0.5, currentMetrics.spawnIntervalSeconds);
  const spawnIntervalTicks = Math.max(1, secondsToTicks(spawnIntervalSeconds, industryId));

  return {
    spawnIntervalSeconds,
    spawnIntervalTicks,
    serviceSpeedMultiplier: Math.max(0.1, currentMetrics.serviceSpeedMultiplier),
    reputationMultiplier: Math.max(0, currentMetrics.reputationMultiplier),
    treatmentRooms: Math.max(1, Math.round(currentMetrics.treatmentRooms)),
    weeklyExpenses: currentMetrics.weeklyExpenses,
  };
}

export function getEffectiveSpawnInterval(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  return getUpgradeEffects(upgrades, industryId).spawnIntervalTicks;
}

export function getEffectiveServiceSpeedMultiplier(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  return getUpgradeEffects(upgrades, industryId).serviceSpeedMultiplier;
}

export function getEffectiveReputationMultiplier(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  return getUpgradeEffects(upgrades, industryId).reputationMultiplier;
}

export function getEffectiveTreatmentRooms(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  return getUpgradeEffects(upgrades, industryId).treatmentRooms;
}

export function shouldSpawnCustomerWithUpgrades(
  gameTick: number,
  upgrades: Upgrades,
  industryId: IndustryId,
  effects?: UpgradeEffects,
): boolean {
  const upgradeEffects = effects ?? getUpgradeEffects(upgrades, industryId);
  return upgradeEffects.spawnIntervalTicks > 0 && gameTick % upgradeEffects.spawnIntervalTicks === 0;
}

export function getUpgradeCatalog(industryId: IndustryId): UpgradeDefinition[] {
  return getAllUpgrades(industryId);
}

export function getUpgradeSummary(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeMetricsResult {
  return calculateActiveUpgradeMetrics(upgrades, industryId);
}

export function getUpgradeLevel(upgrades: Upgrades, upgradeId: UpgradeId): number {
  return upgrades[upgradeId] || 0;
}

export function canUpgradeMore(
  upgrades: Upgrades,
  upgradeId: UpgradeId,
  industryId: IndustryId,
): boolean {
  const upgrade = getUpgradeById(upgradeId, industryId);
  if (!upgrade) return false;
  const currentLevel = getUpgradeLevel(upgrades, upgradeId);
  return currentLevel < upgrade.maxLevel;
}
