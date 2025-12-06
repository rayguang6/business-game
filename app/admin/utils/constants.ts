import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { getMetricDefinition } from '@/lib/game/metrics/registry';

export const METRIC_OPTIONS: { value: GameMetric; label: string }[] = [
  { value: GameMetric.Cash, label: getMetricDefinition(GameMetric.Cash).displayLabel },
  { value: GameMetric.Time, label: getMetricDefinition(GameMetric.Time).displayLabel },
  { value: GameMetric.MonthlyTimeCapacity, label: getMetricDefinition(GameMetric.MonthlyTimeCapacity).displayLabel },
  { value: GameMetric.Exp, label: getMetricDefinition(GameMetric.Exp).displayLabel },
  { value: GameMetric.FreedomScore, label: getMetricDefinition(GameMetric.FreedomScore).displayLabel },
  { value: GameMetric.FailureRate, label: getMetricDefinition(GameMetric.FailureRate).displayLabel },
  { value: GameMetric.GenerateLeads, label: getMetricDefinition(GameMetric.GenerateLeads).displayLabel },
  { value: GameMetric.ConversionRate, label: getMetricDefinition(GameMetric.ConversionRate).displayLabel },
  { value: GameMetric.ServiceCapacity, label: getMetricDefinition(GameMetric.ServiceCapacity).displayLabel },
  { value: GameMetric.MonthlyExpenses, label: getMetricDefinition(GameMetric.MonthlyExpenses).displayLabel },
  { value: GameMetric.ServiceSpeedMultiplier, label: getMetricDefinition(GameMetric.ServiceSpeedMultiplier).displayLabel },
  { value: GameMetric.SpawnIntervalSeconds, label: getMetricDefinition(GameMetric.SpawnIntervalSeconds).displayLabel },
  { value: GameMetric.ServiceRevenueFlatBonus, label: getMetricDefinition(GameMetric.ServiceRevenueFlatBonus).displayLabel },
  { value: GameMetric.ServiceRevenueMultiplier, label: getMetricDefinition(GameMetric.ServiceRevenueMultiplier).displayLabel },
  { value: GameMetric.HighTierServiceRevenueMultiplier, label: getMetricDefinition(GameMetric.HighTierServiceRevenueMultiplier).displayLabel },
  { value: GameMetric.HighTierServiceWeightageMultiplier, label: getMetricDefinition(GameMetric.HighTierServiceWeightageMultiplier).displayLabel },
  { value: GameMetric.MidTierServiceRevenueMultiplier, label: getMetricDefinition(GameMetric.MidTierServiceRevenueMultiplier).displayLabel },
  { value: GameMetric.MidTierServiceWeightageMultiplier, label: getMetricDefinition(GameMetric.MidTierServiceWeightageMultiplier).displayLabel },
  { value: GameMetric.LowTierServiceRevenueMultiplier, label: getMetricDefinition(GameMetric.LowTierServiceRevenueMultiplier).displayLabel },
  { value: GameMetric.LowTierServiceWeightageMultiplier, label: getMetricDefinition(GameMetric.LowTierServiceWeightageMultiplier).displayLabel },
];

export const EFFECT_TYPE_OPTIONS: { value: EffectType; label: string; hint: string }[] = [
  { value: EffectType.Add, label: 'Add (flat)', hint: 'Add or subtract a flat amount, e.g. +1 room or +100 revenue' },
  { value: EffectType.Percent, label: 'Percent (%)', hint: 'Increase/decrease by percentage, e.g. +15% speed' },
  { value: EffectType.Multiply, label: 'Multiply (×)', hint: 'Multiply the value, e.g. ×1.5 for 50% boost' },
  { value: EffectType.Set, label: 'Set (=)', hint: 'Force a value to a number, overwrites others' },
];
