import { EffectType, GameMetric } from '@/lib/game/effectManager';

export type EventCategory = 'opportunity' | 'risk';

// export type OneTimeCostCategory = 'upgrade' | 'repair' | 'event';

export type GameEventEffect =
  | { type: 'cash'; amount: number; label?: string }
  | { type: 'reputation'; amount: number }

export interface GameEventTemporaryEffect {
  metric: GameMetric;
  type: EffectType;
  value: number;
  durationSeconds: number;
  priority?: number;
}

export interface GameEventConsequence {
  id: string;
  label?: string;
  description?: string;
  weight: number; // Positive integer weight; higher values increase selection chance
  effects: GameEventEffect[];
  temporaryEffects?: GameEventTemporaryEffect[];
}

export interface GameEventChoice {
  id: string;
  label: string;
  description?: string;
  cost?: number; // upfront cash cost (positive number) shown before selection
  consequences: GameEventConsequence[];
}

export interface GameEvent {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  choices: GameEventChoice[];
}
