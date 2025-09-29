import { Industry } from '../industry/types';

export interface GameState {
  selectedIndustry: Industry | null;
  isGameStarted: boolean;
  isPaused: boolean;
  gameTime: number; // in seconds
  gameTick: number; // increments every 100ms
}

export interface GameActions {
  setSelectedIndustry: (industry: Industry) => void;
  startGame: () => void;
  stopGame: () => void;
  pauseGame: () => void;
  unpauseGame: () => void;
  resetGame: () => void;
  resetAllGame: () => void;
}
