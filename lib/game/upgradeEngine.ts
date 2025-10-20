import { UpgradeDefinition, UpgradeEffect, UpgradeMetric, UpgradeEffectType } from './config';

//TODO: This file is hardcoded the upgrades, if new upgrades added, we need to add them all manually


export interface MetricModifiers {
  add: number;
  percent: number;
  contributions: string[];
}

export interface UpgradeMetricsResult {
  baseMetrics: Record<UpgradeMetric, number>;
  currentMetrics: Record<UpgradeMetric, number>;
  contributionsList: Record<UpgradeMetric, string[]>;
  formulas: Record<UpgradeMetric, string>;
}

function createEmptyModifiers(): Record<UpgradeMetric, MetricModifiers> {
  return {
    [UpgradeMetric.WeeklyExpenses]: { add: 0, percent: 0, contributions: [] },
    [UpgradeMetric.SpawnIntervalSeconds]: { add: 0, percent: 0, contributions: [] },
    [UpgradeMetric.ServiceSpeedMultiplier]: { add: 0, percent: 0, contributions: [] },
    [UpgradeMetric.ReputationMultiplier]: { add: 0, percent: 0, contributions: [] },
    [UpgradeMetric.TreatmentRooms]: { add: 0, percent: 0, contributions: [] },
    [UpgradeMetric.HappyProbability]: { add: 0, percent: 0, contributions: [] },
  };
}

function formatContribution(effect: UpgradeEffect): string {
  if (effect.type === UpgradeEffectType.Add) {
    const sign = effect.value >= 0 ? '+' : '';
    return `${sign}${effect.value} (${effect.source})`;
  }

  const percent = Math.round(effect.value * 100);
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent}% (${effect.source})`;
}

function formatFormula(base: number, modifier: MetricModifiers): string {
  const addPart = modifier.add !== 0 ? ` ${modifier.add >= 0 ? '+' : '-'} ${Math.abs(modifier.add)}` : '';
  const percentFactor = modifier.percent !== 0 ? ` × ${(1 + modifier.percent).toFixed(2)}` : '';
  return `${base}${addPart}${percentFactor}`.trim();
}

export function calculateUpgradeMetrics(
  baseMetrics: Record<UpgradeMetric, number>,
  activeUpgrades: UpgradeDefinition[] = [],
): UpgradeMetricsResult {
  const modifiers = createEmptyModifiers();

  activeUpgrades.forEach((upgrade) => {
    upgrade.effects.forEach((effect) => {
      const metricModifier = modifiers[effect.metric];
      if (effect.type === UpgradeEffectType.Add) {
        metricModifier.add += effect.value;
      } else if (effect.type === UpgradeEffectType.Percent) {
        metricModifier.percent += effect.value;
      }
      metricModifier.contributions.push(formatContribution(effect));
    });
  });

  const currentMetrics: Record<UpgradeMetric, number> = { ...baseMetrics };
  const contributionsList: Record<UpgradeMetric, string[]> = {
    [UpgradeMetric.WeeklyExpenses]: [],
    [UpgradeMetric.SpawnIntervalSeconds]: [],
    [UpgradeMetric.ServiceSpeedMultiplier]: [],
    [UpgradeMetric.ReputationMultiplier]: [],
    [UpgradeMetric.TreatmentRooms]: [],
    [UpgradeMetric.HappyProbability]: [],
  };
  const formulas: Record<UpgradeMetric, string> = {
    [UpgradeMetric.WeeklyExpenses]: '',
    [UpgradeMetric.SpawnIntervalSeconds]: '',
    [UpgradeMetric.ServiceSpeedMultiplier]: '',
    [UpgradeMetric.ReputationMultiplier]: '',
    [UpgradeMetric.TreatmentRooms]: '',
    [UpgradeMetric.HappyProbability]: '',
  };

  (Object.keys(baseMetrics) as UpgradeMetric[]).forEach((metric) => {
    const baseValue = baseMetrics[metric];
    const modifier = modifiers[metric];
    const adjusted = baseValue + modifier.add;
    const multiplied = adjusted * (1 + modifier.percent);

    currentMetrics[metric] = multiplied;
    contributionsList[metric] = modifier.contributions;
    formulas[metric] = formatFormula(baseValue, modifier);
  });

  return { baseMetrics, currentMetrics, contributionsList, formulas };
}
