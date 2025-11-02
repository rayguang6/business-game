import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { IndustryId } from '@/lib/game/types';

export interface FlagSlice {
  availableFlags: GameFlag[];
  setAvailableFlags: (flags: GameFlag[]) => void;
}

export const createFlagSlice: StateCreator<GameStore, [], [], FlagSlice> = (set, get) => ({
  availableFlags: [],

  setAvailableFlags: (flags) => {
    set({ availableFlags: flags });
  },
});
