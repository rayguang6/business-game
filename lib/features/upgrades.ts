/**
 * Upgrades Feature
 * Simplified single-level upgrade calculations and helpers.
 */

import {
  DEFAULT_INDUSTRY_ID,
  BaseUpgradeMetrics,
  UpgradeDefinition,
  UpgradeId,
  getAllUpgrades,
  getUpgradeById,
  getBaseUpgradeMetricsForIndustry,
  secondsToTicks,
} from '@/lib/game/config';
import { Upgrades } from '@/lib/store/types';
import { IndustryId } from '@/lib/game/types';
import { applyUpgradeEffectsToMetrics, UpgradeLevelDefinition } from '@/lib/game/effects/upgradeEffects';

export type ActiveUpgradeIds = UpgradeId[]; // Legacy type for compatibility

export interface UpgradeEffects {
  spawnIntervalSeconds: number;
  spawnIntervalTicks: number;
  serviceSpeedMultiplier: number;
  reputationMultiplier: number;
  treatmentRooms: number;
  weeklyExpenses: number;
  happyProbability: number;
}

export interface UpgradeMetricsSummary {
  baseMetrics: BaseUpgradeMetrics;
  currentMetrics: BaseUpgradeMetrics;
}

function resolveActiveUpgrades(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeLevelDefinition[] {
  return Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .map(([id, level]) => {
      const definition = getUpgradeById(id as UpgradeId, industryId);
      if (!definition) {
        return null;
      }
      return { definition, level };
    })
    .filter((item): item is UpgradeLevelDefinition => item !== null);
}

export function calculateActiveUpgradeMetrics(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeMetricsSummary {
  const baseMetrics = getBaseUpgradeMetricsForIndustry(industryId);
  const activeUpgrades = resolveActiveUpgrades(upgrades, industryId);

  return {
    baseMetrics,
    currentMetrics: applyUpgradeEffectsToMetrics(baseMetrics, activeUpgrades),
  };
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
    happyProbability: Math.min(1, Math.max(0, currentMetrics.happyProbability)),
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
): UpgradeMetricsSummary {
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
