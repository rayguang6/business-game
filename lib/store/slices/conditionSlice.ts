import { StateCreator } from 'zustand';
import { GameCondition, ConditionOperator, ConditionMetric } from '@/lib/types/conditions';
import { GameStore } from '../gameStore';

export interface ConditionSlice {
  availableConditions: GameCondition[];
  setAvailableConditions: (conditions: GameCondition[]) => void;
}

export const createConditionSlice: StateCreator<GameStore, [], [], ConditionSlice> = (set, get) => ({
  availableConditions: [],
  setAvailableConditions: (conditions: GameCondition[]) => {
    set({ availableConditions: conditions });
  },
});

// Utility functions for condition management
export function createEmptyCondition(): Omit<GameCondition, 'id'> {
  return {
    name: '',
    description: '',
    metric: ConditionMetric.Cash,
    operator: 'greater' as ConditionOperator,
    value: 0,
  };
}

export function validateCondition(condition: Partial<GameCondition>): string | null {
  if (!condition.name?.trim()) {
    return 'Condition name is required';
  }

  if (!condition.metric) {
    return 'Metric is required';
  }

  if (!condition.operator) {
    return 'Operator is required';
  }

  if (typeof condition.value !== 'number' || isNaN(condition.value)) {
    return 'Value must be a valid number';
  }

  return null;
}

export function getConditionDescription(condition: GameCondition): string {
  const operatorSymbols = {
    greater: '>',
    less: '<',
    equals: '=',
    greater_equal: '≥',
    less_equal: '≤',
  };

  return `${condition.metric} ${operatorSymbols[condition.operator]} ${condition.value}`;
}
