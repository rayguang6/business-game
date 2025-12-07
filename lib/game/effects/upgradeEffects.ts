import { BaseUpgradeMetrics, UpgradeDefinition, UpgradeEffect } from '@/lib/game/types';
import {
  Effect,
  EffectType,
  GameMetric,
  MetricValues,
  applyEffectsToMetrics,
} from '@/lib/game/effectManager';

export interface UpgradeLevelDefinition {
  definition: UpgradeDefinition;
  level: number;
}

const toMetricValues = (base: BaseUpgradeMetrics): MetricValues => ({
  [GameMetric.Cash]: 0, // Not affected by upgrades
  [GameMetric.MyTime]: 0, // Not affected by upgrades
  [GameMetric.LeveragedTime]: 0, // Not affected by upgrades
  [GameMetric.GenerateLeads]: 0, // Not affected by upgrades
  [GameMetric.MonthlyExpenses]: base.monthlyExpenses,
  [GameMetric.LeadsPerMonth]: base.leadsPerMonth,
  [GameMetric.ServiceSpeedMultiplier]: base.serviceSpeedMultiplier,
  [GameMetric.Exp]: base.exp,
  [GameMetric.ServiceCapacity]: base.serviceCapacity,
  // [GameMetric.HappyProbability] removed - not used in game mechanics
  [GameMetric.ServiceRevenueMultiplier]: base.serviceRevenueMultiplier,
  [GameMetric.ServiceRevenueFlatBonus]: base.serviceRevenueFlatBonus,
  [GameMetric.FailureRate]: 0, // Default: no failure rate increase from upgrades
  [GameMetric.ConversionRate]: 0, // Default: no conversion rate change from upgrades
  [GameMetric.HighTierServiceRevenueMultiplier]: base.highTierServiceRevenueMultiplier || 1,
  [GameMetric.HighTierServiceWeightageMultiplier]: base.highTierServiceWeightageMultiplier || 1,
  [GameMetric.MidTierServiceRevenueMultiplier]: base.midTierServiceRevenueMultiplier || 1,
  [GameMetric.MidTierServiceWeightageMultiplier]: base.midTierServiceWeightageMultiplier || 1,
  [GameMetric.LowTierServiceRevenueMultiplier]: base.lowTierServiceRevenueMultiplier || 1,
  [GameMetric.LowTierServiceWeightageMultiplier]: base.lowTierServiceWeightageMultiplier || 1,
});

const fromMetricValues = (values: MetricValues): BaseUpgradeMetrics => ({
  monthlyExpenses: values[GameMetric.MonthlyExpenses],
  leadsPerMonth: values[GameMetric.LeadsPerMonth],
  serviceSpeedMultiplier: values[GameMetric.ServiceSpeedMultiplier],
  exp: values[GameMetric.Exp],
  serviceCapacity: values[GameMetric.ServiceCapacity],
  // happyProbability removed - not used in game mechanics
  serviceRevenueMultiplier: values[GameMetric.ServiceRevenueMultiplier],
  serviceRevenueFlatBonus: values[GameMetric.ServiceRevenueFlatBonus],
  highTierServiceRevenueMultiplier: values[GameMetric.HighTierServiceRevenueMultiplier],
  highTierServiceWeightageMultiplier: values[GameMetric.HighTierServiceWeightageMultiplier],
  midTierServiceRevenueMultiplier: values[GameMetric.MidTierServiceRevenueMultiplier],
  midTierServiceWeightageMultiplier: values[GameMetric.MidTierServiceWeightageMultiplier],
  lowTierServiceRevenueMultiplier: values[GameMetric.LowTierServiceRevenueMultiplier],
  lowTierServiceWeightageMultiplier: values[GameMetric.LowTierServiceWeightageMultiplier],
});

const scaleUpgradeEffectValue = (effect: UpgradeEffect, level: number): number => {
  switch (effect.type) {
    case EffectType.Add:
    case EffectType.Percent:
      return effect.value * level;
    case EffectType.Multiply:
      return Math.pow(effect.value, level);
    case EffectType.Set:
      return effect.value;
    default:
      return effect.value;
  }
};

export const createUpgradeEffects = (
  definition: UpgradeDefinition,
  level: number,
): Effect[] => {
  const levelConfig = definition.levels.find(l => l.level === level);
  if (!levelConfig) {
    return [];
  }
  return levelConfig.effects.map((effect: UpgradeEffect, index: number) => ({
    id: `upgrade_${definition.id}_preview_${index}`,
    source: {
      category: 'upgrade',
      id: definition.id,
      name: definition.name,
    },
    metric: effect.metric,
    type: effect.type,
    value: scaleUpgradeEffectValue(effect, level),
    createdAt: Date.now() / 1000, // Convert to seconds to match game time
  }));
};

export const applyUpgradeEffectsToMetrics = (
  baseMetrics: BaseUpgradeMetrics,
  upgrades: UpgradeLevelDefinition[],
): BaseUpgradeMetrics => {
  if (upgrades.length === 0) {
    return baseMetrics;
  }

  const baseValues = toMetricValues(baseMetrics);
  const effects: Effect[] = upgrades.flatMap(({ definition, level }) =>
    createUpgradeEffects(definition, level),
  );
  const updated = applyEffectsToMetrics(baseValues, effects);
  return fromMetricValues(updated);
};
