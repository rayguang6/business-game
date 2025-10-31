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
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { UpgradeLevelDefinition } from '@/lib/game/effects/upgradeEffects';

export type ActiveUpgradeIds = UpgradeId[]; // Legacy type for compatibility

export interface UpgradeEffects {
  spawnIntervalSeconds: number;
  spawnIntervalTicks: number;
  serviceSpeedMultiplier: number;
  reputationMultiplier: number;
  treatmentRooms: number;
  monthlyExpenses: number;
  happyProbability: number;
  serviceRevenueMultiplier: number;
  serviceRevenueFlatBonus: number;
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


export function getUpgradeEffects(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeEffects {
  const baseMetrics = getBaseUpgradeMetricsForIndustry(industryId);

  // Use effectManager for consistent calculation (includes all effects: upgrades, staff, etc.)
  const spawnIntervalSeconds = Math.max(0.5, effectManager.calculate(GameMetric.SpawnIntervalSeconds, baseMetrics.spawnIntervalSeconds));
  const spawnIntervalTicks = Math.max(1, secondsToTicks(spawnIntervalSeconds, industryId));

  return {
    spawnIntervalSeconds,
    spawnIntervalTicks,
    serviceSpeedMultiplier: Math.max(0.1, effectManager.calculate(GameMetric.ServiceSpeedMultiplier, baseMetrics.serviceSpeedMultiplier)),
    reputationMultiplier: Math.max(0, effectManager.calculate(GameMetric.ReputationMultiplier, baseMetrics.reputationMultiplier)),
    treatmentRooms: Math.max(1, Math.round(effectManager.calculate(GameMetric.ServiceRooms, baseMetrics.treatmentRooms))),
    monthlyExpenses: effectManager.calculate(GameMetric.MonthlyExpenses, baseMetrics.monthlyExpenses),
    happyProbability: Math.min(1, Math.max(0, effectManager.calculate(GameMetric.HappyProbability, baseMetrics.happyProbability))),
    serviceRevenueMultiplier: Math.max(0, effectManager.calculate(GameMetric.ServiceRevenueMultiplier, baseMetrics.serviceRevenueMultiplier)),
    serviceRevenueFlatBonus: effectManager.calculate(GameMetric.ServiceRevenueFlatBonus, baseMetrics.serviceRevenueFlatBonus),
    founderWorkingHours: Math.max(0, Math.round(effectManager.calculate(GameMetric.FounderWorkingHours, baseMetrics.founderWorkingHours))),
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
