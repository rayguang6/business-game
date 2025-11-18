import { EffectType, GameMetric } from '@/lib/game/effectManager';
import type { Requirement } from '@/lib/game/types';

export type EventCategory = 'opportunity' | 'risk';

// export type OneTimeCostCategory = 'upgrade' | 'repair' | 'event';

export type GameEventEffect =
  | { type: 'cash'; amount: number; label?: string }
  | { type: 'dynamicCash'; expression: string; label?: string }
  | { type: 'skillLevel'; amount: number } // Previously: 'reputation'
  | { type: 'metric'; metric: GameMetric; effectType: EffectType; value: number; durationSeconds?: number | null; priority?: number }

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
