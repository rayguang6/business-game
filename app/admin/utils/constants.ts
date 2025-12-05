import { GameMetric, EffectType } from '@/lib/game/effectManager';

export const METRIC_OPTIONS: { value: GameMetric; label: string }[] = [
  { value: GameMetric.Cash, label: 'Cash' },
  { value: GameMetric.Time, label: 'Available Time' },
  { value: GameMetric.MonthlyTimeCapacity, label: 'Monthly Time Capacity' },
  { value: GameMetric.Exp, label: 'EXP' },
  { value: GameMetric.FreedomScore, label: 'Freedom Score' },
  { value: GameMetric.FailureRate, label: 'Failure Rate (%)' },
  { value: GameMetric.GenerateLeads, label: 'Generate Leads (immediate)' },
  { value: GameMetric.ConversionRate, label: 'Lead Conversion Rate' },
  { value: GameMetric.ServiceCapacity, label: 'Service Capacity' },
  { value: GameMetric.MonthlyExpenses, label: 'Monthly Expenses' },
  { value: GameMetric.ServiceSpeedMultiplier, label: 'Service Speed Multiplier' },
  { value: GameMetric.SpawnIntervalSeconds, label: 'Spawn Interval (seconds)' },
  { value: GameMetric.ServiceRevenueFlatBonus, label: 'Service Revenue (flat bonus)' },
  { value: GameMetric.ServiceRevenueMultiplier, label: 'Service Revenue Multiplier' },
  { value: GameMetric.HighTierServiceRevenueMultiplier, label: 'High-Tier Service Revenue Multiplier' },
  { value: GameMetric.HighTierServiceWeightageMultiplier, label: 'High-Tier Service Weightage Multiplier' },
  { value: GameMetric.MidTierServiceRevenueMultiplier, label: 'Mid-Tier Service Revenue Multiplier' },
  { value: GameMetric.MidTierServiceWeightageMultiplier, label: 'Mid-Tier Service Weightage Multiplier' },
  { value: GameMetric.LowTierServiceRevenueMultiplier, label: 'Low-Tier Service Revenue Multiplier' },
  { value: GameMetric.LowTierServiceWeightageMultiplier, label: 'Low-Tier Service Weightage Multiplier' },
];

export const EFFECT_TYPE_OPTIONS: { value: EffectType; label: string; hint: string }[] = [
  { value: EffectType.Add, label: 'Add (flat)', hint: 'Add or subtract a flat amount, e.g. +1 room or +100 revenue' },
  { value: EffectType.Percent, label: 'Percent (%)', hint: 'Increase/decrease by percentage, e.g. +15% speed' },
  { value: EffectType.Multiply, label: 'Multiply (×)', hint: 'Multiply the value, e.g. ×1.5 for 50% boost' },
  { value: EffectType.Set, label: 'Set (=)', hint: 'Force a value to a number, overwrites others' },
];
