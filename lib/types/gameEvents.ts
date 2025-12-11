import { EffectType, GameMetric } from '@/lib/game/effectManager';
import type { Requirement } from '@/lib/game/types';
import type { EventCategoryType } from '@/lib/game/constants/eventCategories';

// Enum for event effect types - single source of truth
// Prevents typos and makes refactoring easier
export enum EventEffectType {
  Cash = 'cash',
  Exp = 'exp',
  DynamicCash = 'dynamicCash',
  Metric = 'metric',
}

// export type OneTimeCostCategory = 'upgrade' | 'repair' | 'event';

export type GameEventEffect =
  | { type: EventEffectType.Cash; amount: number; label?: string }
  | { type: EventEffectType.DynamicCash; expression: string; label?: string }
  | { type: EventEffectType.Exp; amount: number }
  | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: number; durationMonths?: number | null; priority?: number }

export interface DelayedConsequence {
  id: string;
  delaySeconds: number;
  successRequirements?: Requirement[]; // Optional - if not set or empty, defaults to success
  successEffects: GameEventEffect[];
  failureEffects?: GameEventEffect[]; // Optional - can have success-only delayed consequences
  label?: string;
  successDescription?: string; // Description shown on success
  failureDescription?: string; // Description shown on failure
}

export interface GameEventConsequence {
  id: string;
  label?: string;
  description?: string;
  weight: number; // Positive integer weight; higher values increase selection chance
  effects: GameEventEffect[];
  delayedConsequence?: DelayedConsequence; // Optional delayed consequence
}

export interface GameEventChoice {
  id: string;
  label: string;
  description?: string;
  cost?: number; // upfront cash cost (positive number) shown before selection
  timeCost?: number; // upfront time cost (positive number) shown before selection
  consequences: GameEventConsequence[];
  setsFlag?: string; // Optional flag to set when this choice is selected
}

export interface GameEvent {
  id: string;
  title: string;
  category: EventCategoryType;
  summary?: string;
  choices: GameEventChoice[];
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
}
