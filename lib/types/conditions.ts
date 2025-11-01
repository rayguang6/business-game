// Simple condition operators for metrics
export type ConditionOperator = 'greater' | 'less' | 'equals' | 'greater_equal' | 'less_equal';

// Simple metric types for conditions (subset of game metrics)
//TODO: later should direct use from global enum
export enum ConditionMetric {
  Cash = 'cash',
  Reputation = 'reputation',
  Expenses = 'expenses',
  GameTime = 'gameTime',
  FounderWorkingHours = 'founderWorkingHours',
}

// Metric-based condition (simplified version)
export interface GameCondition {
  id: string;
  name: string;
  description: string;
  metric: ConditionMetric;
  operator: ConditionOperator;
  value: number;
}

// For backwards compatibility with future expansion
export type ConditionType = 'metric';

// Type guards
export function isMetricCondition(condition: GameCondition): boolean {
  return Boolean(condition.metric);
}
