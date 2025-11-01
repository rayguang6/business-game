import { GameCondition, ConditionMetric } from '@/lib/types/conditions';
import { GameStore } from '@/lib/store/gameStore';

/**
 * Evaluates a single metric condition against the current game state
 */
export function evaluateCondition(condition: GameCondition, store: GameStore): boolean {
  const metricValue = getMetricValue(condition.metric, store);

  switch (condition.operator) {
    case 'greater':
      return metricValue > condition.value;
    case 'less':
      return metricValue < condition.value;
    case 'equals':
      return metricValue === condition.value;
    case 'greater_equal':
      return metricValue >= condition.value;
    case 'less_equal':
      return metricValue <= condition.value;
    default:
      console.warn(`[Condition System] Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluates multiple conditions with AND logic (all must be true)
 */
export function evaluateAllConditions(conditions: GameCondition[], store: GameStore): boolean {
  return conditions.every(condition => evaluateCondition(condition, store));
}

/**
 * Evaluates multiple conditions with OR logic (at least one must be true)
 */
export function evaluateAnyCondition(conditions: GameCondition[], store: GameStore): boolean {
  return conditions.some(condition => evaluateCondition(condition, store));
}

function getMetricValue(metric: ConditionMetric, store: GameStore): number {
  const { metrics, gameTime } = store;

  switch (metric) {
    case ConditionMetric.Cash:
      return metrics.cash;
    case ConditionMetric.Reputation:
      return metrics.reputation;
    case ConditionMetric.Expenses:
      return metrics.totalExpenses;
    case ConditionMetric.GameTime:
      return gameTime; // in seconds
    case ConditionMetric.FounderWorkingHours:
      return metrics.founderWorkingHours;
    default:
      console.warn(`[Condition System] Unknown metric: ${metric}`);
      return 0;
  }
}
