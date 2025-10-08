export type EventCategory = 'opportunity' | 'risk';

export type OneTimeCostCategory = 'upgrade' | 'repair' | 'event';

export type GameEventEffect =
  | { type: 'cash'; amount: number; label?: string }
  | { type: 'reputation'; amount: number }
  | { type: 'oneTimeCost'; amount: number; label: string; category?: OneTimeCostCategory };

export interface GameEventChoice {
  id: string;
  label: string;
  description?: string;
  effects: GameEventEffect[];
  isDefault?: boolean; // New: indicates if this is the default choice for auto-selection
}

export interface GameEvent {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  narrative: string;
  choices: GameEventChoice[];
}
