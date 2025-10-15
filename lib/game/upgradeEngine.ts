import { BASE_UPGRADE_METRICS, UpgradeDefinition, UpgradeEffect, UpgradeMetric } from './config';

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
    weeklyExpenses: { add: 0, percent: 0, contributions: [] },
    spawnIntervalSeconds: { add: 0, percent: 0, contributions: [] },
    serviceSpeedMultiplier: { add: 0, percent: 0, contributions: [] },
    reputationMultiplier: { add: 0, percent: 0, contributions: [] },
    treatmentRooms: { add: 0, percent: 0, contributions: [] },
  };
}

function formatContribution(effect: UpgradeEffect): string {
  if (effect.type === 'add') {
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
  baseMetrics: Record<UpgradeMetric, number> = BASE_UPGRADE_METRICS,
  activeUpgrades: UpgradeDefinition[] = [],
): UpgradeMetricsResult {
  const modifiers = createEmptyModifiers();

  activeUpgrades.forEach((upgrade) => {
    upgrade.effects.forEach((effect) => {
      const metricModifier = modifiers[effect.metric];
      if (effect.type === 'add') {
        metricModifier.add += effect.value;
      } else if (effect.type === 'percent') {
        metricModifier.percent += effect.value;
      }
      metricModifier.contributions.push(formatContribution(effect));
    });
  });

  const currentMetrics: Record<UpgradeMetric, number> = { ...baseMetrics };
  const contributionsList: Record<UpgradeMetric, string[]> = {
    weeklyExpenses: [],
    spawnIntervalSeconds: [],
    serviceSpeedMultiplier: [],
    reputationMultiplier: [],
    treatmentRooms: [],
  };
  const formulas: Record<UpgradeMetric, string> = {
    weeklyExpenses: '',
    spawnIntervalSeconds: '',
    serviceSpeedMultiplier: '',
    reputationMultiplier: '',
    treatmentRooms: '',
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
