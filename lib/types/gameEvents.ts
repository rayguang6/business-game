import { EffectType, GameMetric } from '@/lib/game/effectManager';
import type { Requirement } from '@/lib/game/types';

export type EventCategory = 'opportunity' | 'risk';

// Enum for event effect types - single source of truth
// Prevents typos and makes refactoring easier
export enum EventEffectType {
  Cash = 'cash',
  SkillLevel = 'skillLevel',
  DynamicCash = 'dynamicCash',
  Metric = 'metric',
}

// export type OneTimeCostCategory = 'upgrade' | 'repair' | 'event';

export type GameEventEffect =
  | { type: EventEffectType.Cash; amount: number; label?: string }
  | { type: EventEffectType.DynamicCash; expression: string; label?: string }
  | { type: EventEffectType.SkillLevel; amount: number }
  | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: number; durationSeconds?: number | null; priority?: number }

export interface GameEventConsequence {
  id: string;
  label?: string;
  description?: string;
  weight: number; // Positive integer weight; higher values increase selection chance
  effects: GameEventEffect[];
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
  category: EventCategory;
  summary: string;
  choices: GameEventChoice[];
  requirements?: Requirement[]; // Array of requirements (all must be met = AND logic)
}
