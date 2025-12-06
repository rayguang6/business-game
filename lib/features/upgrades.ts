/**
 * Upgrades Feature
 * Simplified single-level upgrade calculations and helpers.
 */

import {
  DEFAULT_INDUSTRY_ID,
  BaseUpgradeMetrics,
  UpgradeDefinition,
  UpgradeId,
  getUpgradesForIndustry,
  getBaseUpgradeMetricsForIndustry,
  getBusinessStats,
  secondsToTicks,
} from '@/lib/game/config';
import { Upgrades } from '@/lib/store/types';
import { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { UpgradeLevelDefinition } from '@/lib/game/effects/upgradeEffects';

export type ActiveUpgradeIds = UpgradeId[]; // Legacy type for compatibility

export interface UpgradeEffects {
  leadsPerMonth: number; // Leads per month (from config + effects)
  spawnIntervalSeconds: number; // Computed: monthDurationSeconds / leadsPerMonth
  spawnIntervalTicks: number; // Computed: spawnIntervalSeconds * ticksPerSecond
  serviceSpeedMultiplier: number;
  exp: number; // Direct exp (effects modify this directly)
  serviceCapacity: number;
  monthlyExpenses: number;
  // happyProbability removed - not used in game mechanics
  serviceRevenueMultiplier: number;
  serviceRevenueFlatBonus: number;
  // Tier-specific service modifiers (defaults to 1 if not specified)
  highTierServiceRevenueMultiplier?: number;
  highTierServiceWeightageMultiplier?: number;
  midTierServiceRevenueMultiplier?: number;
  midTierServiceWeightageMultiplier?: number;
  lowTierServiceRevenueMultiplier?: number;
  lowTierServiceWeightageMultiplier?: number;
}


function resolveActiveUpgrades(
  upgrades: Upgrades,
  industryId: IndustryId,
): UpgradeLevelDefinition[] {
  const definitions = getUpgradesForIndustry(industryId);
  const definitionMap = new Map(definitions.map((upgrade) => [upgrade.id, upgrade]));
  return Object.entries(upgrades)
    .filter(([_, level]) => level > 0)
    .map(([id, level]) => {
      const definition = definitionMap.get(id as UpgradeId);
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
  const stats = getBusinessStats(industryId);
  if (!stats) throw new Error('Business stats not loaded');

  // Use effectManager for consistent calculation (includes all effects: upgrades, staff, etc.)
  const leadsPerMonth = Math.max(1, Math.round(effectManager.calculate(GameMetric.LeadsPerMonth, baseMetrics.leadsPerMonth)));
  
  // Calculate spawnIntervalSeconds from leadsPerMonth and monthDurationSeconds
  // Formula: spawnIntervalSeconds = monthDurationSeconds / leadsPerMonth
  // Example: 60s month / 1 lead = 60s per lead
  // Example: 60s month / 2 leads = 30s per lead
  const monthDurationSeconds = stats.monthDurationSeconds;
  const spawnIntervalSeconds = monthDurationSeconds > 0 && leadsPerMonth > 0
    ? monthDurationSeconds / leadsPerMonth
    : monthDurationSeconds; // If no leads, use month duration as fallback (no spawning)
  const spawnIntervalTicks = Math.max(1, secondsToTicks(spawnIntervalSeconds, industryId));

  return {
    leadsPerMonth,
    spawnIntervalSeconds,
    spawnIntervalTicks,
    serviceSpeedMultiplier: Math.max(0.1, effectManager.calculate(GameMetric.ServiceSpeedMultiplier, baseMetrics.serviceSpeedMultiplier)),
    exp: baseMetrics.exp, // Exp is modified directly, not calculated here
    serviceCapacity: Math.max(1, Math.round(effectManager.calculate(GameMetric.ServiceCapacity, baseMetrics.serviceCapacity))),
    monthlyExpenses: effectManager.calculate(GameMetric.MonthlyExpenses, baseMetrics.monthlyExpenses),
    // happyProbability removed - not used in game mechanics
    serviceRevenueMultiplier: Math.max(0, effectManager.calculate(GameMetric.ServiceRevenueMultiplier, baseMetrics.serviceRevenueMultiplier)),
    serviceRevenueFlatBonus: effectManager.calculate(GameMetric.ServiceRevenueFlatBonus, baseMetrics.serviceRevenueFlatBonus),
    // Tier-specific service modifiers
    highTierServiceRevenueMultiplier: effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, baseMetrics.highTierServiceRevenueMultiplier || 1),
    highTierServiceWeightageMultiplier: effectManager.calculate(GameMetric.HighTierServiceWeightageMultiplier, baseMetrics.highTierServiceWeightageMultiplier || 1),
    midTierServiceRevenueMultiplier: effectManager.calculate(GameMetric.MidTierServiceRevenueMultiplier, baseMetrics.midTierServiceRevenueMultiplier || 1),
    midTierServiceWeightageMultiplier: effectManager.calculate(GameMetric.MidTierServiceWeightageMultiplier, baseMetrics.midTierServiceWeightageMultiplier || 1),
    lowTierServiceRevenueMultiplier: effectManager.calculate(GameMetric.LowTierServiceRevenueMultiplier, baseMetrics.lowTierServiceRevenueMultiplier || 1),
    lowTierServiceWeightageMultiplier: effectManager.calculate(GameMetric.LowTierServiceWeightageMultiplier, baseMetrics.lowTierServiceWeightageMultiplier || 1),
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

export function getEffectiveExp(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  return getUpgradeEffects(upgrades, industryId).exp;
}

export function getEffectiveServiceCapacity(
  upgrades: Upgrades,
  industryId: IndustryId,
): number {
  return getUpgradeEffects(upgrades, industryId).serviceCapacity;
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

export function getUpgradeLevel(upgrades: Upgrades, upgradeId: UpgradeId): number {
  return upgrades[upgradeId] || 0;
}

export function canUpgradeMore(
  upgrades: Upgrades,
  upgradeId: UpgradeId,
  industryId: IndustryId,
): boolean {
  const upgrade = getUpgradesForIndustry(industryId).find((item) => item.id === upgradeId);
  if (!upgrade) return false;
  const currentLevel = getUpgradeLevel(upgrades, upgradeId);
  return currentLevel < upgrade.maxLevel;
}
