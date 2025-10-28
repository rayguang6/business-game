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
  [GameMetric.MonthlyExpenses]: base.monthlyExpenses,
  [GameMetric.SpawnIntervalSeconds]: base.spawnIntervalSeconds,
  [GameMetric.ServiceSpeedMultiplier]: base.serviceSpeedMultiplier,
  [GameMetric.ReputationMultiplier]: base.reputationMultiplier,
  [GameMetric.ServiceRooms]: base.treatmentRooms,
  [GameMetric.HappyProbability]: base.happyProbability,
  [GameMetric.ServiceRevenueMultiplier]: base.serviceRevenueMultiplier,
  [GameMetric.ServiceRevenueFlatBonus]: base.serviceRevenueFlatBonus,
});

const fromMetricValues = (values: MetricValues): BaseUpgradeMetrics => ({
  monthlyExpenses: values[GameMetric.MonthlyExpenses],
  spawnIntervalSeconds: values[GameMetric.SpawnIntervalSeconds],
  serviceSpeedMultiplier: values[GameMetric.ServiceSpeedMultiplier],
  reputationMultiplier: values[GameMetric.ReputationMultiplier],
  treatmentRooms: values[GameMetric.ServiceRooms],
  happyProbability: values[GameMetric.HappyProbability],
  serviceRevenueMultiplier: values[GameMetric.ServiceRevenueMultiplier],
  serviceRevenueFlatBonus: values[GameMetric.ServiceRevenueFlatBonus],
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
  return definition.effects.map((effect, index) => ({
    id: `upgrade_${definition.id}_preview_${index}`,
    source: {
      category: 'upgrade',
      id: definition.id,
      name: definition.name,
    },
    metric: effect.metric,
    type: effect.type,
    value: scaleUpgradeEffectValue(effect, level),
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
