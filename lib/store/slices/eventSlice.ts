import { StateCreator } from 'zustand';
import { GameEvent } from '../../types/gameEvents';
import type { GameStore } from '../gameStore';

export interface EventSlice {
  currentEvent: GameEvent | null;
  wasPausedBeforeEvent: boolean;
  setCurrentEvent: (event: GameEvent | null) => void;
}

export const createEventSlice: StateCreator<GameStore, [], [], EventSlice> = (set, get) => ({
  currentEvent: null,
  wasPausedBeforeEvent: false,
  setCurrentEvent: (event) => {
    if (event) {
      const store = get();
      const wasPaused = store.isPaused;
      set({ currentEvent: event, wasPausedBeforeEvent: wasPaused });
      if (!wasPaused) {
        store.pauseGame();
      }
      return;
    }

    const store = get();
    const { wasPausedBeforeEvent } = store;
    set({ currentEvent: null, wasPausedBeforeEvent: false });
    if (!wasPausedBeforeEvent) {
      store.unpauseGame();
    }
  },
});
